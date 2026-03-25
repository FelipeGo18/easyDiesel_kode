import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { BellRing, ClipboardList, Fuel, Loader2, Minus, Plus, Receipt, ShieldCheck, TimerReset, Truck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { InputField, SelectField, TextAreaField } from '@/components/ui/FormFields';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/useToast';
import { useAuth } from '@/context/useAuth';
import { getErrorMessage } from '@/lib/http';
import { inventarioService, tanquesService, type CierreTurnoData, type EntradaDirectaData, type RegistrarTransaccionData } from '@/services/inventario';
import { preciosService, type PrecioActual } from '@/services/precios';
import type { AuthenticatedUser, CierreTurnoResult, EntregaDistribuidor, Tanque, TipoServicio, TransaccionCombustible } from '@/types';

const tipoServicioOptions: { value: TipoServicio; label: string; helper: string }[] = [
    { value: 'PUBLICO', label: 'Público', helper: 'Servicio público habilitado para subsidio ($2.350/gal).' },
    { value: 'DIPLOMATICO', label: 'Diplomático', helper: 'Casos especiales definidos por norma.' },
    { value: 'OFICIAL', label: 'Oficial', helper: 'Operación institucional o gubernamental.' },
    { value: 'PARTICULAR', label: 'Particular', helper: 'Aplica precio pleno sin subsidio.' },
];

function formatCurrency(value: number) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
    }).format(value);
}

function formatGallons(value: number) {
    return new Intl.NumberFormat('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(value);
}

function normalizePlate(value: string) {
    return value.trim().toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9-]/g, '');
}

export function StationOperationsPage() {
    const { user } = useAuth();
    const toast = useToast();
    const currentUser = user as AuthenticatedUser | null;
    const station = currentUser?.estacion;
    const stationId = station?.id;
    const zoneId = station?.zonaId;

    const [tanques, setTanques] = useState<Tanque[]>([]);
    const [loading, setLoading] = useState(true);
    const [pricingLoading, setPricingLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [pendingDeliveriesLoading, setPendingDeliveriesLoading] = useState(false);
    const [pricePreview, setPricePreview] = useState<PrecioActual | null>(null);
    const [_priceError, setPriceError] = useState<string | null>(null);
    const [pendingDeliveries, setPendingDeliveries] = useState<EntregaDistribuidor[]>([]);
    const [confirmDeliveryOpen, setConfirmDeliveryOpen] = useState(false);
    const [selectedDelivery, setSelectedDelivery] = useState<EntregaDistribuidor | null>(null);
    const [distribuciones, setDistribuciones] = useState<{ tanqueId: string; galones: string }[]>([{ tanqueId: '', galones: '0' }]);
    const [directEntryOpen, setDirectEntryOpen] = useState(false);
    const [directEntryForm, setDirectEntryForm] = useState({
        tanqueId: '',
        galones: '0',
        precioUnitario: '0',
        observaciones: '',
    });
    const [ventas, setVentas] = useState<TransaccionCombustible[]>([]);
    const [ventasLoading, setVentasLoading] = useState(false);
    const [cierreModalOpen, setCierreModalOpen] = useState(false);
    const [cierreForm, setCierreForm] = useState({ tanqueId: '', nivelFisico: '0', observaciones: '' });
    const [cierreResult, setCierreResult] = useState<CierreTurnoResult | null>(null);
    const [verificandoConsumo, setVerificandoConsumo] = useState(false);
    const [inputMode, setInputMode] = useState<'PRECIO' | 'GALONES'>('PRECIO');
    const [form, setForm] = useState({
        tanqueId: '',
        tipoServicio: 'PARTICULAR' as TipoServicio,
        galones: '',
        precioTotalInput: '',
        placaVehiculo: '',
        esGranConsumidor: false,
    });

    const fetchTanques = useCallback(async () => {
        if (!stationId) {
            setTanques([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await tanquesService.getAll(stationId);
            const nextTanques = Array.isArray(response) ? response : [];
            setTanques(nextTanques);
            setForm((current) => ({
                ...current,
                tanqueId: current.tanqueId || nextTanques[0]?.id || '',
            }));
        } catch (error: unknown) {
            toast.error(`Error al cargar tanques: ${getErrorMessage(error)}`);
        } finally {
            setLoading(false);
        }
    }, [stationId]); // toast excluded — stable after ToastProvider useMemo fix

    const fetchPendingDeliveries = useCallback(async () => {
        if (!stationId) {
            setPendingDeliveries([]);
            setPendingDeliveriesLoading(false);
            return;
        }

        try {
            setPendingDeliveriesLoading(true);
            const response = await inventarioService.listarEntregasPendientes(stationId);
            setPendingDeliveries(response.data ?? []);
        } catch (error: unknown) {
            toast.error(`Error al cargar entregas pendientes: ${getErrorMessage(error)}`);
        } finally {
            setPendingDeliveriesLoading(false);
        }
    }, [stationId]); // toast excluded — stable after ToastProvider useMemo fix

    const fetchVentas = useCallback(async () => {
        if (!stationId) { setVentas([]); return; }
        try {
            setVentasLoading(true);
            const result = await inventarioService.listarTransacciones({ estacionId: stationId, limit: 20 });
            setVentas(result.data ?? []);
        } catch {
            // non-critical — no toast to avoid noise
        } finally {
            setVentasLoading(false);
        }
    }, [stationId]);

    useEffect(() => { fetchTanques(); }, [fetchTanques]);
    useEffect(() => { fetchPendingDeliveries(); }, [fetchPendingDeliveries]);
    useEffect(() => { fetchVentas(); }, [fetchVentas]);

    useEffect(() => {
        const placa = normalizePlate(form.placaVehiculo);
        if (placa.length < 5) {
            if (form.esGranConsumidor) {
                setForm(prev => ({ ...prev, esGranConsumidor: false }));
            }
            return;
        }

        const timeoutId = setTimeout(async () => {
            try {
                setVerificandoConsumo(true);
                const result = await inventarioService.verificarConsumoMes(placa);
                if (result?.esGranConsumidor) {
                    setForm(prev => ({ ...prev, esGranConsumidor: true }));
                } else {
                    setForm(prev => ({ ...prev, esGranConsumidor: false }));
                }
            } catch (error) {
                console.error('Error verificando consumo mensual', error);
            } finally {
                setVerificandoConsumo(false);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [form.placaVehiculo]);

    const selectedTanque = useMemo(
        () => tanques.find((tanque) => tanque.id === form.tanqueId) ?? tanques[0] ?? null,
        [form.tanqueId, tanques]
    );

    useEffect(() => {
        let cancelled = false;

        async function fetchPricePreview() {
            if (!zoneId || !selectedTanque) {
                setPricePreview(null);
                setPriceError(zoneId ? null : 'La estación no tiene zona regulatoria asociada.');
                return;
            }

            try {
                setPricingLoading(true);
                setPriceError(null);
                const preview = await preciosService.consultarActual({
                    zonaId: zoneId,
                    tipoCombustible: selectedTanque.tipoCombustible,
                    tipoServicio: form.tipoServicio,
                });

                if (!cancelled) {
                    setPricePreview(preview);
                }
            } catch (error: unknown) {
                if (!cancelled) {
                    setPricePreview(null);
                    setPriceError(getErrorMessage(error, 'No fue posible consultar el precio vigente'));
                }
            } finally {
                if (!cancelled) {
                    setPricingLoading(false);
                }
            }
        }

        fetchPricePreview();

        return () => {
            cancelled = true;
        };
    }, [form.tipoServicio, selectedTanque, zoneId]);

    const unitPrice = Number(pricePreview?.precioGalon ?? 0);
    const subsidy = Number(pricePreview?.subsidioGalon ?? 0);
    const basePrice = unitPrice + subsidy; // Valor configurado en el surtidor (sin subsidio)

    const gallons = inputMode === 'PRECIO' 
        ? (basePrice > 0 ? (Number(form.precioTotalInput) || 0) / basePrice : 0)
        : (Number(form.galones) || 0);
    
    const estimatedTotal = gallons * unitPrice; // Lo que realmente paga el cliente
    const lowTanks = tanques.filter((tanque) => Number(tanque.nivelActual) <= Number(tanque.nivelMinimo));
    const selectedServiceMeta = tipoServicioOptions.find((option) => option.value === form.tipoServicio);
    const totalAsignado = distribuciones.reduce((s, d) => s + (Number(d.galones) || 0), 0);
    const esperado = Number(selectedDelivery?.galones || 0);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!stationId || !selectedTanque) {
            toast.error('No hay una estación o un tanque operativo asociado al usuario.');
            return;
        }

        if (gallons <= 0) {
            toast.error('Ingresa una cantidad de galones mayor a 0.');
            return;
        }

        setSubmitting(true);
        try {
            const result = await inventarioService.registrarTransaccion({
                estacionId: stationId,
                tanqueId: selectedTanque.id,
                tipo: 'SALIDA',
                tipoCombustible: selectedTanque.tipoCombustible,
                tipoServicio: form.tipoServicio,
                galones: gallons,
                placaVehiculo: normalizePlate(form.placaVehiculo) || undefined,
                esGranConsumidor: form.esGranConsumidor || undefined,
            } satisfies RegistrarTransaccionData);

            const totalFacturado = Number(result.transaccion.precioTotal);
            toast.success(`Venta registrada por ${formatCurrency(totalFacturado)}`);

            if (result.alerta) {
                toast.error(result.alerta);
            }

            setForm((current) => ({
                ...current,
                galones: '',
                precioTotalInput: '',
                placaVehiculo: '',
                esGranConsumidor: false,
            }));
            await fetchTanques();
            fetchVentas();
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, 'No fue posible registrar la venta'));
        } finally {
            setSubmitting(false);
        }
    };

    const compatibleTanques = useMemo(
        () => selectedDelivery ? tanques.filter(t => t.tipoCombustible === selectedDelivery.tipoCombustible) : [],
        [selectedDelivery, tanques]
    );

    const openConfirmDelivery = (delivery: EntregaDistribuidor) => {
        setSelectedDelivery(delivery);
        const firstCompatible = tanques.find(t => t.tipoCombustible === delivery.tipoCombustible);
        setDistribuciones([{
            tanqueId: delivery.tanqueId ?? firstCompatible?.id ?? '',
            galones: String(Number(delivery.galones) || 0),
        }]);
        setConfirmDeliveryOpen(true);
    };

    const addDistribucion = () => {
        const usedIds = new Set(distribuciones.map(d => d.tanqueId));
        const nextTank = compatibleTanques.find(t => !usedIds.has(t.id));
        setDistribuciones(prev => [...prev, { tanqueId: nextTank?.id ?? '', galones: '0' }]);
    };

    const removeDistribucion = (index: number) => {
        setDistribuciones(prev => prev.filter((_, i) => i !== index));
    };

    const updateDistribucion = (index: number, field: 'tanqueId' | 'galones', value: string) => {
        setDistribuciones(prev => {
            const next = prev.map((d, i) => i === index ? { ...d, [field]: value } : d);
            // Auto-redistribute remainder when galones change
            if (field === 'galones' && next.length > 1 && esperado > 0) {
                const changed = Number(value) || 0;
                const otherIndexes = next.map((_, i) => i).filter(i => i !== index);
                const remainder = Math.max(0, esperado - changed);
                // If only 1 other tank, assign all remainder to it
                if (otherIndexes.length === 1) {
                    next[otherIndexes[0]] = { ...next[otherIndexes[0]], galones: String(Number(remainder.toFixed(2))) };
                } else {
                    // Split remainder evenly across other tanks
                    const perTank = Number((remainder / otherIndexes.length).toFixed(2));
                    otherIndexes.forEach(i => {
                        next[i] = { ...next[i], galones: String(perTank) };
                    });
                }
            }
            return next;
        });
    };

    const handleConfirmDelivery = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!stationId || !selectedDelivery) {
            toast.error('No hay una entrega pendiente seleccionada.');
            return;
        }

        const parsed = distribuciones.map(d => ({ tanqueId: d.tanqueId, galones: Number(d.galones) || 0 }));
        if (parsed.some(d => !d.tanqueId)) {
            toast.error('Selecciona un tanque para cada distribución.');
            return;
        }
        if (parsed.some(d => d.galones <= 0)) {
            toast.error('Ingresa una cantidad mayor a 0 para cada tanque.');
            return;
        }

        setSubmitting(true);
        try {
            const result = await inventarioService.confirmarEntregaMulti(selectedDelivery.id, {
                estacionId: stationId,
                distribuciones: parsed,
            });

            toast.success(`Entrega confirmada: ${formatGallons(result.totalGalonesRecibidos)} gal distribuidos en ${result.transacciones.length} tanque(s)`);
            if (result.alerta) {
                toast.error(result.alerta);
            }

            setConfirmDeliveryOpen(false);
            setSelectedDelivery(null);
            await Promise.all([fetchTanques(), fetchPendingDeliveries()]);
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, 'No fue posible confirmar la entrega'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleCierre = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!stationId || !cierreForm.tanqueId) {
            toast.error('Selecciona un tanque para el cierre.');
            return;
        }
        const nivelFisico = Number(cierreForm.nivelFisico);
        if (isNaN(nivelFisico) || nivelFisico < 0) {
            toast.error('Ingresa un nivel físico válido (≥ 0).');
            return;
        }
        setSubmitting(true);
        try {
            const result = await inventarioService.cierreTurno({
                estacionId: stationId,
                tanqueId: cierreForm.tanqueId,
                nivelFisico,
                observaciones: cierreForm.observaciones || undefined,
            } satisfies CierreTurnoData);
            setCierreResult(result);
            toast.success(`Cierre completado. Diferencia: ${result.diferencia > 0 ? '+' : ''}${result.diferencia.toFixed(2)} gal`);
            await fetchTanques();
            fetchVentas();
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, 'Error al realizar el cierre de turno'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDirectEntry = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!stationId) {
            toast.error('No hay una estación asociada al usuario.');
            return;
        }

        const selectedTanqueForEntry = tanques.find(t => t.id === directEntryForm.tanqueId) ?? tanques[0];
        if (!selectedTanqueForEntry) {
            toast.error('Selecciona un tanque para recibir el combustible.');
            return;
        }

        const galones = Number(directEntryForm.galones);
        const precioUnitario = Number(directEntryForm.precioUnitario);

        if (galones <= 0) {
            toast.error('Ingresa una cantidad de galones mayor a 0.');
            return;
        }
        if (precioUnitario <= 0) {
            toast.error('Ingresa un precio unitario válido.');
            return;
        }

        setSubmitting(true);
        try {
            const payload: EntradaDirectaData = {
                estacionId: stationId,
                tanqueId: selectedTanqueForEntry.id,
                tipoCombustible: selectedTanqueForEntry.tipoCombustible,
                galones,
                precioUnitario,
                observaciones: directEntryForm.observaciones || undefined,
            };
            const result = await inventarioService.registrarEntradaDirecta(payload);
            toast.success(`Entrada directa registrada: ${formatGallons(galones)} gal cargados al tanque`);
            setDirectEntryOpen(false);
            setDirectEntryForm({ tanqueId: '', galones: '0', precioUnitario: '0', observaciones: '' });
            if (result) await fetchTanques();
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, 'No fue posible registrar la entrada directa'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-5 animate-enter">
            {/* ── Alerta de niveles críticos ── */}
            {lowTanks.length > 0 && (
                <div className="flex items-center gap-3 rounded-[14px] border border-red-500/25 bg-red-500/[0.06] px-4 py-3">
                    <BellRing size={14} className="shrink-0 text-red-400" />
                    <p className="text-[12px] font-medium text-red-300 flex-1">
                        {lowTanks.length === 1 ? '1 tanque en nivel crítico' : `${lowTanks.length} tanques en nivel crítico`}
                        {' · '}{lowTanks.map(t => t.nombre).join(', ')}
                        <span className="ml-2 font-mono text-[10px] text-red-400/60">Decreto 318/2003</span>
                    </p>
                </div>
            )}


            {/* ── Main grid: Form + Sidebar ── */}
            <div className="grid gap-5 lg:grid-cols-1 xl:grid-cols-[1.3fr_0.7fr]">

                {/* Form card */}
                <Card className="rounded-[22px] border-white/10 bg-white/[0.02] backdrop-blur-md p-0 overflow-hidden">
                    {/* Card header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 px-5 py-4">
                        <div>
                            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-500/60">Cabina de despacho</p>
                            <h2 className="mt-1 text-lg font-semibold text-white">Registrar venta</h2>
                        </div>
                        <div className="rounded-[12px] border border-white/8 bg-white/4 px-4 py-2 text-right">
                            <p className="text-[10px] font-mono uppercase tracking-wider text-white/35">Total estimado</p>
                            <p className="mt-0.5 text-[18px] font-semibold text-white tabular-nums">
                                {estimatedTotal > 0 ? formatCurrency(estimatedTotal) : '—'}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-5 space-y-5">
                        {/* Section: Tank picker */}
                        <div>
                            <p className="mb-2.5 text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">Seleccionar tanque</p>
                            <div className="grid gap-2.5 sm:grid-cols-2">
                                {tanques.map((tanque) => {
                                    const percentage = ((Number(tanque.nivelActual) || 0) / (Number(tanque.capacidadGalones) || 1)) * 100;
                                    const isSelected = tanque.id === selectedTanque?.id;
                                    const isLow = Number(tanque.nivelActual) <= Number(tanque.nivelMinimo);

                                    return (
                                        <button
                                            key={tanque.id}
                                            type="button"
                                            onClick={() => setForm((current) => ({ ...current, tanqueId: tanque.id }))}
                                            className={[
                                                'rounded-[16px] border p-3.5 text-left transition-all cursor-pointer',
                                                isSelected
                                                    ? 'border-amber-500/40 bg-amber-500/8 ring-1 ring-amber-500/20'
                                                    : 'border-white/8 bg-white/[0.02] hover:border-white/14 hover:bg-white/4',
                                            ].join(' ')}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="text-[13px] font-semibold text-white truncate">{tanque.nombre}</p>
                                                    <p className="text-[10px] font-mono text-white/40 mt-0.5">{tanque.tipoCombustible}</p>
                                                </div>
                                                <Badge variant={isLow ? 'red' : isSelected ? 'amber' : 'blue'} className="text-[10px] shrink-0">
                                                    {Math.round(percentage)}%
                                                </Badge>
                                            </div>
                                            <div className="mt-3 h-1.5 rounded-full bg-white/8">
                                                <div
                                                    className={`h-1.5 rounded-full transition-all ${isLow ? 'bg-red-500' : 'bg-amber-500'}`}
                                                    style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                                                />
                                            </div>
                                            <p className="mt-2 text-[11px] text-white/45">
                                                {formatGallons(Number(tanque.nivelActual))} / {formatGallons(Number(tanque.capacidadGalones))} gal
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>

                            {!loading && tanques.length === 0 && (
                                <div className="rounded-[16px] border border-dashed border-white/10 bg-white/[0.02] p-5 text-[13px] text-white/50">
                                    No hay tanques configurados. Crea al menos uno para operar el panel.
                                </div>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="border-t border-white/5" />

                        {/* Section: Service + fields */}
                        <div className="space-y-3.5">
                            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">Datos del despacho</p>

                            <SelectField
                                label="Tipo de servicio"
                                value={form.tipoServicio}
                                onChange={(event) => setForm((current) => ({ ...current, tipoServicio: event.target.value as TipoServicio }))}
                                options={tipoServicioOptions.map((option) => ({ value: option.value, label: option.label }))}
                            />

                            {selectedServiceMeta && (
                                <p className="text-[11px] text-white/45 leading-4 pl-1">{selectedServiceMeta.helper}</p>
                            )}

                            {/* Auto-detected Gran Consumidor Badge */}
                            {form.esGranConsumidor && (
                                <div className="flex items-center gap-3 rounded-[14px] border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 animate-in fade-in slide-in-from-top-1">
                                    <ShieldCheck size={18} className="text-red-400 shrink-0" />
                                    <div>
                                        <p className="text-[12px] font-medium text-white">
                                            Gran Consumidor Autodetectado
                                            <span className="ml-1.5 font-mono text-[9px] text-red-400/70">Decreto 763/2024</span>
                                        </p>
                                        <p className="text-[11px] text-red-200/60 mt-0.5">&gt;20.000 gal/mes (Aplica tarifa plena sin subsidio).</p>
                                    </div>
                                </div>
                            )}

                            {/* Input Mode Toggle */}
                            <div className="flex rounded-[14px] border border-white/10 bg-white/[0.02] p-1">
                                <button
                                    type="button"
                                    onClick={() => setInputMode('PRECIO')}
                                    className={`flex-1 rounded-[10px] px-3 py-2 text-[12px] font-medium transition-all ${
                                        inputMode === 'PRECIO' ? 'bg-amber-500/15 text-amber-400 shadow-sm' : 'text-white/45 hover:text-white/75'
                                    }`}
                                >
                                    Por Valor ($)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setInputMode('GALONES')}
                                    className={`flex-1 rounded-[10px] px-3 py-2 text-[12px] font-medium transition-all ${
                                        inputMode === 'GALONES' ? 'bg-amber-500/15 text-amber-400 shadow-sm' : 'text-white/45 hover:text-white/75'
                                    }`}
                                >
                                    Por Galones
                                </button>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                {inputMode === 'PRECIO' ? (
                                    <InputField
                                        label="Valor marcado en surtidor ($)"
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={form.precioTotalInput}
                                        onChange={(event) => setForm((current) => ({ ...current, precioTotalInput: event.target.value }))}
                                        required
                                    />
                                ) : (
                                    <InputField
                                        label="Galones a despachar"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.galones}
                                        onChange={(event) => setForm((current) => ({ ...current, galones: event.target.value }))}
                                        required
                                    />
                                )}
                                <div className="relative">
                                    <InputField
                                        label="Placa del vehículo"
                                        placeholder="ABC123"
                                        value={form.placaVehiculo}
                                        onChange={(event) => setForm((current) => ({ ...current, placaVehiculo: normalizePlate(event.target.value) }))}
                                    />
                                    {verificandoConsumo && (
                                        <div className="absolute right-3 top-[34px]">
                                            <Loader2 size={16} className="animate-spin text-amber-500/60" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Price summary strip */}
                        <div className={`grid ${subsidy > 0 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'} gap-2 sm:gap-0 sm:divide-x sm:divide-amber-500/10 rounded-[14px] border border-amber-500/12 bg-amber-500/[0.04] overflow-hidden`}>
                            {[
                                { label: 'Precio/gal', value: unitPrice ? formatCurrency(unitPrice) : '—', show: true },
                                { label: 'Subsidio', value: subsidy > 0 ? formatCurrency(subsidy) : '—', show: subsidy > 0 },
                                { label: 'Galones', value: gallons > 0 ? formatGallons(gallons) : '0', show: true },
                                { label: 'Total', value: estimatedTotal > 0 ? formatCurrency(estimatedTotal) : '$ 0', show: true },
                            ]
                                .filter(item => item.show)
                                .map(({ label, value }) => (
                                    <div key={label} className="px-2 py-3 text-center">
                                        <p className="text-[9px] font-mono uppercase tracking-wider text-amber-200/50">{label}</p>
                                        <p className="mt-1 px-1 h-5 overflow-hidden text-ellipsis whitespace-nowrap text-[12px] sm:text-[13px] font-semibold text-white tabular-nums">{value}</p>
                                    </div>
                                ))}
                        </div>

                        {/* Compliance note */}
                        <div className="flex items-center gap-2.5 rounded-[12px] border border-white/6 bg-white/[0.02] px-3.5 py-2.5">
                            <ShieldCheck size={14} className="shrink-0 text-emerald-400" />
                            <p className="text-[11px] text-white/45 leading-4">
                                {pricePreview
                                    ? `Tarifa ${pricePreview.zona.nombre} · Decreto ${pricePreview.decreto.numero}`
                                    : 'El backend revalida la tarifa al confirmar. La previsualización es referencial.'}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-end gap-2.5 pt-1">
                            <Button type="button" variant="ghost" onClick={fetchTanques}>
                                Actualizar niveles
                            </Button>
                            <Button
                                type="submit"
                                isLoading={submitting || loading || pricingLoading}
                                disabled={!selectedTanque || tanques.length === 0 || !form.placaVehiculo || Number(form.galones) <= 0}
                            >
                                Confirmar despacho
                            </Button>
                        </div>
                    </form>
                </Card>

                {/* Sidebar */}
                <div className="space-y-4">

                    {/* Entregas pendientes */}
                    <Card className="rounded-[22px] border-white/10 bg-white/[0.02] backdrop-blur-md">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                                <div className="rounded-[12px] border border-emerald-500/20 bg-emerald-500/8 p-2.5 text-emerald-400">
                                    <Truck size={15} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-mono uppercase tracking-wider text-white/35">Recepción</p>
                                    <h3 className="text-[14px] font-semibold text-white">Entregas pendientes</h3>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setDirectEntryForm({ tanqueId: tanques[0]?.id ?? '', galones: '0', precioUnitario: '0', observaciones: '' });
                                    setDirectEntryOpen(true);
                                }}
                                className="flex items-center gap-1 rounded-[10px] border border-emerald-500/22 bg-emerald-500/[0.06] px-2.5 py-1.5 text-[11px] font-medium text-emerald-300 transition-colors hover:bg-emerald-500/12 cursor-pointer"
                            >
                                <Plus size={12} />
                                Entrada directa
                            </button>
                        </div>

                        <div className="mt-4 space-y-2.5">
                            {pendingDeliveriesLoading && (
                                <div className="rounded-[12px] bg-white/[0.03] px-4 py-4 text-[12px] text-white/45 animate-pulse">
                                    Cargando entregas…
                                </div>
                            )}
                            {!pendingDeliveriesLoading && pendingDeliveries.length === 0 && (
                                <div className="rounded-[12px] border border-emerald-500/15 bg-emerald-500/[0.04] px-4 py-3 text-[12px] text-emerald-200/70">
                                    Sin entregas pendientes para confirmar.
                                </div>
                            )}
                            {pendingDeliveries.map((delivery) => (
                                <div key={delivery.id} className="rounded-[14px] border border-white/7 bg-white/[0.02] px-4 py-3.5">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="text-[13px] font-semibold text-white truncate">Rem. {delivery.numeroRemision}</p>
                                            <p className="mt-0.5 text-[11px] text-white/45 truncate">
                                                {delivery.distribuidor?.nombre || 'Distribuidor'} · {delivery.tipoCombustible} · {formatGallons(Number(delivery.galones))} gal
                                            </p>
                                        </div>
                                        <Badge variant="blue" className="text-[10px] shrink-0">Pendiente</Badge>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between gap-2">
                                        <p className="text-[10px] text-white/35">
                                            {new Date(delivery.fechaEntrega).toLocaleDateString('es-CO')}
                                        </p>
                                        <Button type="button" variant="ghost" onClick={() => openConfirmDelivery(delivery)} className="text-[11px] px-2.5 py-1">
                                            Confirmar
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Checklist + Cierre (merged card) */}
                    <Card className="rounded-[22px] border-white/10 bg-white/[0.02] backdrop-blur-md">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="rounded-[12px] border border-white/8 bg-white/4 p-2.5 text-amber-400">
                                <TimerReset size={15} />
                            </div>
                            <div>
                                <p className="text-[10px] font-mono uppercase tracking-wider text-white/35">Foco operativo</p>
                                <h3 className="text-[14px] font-semibold text-white">Checklist de turno</h3>
                            </div>
                        </div>
                        <ul className="space-y-2">
                            {[
                                'Verificar placa y tipo de servicio antes de confirmar.',
                                'Despachar solo desde el tanque correcto.',
                                'Escalar si un tanque cae por debajo del mínimo.',
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-2.5 text-[12px] text-white/55">
                                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/50 mt-1.5" />
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <div className="mt-4 border-t border-white/5 pt-4">
                            <div className="flex items-center gap-2.5 mb-2">
                                <div className="rounded-[12px] border border-amber-500/18 bg-amber-500/6 p-2.5 text-amber-400">
                                    <ClipboardList size={15} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-mono uppercase tracking-wider text-amber-500/50">Operativo</p>
                                    <h3 className="text-[14px] font-semibold text-white">Cierre de turno</h3>
                                </div>
                            </div>
                            <p className="text-[11px] text-white/40 leading-4 mb-3">
                                Compara nivel físico vs. inventario teórico y registra la diferencia.
                            </p>
                            <button
                                type="button"
                                className="w-full rounded-[12px] border border-amber-500/22 bg-amber-500/[0.06] px-4 py-2.5 text-[12px] font-medium text-amber-300 transition-colors hover:bg-amber-500/12 cursor-pointer"
                                onClick={() => {
                                    setCierreResult(null);
                                    setCierreForm({
                                        tanqueId: tanques[0]?.id ?? '',
                                        nivelFisico: String(Number(tanques[0]?.nivelActual ?? '0').toFixed(2)),
                                        observaciones: '',
                                    });
                                    setCierreModalOpen(true);
                                }}
                            >
                                Iniciar cierre de turno
                            </button>
                        </div>
                    </Card>

                    {/* Tank status */}
                    <Card className="rounded-[22px] border-white/10 bg-white/[0.02] backdrop-blur-md">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="rounded-[12px] border border-sky-500/18 bg-sky-500/6 p-2.5 text-sky-400">
                                <Fuel size={15} />
                            </div>
                            <div>
                                <p className="text-[10px] font-mono uppercase tracking-wider text-white/35">Señales de riesgo</p>
                                <h3 className="text-[14px] font-semibold text-white">Estado de tanques</h3>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {loading && (
                                <div className="rounded-[12px] bg-white/[0.03] px-4 py-3 text-[12px] text-white/40 animate-pulse">Cargando…</div>
                            )}
                            {!loading && lowTanks.length === 0 && (
                                <div className="rounded-[12px] border border-emerald-500/15 bg-emerald-500/[0.04] px-3.5 py-2.5 text-[12px] text-emerald-200/70">
                                    Todos los tanques sobre el mínimo operativo.
                                </div>
                            )}
                            {lowTanks.map((tanque) => (
                                <div key={tanque.id} className="flex items-center justify-between gap-3 rounded-[12px] border border-red-500/18 bg-red-500/[0.04] px-3.5 py-2.5">
                                    <div>
                                        <p className="text-[12px] font-semibold text-white">{tanque.nombre}</p>
                                        <p className="text-[10px] text-white/40 mt-0.5">{formatGallons(Number(tanque.nivelActual))} / {formatGallons(Number(tanque.nivelMinimo))} gal mín.</p>
                                    </div>
                                    <Badge variant="red" className="text-[10px] shrink-0">Crítico</Badge>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>





            {/* ── Ventas del turno ── */}
            <Card className="rounded-[28px] border-white/10 bg-white/[0.02] backdrop-blur-md p-0 overflow-hidden">
                <div className="flex items-center justify-between gap-4 border-b border-white/6 px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="rounded-[16px] border border-white/8 bg-white/[0.04] p-3 text-amber-400">
                            <Receipt size={18} />
                        </div>
                        <div>
                            <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-amber-500/70">Historial</p>
                            <h2 className="mt-1 text-xl font-semibold text-white">Ventas del turno</h2>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={fetchVentas}
                        className="text-[12px] text-white/45 hover:text-white/75 transition-colors"
                    >
                        Actualizar
                    </button>
                </div>

                {ventasLoading && (
                    <div className="p-6 space-y-3">
                        {[1, 2, 3].map(i => <div key={i} className="h-10 rounded-[12px] bg-white/[0.04] animate-pulse" />)}
                    </div>
                )}

                {!ventasLoading && ventas.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-14 gap-3 text-white/38">
                        <Receipt size={32} className="opacity-30" />
                        <p className="text-sm">No hay registros de venta en este turno.</p>
                    </div>
                )}

                {!ventasLoading && ventas.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-[12px]">
                            <thead>
                                <tr className="border-b border-white/6">
                                    {['Hora', 'Tanque', 'Servicio', 'Combustible', 'Galones', 'Precio/gal', 'Total', 'Placa'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-white/38">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {ventas.map(v => (
                                    <tr key={v.id} className="hover:bg-white/[0.03] transition-colors">
                                        <td className="px-4 py-3 font-mono text-white/55">
                                            {new Date((v as any).createdAt ?? v.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-4 py-3 text-white/75">{(v as any).tanque?.nombre ?? '\u2014'}</td>
                                        <td className="px-4 py-3">
                                            <Badge variant="blue" className="text-[10px]">{v.tipoServicio}</Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant="amber" className="text-[10px]">{v.tipoCombustible}</Badge>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-white/75">{formatGallons(Number(v.galones))}</td>
                                        <td className="px-4 py-3 font-mono text-white/55">{formatCurrency(Number(v.precioUnitario))}</td>
                                        <td className="px-4 py-3 font-mono text-amber-300">{formatCurrency(Number(v.precioTotal))}</td>
                                        <td className="px-4 py-3 font-mono text-white/45">{v.placaVehiculo || '\u2014'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <Modal
                open={confirmDeliveryOpen}
                onClose={() => {
                    setConfirmDeliveryOpen(false);
                    setSelectedDelivery(null);
                }}
                title={`Confirmar entrega ${selectedDelivery?.numeroRemision || ''}`}
            >
                <form onSubmit={handleConfirmDelivery} className="space-y-4">
                    <div className="rounded-brand border border-border-subtle bg-bg-elevated px-3 py-3 text-[12px] text-text-secondary">
                        Esperado: {formatGallons(esperado)} gal · {selectedDelivery?.tipoCombustible || 'Combustible'}
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-white/50">Distribución por tanque</p>
                            {compatibleTanques.length > distribuciones.length && (
                                <button
                                    type="button"
                                    onClick={addDistribucion}
                                    className="flex items-center gap-1 rounded-[10px] border border-emerald-500/25 bg-emerald-500/[0.08] px-2.5 py-1 text-[11px] font-medium text-emerald-300 transition-colors hover:bg-emerald-500/[0.14]"
                                >
                                    <Plus size={12} /> Agregar tanque
                                </button>
                            )}
                        </div>

                        {distribuciones.map((dist, idx) => {
                            const tank = tanques.find(t => t.id === dist.tanqueId);
                            const gals = Number(dist.galones) || 0;
                            const projected = tank ? Number(tank.nivelActual) + gals : 0;
                            const cap = tank ? Number(tank.capacidadGalones) : 0;
                            const over = tank && projected > cap;

                            return (
                                <div key={idx} className="rounded-[18px] border border-white/8 bg-white/[0.03] p-3 space-y-3">
                                    <div className="flex items-start gap-2">
                                        <div className="flex-1">
                                            <SelectField
                                                label={`Tanque ${idx + 1}`}
                                                value={dist.tanqueId}
                                                onChange={(e) => updateDistribucion(idx, 'tanqueId', e.target.value)}
                                                options={compatibleTanques.map(t => ({
                                                    value: t.id,
                                                    label: `${t.nombre} · ${formatGallons(Number(t.nivelActual))} / ${formatGallons(Number(t.capacidadGalones))} gal`,
                                                }))}
                                            />
                                        </div>
                                        <div className="w-32">
                                            <InputField
                                                label="Galones"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={dist.galones}
                                                onChange={(e) => updateDistribucion(idx, 'galones', e.target.value)}
                                                required
                                            />
                                        </div>
                                        {distribuciones.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeDistribucion(idx)}
                                                className="mt-6 rounded-[8px] border border-red-500/25 bg-red-500/[0.08] p-1.5 text-red-400 transition-colors hover:bg-red-500/[0.16]"
                                            >
                                                <Minus size={14} />
                                            </button>
                                        )}
                                    </div>
                                    {tank && gals > 0 && (
                                        <div className={`rounded-[10px] border px-2.5 py-1.5 text-[11px] ${
                                            over
                                                ? 'border-red-500/25 bg-red-500/[0.07] text-red-300'
                                                : 'border-white/8 bg-white/[0.03] text-white/55'
                                        }`}>
                                            Nivel: {formatGallons(Number(tank.nivelActual))} → {formatGallons(projected)} / {formatGallons(cap)} gal
                                            {over && ' · Excede capacidad'}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className={`rounded-brand border px-3 py-3 text-[12px] ${
                        Math.abs(totalAsignado - esperado) < 0.01
                            ? 'border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-300'
                            : totalAsignado > esperado
                                ? 'border-amber-500/25 bg-amber-500/[0.07] text-amber-300'
                                : 'border-border-subtle bg-bg-elevated text-text-secondary'
                    }`}>
                        Total asignado: {formatGallons(totalAsignado)} / {formatGallons(esperado)} gal
                        {totalAsignado > esperado && ' (sobrepasa lo esperado)'}
                        {totalAsignado < esperado && totalAsignado > 0 && ` (faltan ${formatGallons(esperado - totalAsignado)} gal)`}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" type="button" onClick={() => {
                            setConfirmDeliveryOpen(false);
                            setSelectedDelivery(null);
                        }}>
                            Cancelar
                        </Button>
                        <Button type="submit" isLoading={submitting} disabled={totalAsignado <= 0}>
                            Confirmar entrega
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                open={directEntryOpen}
                onClose={() => setDirectEntryOpen(false)}
                title="Entrada directa de combustible"
            >
                <form onSubmit={handleDirectEntry} className="space-y-4">
                    <div className="rounded-brand border border-emerald-500/20 bg-emerald-500/[0.07] px-3 py-3 text-[12px] text-emerald-200/80">
                        Registra un ingreso de combustible sin necesidad de una remisión previa de distribuidor. El nivel del tanque se actualiza de inmediato y queda en auditoría.
                    </div>

                    <SelectField
                        label="Tanque receptor"
                        value={directEntryForm.tanqueId}
                        onChange={(e) => setDirectEntryForm(cur => ({ ...cur, tanqueId: e.target.value }))}
                        options={tanques.map(t => ({ value: t.id, label: `${t.nombre} · ${t.tipoCombustible} · ${formatGallons(Number(t.nivelActual))} gal` }))}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                        <InputField
                            label="Galones a cargar"
                            type="number"
                            min="0"
                            step="0.01"
                            value={directEntryForm.galones}
                            onChange={(e) => setDirectEntryForm(cur => ({ ...cur, galones: e.target.value }))}
                            required
                        />
                        <InputField
                            label="Precio unitario ($/gal)"
                            type="number"
                            min="0"
                            step="1"
                            value={directEntryForm.precioUnitario}
                            onChange={(e) => setDirectEntryForm(cur => ({ ...cur, precioUnitario: e.target.value }))}
                            required
                        />
                    </div>

                    <InputField
                        label="Observaciones (opcional)"
                        placeholder="Ej: carga de emergencia, proveedor alterno..."
                        value={directEntryForm.observaciones}
                        onChange={(e) => setDirectEntryForm(cur => ({ ...cur, observaciones: e.target.value }))}
                    />

                    {(() => {
                        const t = tanques.find(tk => tk.id === directEntryForm.tanqueId) ?? tanques[0];
                        const gals = Number(directEntryForm.galones) || 0;
                        if (!t || gals <= 0) return null;
                        const projected = Number(t.nivelActual) + gals;
                        const cap = Number(t.capacidadGalones);
                        const over = projected > cap;
                        return (
                            <div className={`rounded-brand border px-3 py-3 text-[12px] ${over ? 'border-red-500/25 bg-red-500/[0.07] text-red-300' : 'border-border-subtle bg-bg-elevated text-text-secondary'}`}>
                                Nivel proyectado: {formatGallons(projected)} / {formatGallons(cap)} gal
                                {over && ' · Supera la capacidad del tanque'}
                            </div>
                        );
                    })()}

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" type="button" onClick={() => setDirectEntryOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" isLoading={submitting}>
                            Registrar entrada
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* ── Modal: Cierre de turno ── */}
            <Modal
                open={cierreModalOpen}
                onClose={() => { setCierreModalOpen(false); setCierreResult(null); }}
                title="Cierre de turno"
            >
                {cierreResult ? (
                    <div className="space-y-4">
                        <div className="rounded-brand border border-emerald-500/25 bg-emerald-500/[0.07] p-4">
                            <p className="text-[11px] font-mono uppercase tracking-wider text-emerald-300/70 mb-3">Resultado del cierre</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <p className="text-[10px] text-white/45 uppercase tracking-wider">Teórico</p>
                                    <p className="mt-1 text-lg font-semibold text-white">{formatGallons(cierreResult.nivelTeorico)} gal</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-white/45 uppercase tracking-wider">Físico</p>
                                    <p className="mt-1 text-lg font-semibold text-white">{formatGallons(cierreResult.nivelFisico)} gal</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-white/45 uppercase tracking-wider">Diferencia</p>
                                    <p className={`mt-1 text-lg font-semibold ${Math.abs(cierreResult.diferencia) < 0.01 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                        {cierreResult.diferencia > 0 ? '+' : ''}{formatGallons(cierreResult.diferencia)} gal
                                    </p>
                                </div>
                            </div>
                        </div>
                        <Button className="w-full" onClick={() => { setCierreModalOpen(false); setCierreResult(null); }}>
                            Cerrar
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleCierre} className="space-y-4">
                        <div className="rounded-brand border border-amber-500/20 bg-amber-500/[0.05] px-3 py-3 text-[12px] text-amber-200/75">
                            Ingresa el nivel físico observado. El sistema calcula la diferencia respecto al inventario teórico y registra el ajuste.
                        </div>
                        <SelectField
                            label="Tanque a cerrar"
                            value={cierreForm.tanqueId}
                            onChange={e => setCierreForm(c => ({ ...c, tanqueId: e.target.value }))}
                            options={tanques.map(t => ({
                                value: t.id,
                                label: `${t.nombre} · ${t.tipoCombustible} · ${formatGallons(Number(t.nivelActual))} gal (teórico)`,
                            }))}
                        />
                        <InputField
                            label="Nivel físico observado (galones)"
                            type="number"
                            min="0"
                            step="0.01"
                            value={cierreForm.nivelFisico}
                            onChange={e => setCierreForm(c => ({ ...c, nivelFisico: e.target.value }))}
                            required
                        />
                        {(() => {
                            const t = tanques.find(tk => tk.id === cierreForm.tanqueId);
                            const nf = Number(cierreForm.nivelFisico) || 0;
                            if (!t) return null;
                            const diff = nf - Number(t.nivelActual);
                            const cls = Math.abs(diff) < 0.01
                                ? 'border-border-subtle bg-bg-elevated text-text-secondary'
                                : diff > 0
                                    ? 'border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-300'
                                    : 'border-amber-500/25 bg-amber-500/[0.07] text-amber-300';
                            return (
                                <div className={`rounded-brand border px-3 py-3 text-[12px] ${cls}`}>
                                    Diferencia estimada: {diff > 0 ? '+' : ''}{formatGallons(diff)} gal
                                    {Math.abs(diff) >= 0.01 && (diff > 0 ? ' (sobrante)' : ' (faltante)')}
                                </div>
                            );
                        })()}
                        <TextAreaField
                            label="Observaciones (opcional)"
                            placeholder="Causa de la diferencia, novedades del turno..."
                            rows={3}
                            value={cierreForm.observaciones}
                            onChange={e => setCierreForm(c => ({ ...c, observaciones: e.target.value }))}
                        />
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="ghost" type="button" onClick={() => setCierreModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" isLoading={submitting}>
                                Registrar cierre
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
}