import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { BellRing, ClipboardList, Fuel, Loader2, Minus, Plus, Receipt, ShieldCheck, TimerReset, Truck, BookOpen, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
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
    const [pricesData, setPricesData] = useState<{ particular: PrecioActual[], publico: PrecioActual[] }>({ particular: [], publico: [] });
    const [pricesLoading, setPricesLoading] = useState(false);
    const [activeTarifa, setActiveTarifa] = useState<'PARTICULAR' | 'PUBLICO'>('PARTICULAR');
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
    }, [stationId]);

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
    }, [stationId]);

    const fetchVentas = useCallback(async () => {
        if (!stationId) { setVentas([]); return; }
        try {
            setVentasLoading(true);
            const result = await inventarioService.listarTransacciones({ estacionId: stationId, limit: 20 });
            setVentas(result.data ?? []);
        } catch {
            // non-critical
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

    useEffect(() => {
        let cancelled = false;
        async function fetchAllPrices() {
            if (!zoneId || tanques.length === 0) {
                setPricesData({ particular: [], publico: [] });
                return;
            }
            const uniqueFuels = Array.from(new Set(tanques.map(t => t.tipoCombustible)));
            try {
                setPricesLoading(true);
                const promisesParticular = uniqueFuels.map(fuel => 
                    preciosService.consultarActual({ zonaId: zoneId, tipoCombustible: fuel, tipoServicio: 'PARTICULAR' }).catch(() => null)
                );
                const promisesPublico = uniqueFuels.map(fuel => 
                    preciosService.consultarActual({ zonaId: zoneId, tipoCombustible: fuel, tipoServicio: 'PUBLICO' }).catch(() => null)
                );
                
                const [resParticular, resPublico] = await Promise.all([
                    Promise.all(promisesParticular),
                    Promise.all(promisesPublico)
                ]);
                
                if (!cancelled) {
                    setPricesData({
                        particular: resParticular.filter(Boolean) as PrecioActual[],
                        publico: resPublico.filter(Boolean) as PrecioActual[],
                    });
                }
            } catch (error) {
                console.error('Error fetching all prices', error);
            } finally {
                if (!cancelled) {
                    setPricesLoading(false);
                }
            }
        }
        fetchAllPrices();
        return () => { cancelled = true; };
    }, [zoneId, tanques]);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveTarifa(prev => prev === 'PARTICULAR' ? 'PUBLICO' : 'PARTICULAR');
        }, 8000);
        return () => clearInterval(interval);
    }, []);

    const unitPrice = Number(pricePreview?.precioGalon ?? 0);
    const subsidy = Number(pricePreview?.subsidioGalon ?? 0);
    const basePrice = unitPrice + subsidy;

    const gallons = inputMode === 'PRECIO' 
        ? (basePrice > 0 ? (Number(form.precioTotalInput) || 0) / basePrice : 0)
        : (Number(form.galones) || 0);
    
    const estimatedTotal = gallons * unitPrice;
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
            toast.success(`Despacho registrado por ${formatCurrency(totalFacturado)}`);

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
            toast.error(getErrorMessage(error, 'No fue posible registrar el despacho'));
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
            if (field === 'galones' && next.length > 1 && esperado > 0) {
                const changed = Number(value) || 0;
                const otherIndexes = next.map((_, i) => i).filter(i => i !== index);
                const remainder = Math.max(0, esperado - changed);
                if (otherIndexes.length === 1) {
                    next[otherIndexes[0]] = { ...next[otherIndexes[0]], galones: String(Number(remainder.toFixed(2))) };
                } else {
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
        <div className="space-y-8 animate-enter pb-12 max-w-[1440px] mx-auto">
            {/* ── Header Pro Max Estación ── */}
            <section className="relative overflow-hidden rounded-[32px] bg-bg-surface border border-border-subtle p-8 md:p-10 shadow-2xl group transition-all duration-500 hover:border-amber-500/30">
                {/* Background effects */}
                <div className="absolute top-0 right-0 w-1/2 h-full bg-linear-to-bl from-amber-500/10 via-transparent to-transparent opacity-50 pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />
                
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                                <Fuel className="w-3.5 h-3.5 text-amber-500" />
                                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Punto de Servicio: Activo</span>
                            </div>
                            <div className="flex items-center gap-2 bg-bg-elevated border border-border-subtle px-3 py-1 rounded-full">
                                <Badge variant="green" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[8px] px-2 py-0.5">Surtidores Online</Badge>
                            </div>
                        </div>
                        
                        <div>
                            <h1 className="text-4xl md:text-5xl font-display font-bold text-text-primary tracking-tight">
                                Panel de <span className="text-amber-500">Despacho</span>
                            </h1>
                            <p className="mt-3 text-base text-text-secondary max-w-2xl leading-relaxed">
                                Control operativo de la estación <span className="text-text-primary font-bold">{station?.nombre || 'EasyDiesel'}</span>. 
                                Registre ventas, gestione inventarios y verifique precios oficiales en tiempo real.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 min-w-[240px]">
                        <div className="text-[10px] text-text-muted uppercase font-bold tracking-widest px-1">Indicadores Rápidos</div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-bg-base/50 p-3 rounded-2xl border border-border-subtle backdrop-blur-sm">
                                <p className="text-[9px] text-text-muted uppercase font-bold">Ventas Hoy</p>
                                <p className="text-lg font-bold text-text-primary mt-1">{ventas.length}</p>
                            </div>
                            <div className="bg-bg-base/50 p-3 rounded-2xl border border-border-subtle backdrop-blur-sm">
                                <p className="text-[9px] text-text-muted uppercase font-bold">Tanques</p>
                                <p className="text-lg font-bold text-text-primary mt-1">{tanques.length}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Alerta de niveles críticos ── */}
            {lowTanks.length > 0 && (
                <div className="flex items-center gap-4 rounded-2xl border border-red-500/30 bg-red-500/5 p-5 animate-pulse">
                    <div className="p-2 bg-red-500/20 rounded-xl text-red-500 border border-red-500/30">
                        <BellRing size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-red-600 uppercase tracking-tight">Niveles Críticos Detectados</p>
                        <p className="text-xs text-text-secondary mt-1">
                            Tanques bajo el mínimo: <span className="text-red-600 font-bold">{lowTanks.map(t => t.nombre).join(', ')}</span>. Requiere reabastecimiento inmediato.
                        </p>
                    </div>
                    <Badge variant="red" className="font-mono text-[9px]">DECRETO 318</Badge>
                </div>
            )}

            <div className="grid gap-8 lg:grid-cols-1 xl:grid-cols-[1fr_380px]">
                <div className="space-y-8">
                    <Card className="rounded-[32px] border-border-subtle bg-bg-surface shadow-xl p-0 overflow-hidden ring-1 ring-white/5">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-b border-border-subtle px-8 py-6 bg-bg-elevated/40">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500 border border-amber-500/20">
                                    <Fuel size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-text-primary tracking-tight">Nueva Transacción</h2>
                                    <p className="text-xs text-text-muted">Registro oficial de despacho de combustible</p>
                                </div>
                            </div>
                            <div className="rounded-2xl border border-border-subtle bg-bg-base px-6 py-3 text-right shadow-inner">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Total Estimado</p>
                                <p className="mt-1 text-2xl font-black text-amber-500 tabular-nums">
                                    {estimatedTotal > 0 ? formatCurrency(estimatedTotal) : '$ —'}
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 px-1">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Seleccionar Tanque</span>
                                    <div className="h-px flex-1 bg-border-subtle/50" />
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                                                    'rounded-[24px] border p-5 text-left transition-all duration-300 cursor-pointer group relative overflow-hidden',
                                                    isSelected
                                                        ? 'border-amber-500/40 bg-amber-500/5 ring-1 ring-amber-500/20 shadow-lg'
                                                        : 'border-border-subtle bg-bg-base hover:border-amber-500/30 hover:bg-bg-elevated/40 hover:shadow-md',
                                                ].join(' ')}
                                            >
                                                {isSelected && <div className="absolute top-0 right-0 p-3"><Badge variant="amber" className="text-[8px]">SELECTED</Badge></div>}
                                                <div className="flex items-center justify-between gap-3 mb-4">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-text-primary truncate group-hover:text-amber-500 transition-colors">{tanque.nombre}</p>
                                                        <p className="text-[10px] font-mono text-text-muted mt-1 uppercase tracking-tighter">{tanque.tipoCombustible}</p>
                                                    </div>
                                                    <div className={cn(
                                                        "text-lg font-black font-mono",
                                                        isLow ? "text-red-500" : isSelected ? "text-amber-500" : "text-text-muted"
                                                    )}>
                                                        {Math.round(percentage)}%
                                                    </div>
                                                </div>
                                                <div className="h-1.5 rounded-full bg-bg-elevated overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            "h-full rounded-full transition-all duration-1000",
                                                            isLow ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,166,35,0.5)]'
                                                        )}
                                                        style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                                                    />
                                                </div>
                                                <div className="mt-4 flex justify-between items-end">
                                                    <p className="text-[10px] text-text-muted font-medium">
                                                        <span className="text-text-primary font-bold">{formatGallons(Number(tanque.nivelActual))}</span> / {formatGallons(Number(tanque.capacidadGalones))} gal
                                                    </p>
                                                    {isLow && <ShieldAlert size={12} className="text-red-500 animate-pulse" />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                                {!loading && tanques.length === 0 && (
                                    <div className="rounded-2xl border-2 border-dashed border-border-subtle p-10 text-center text-text-muted">
                                        No hay tanques operativos disponibles.
                                    </div>
                                )}
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-2 px-1">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Datos del Despacho</span>
                                    <div className="h-px flex-1 bg-border-subtle/50" />
                                </div>
                                <div className="grid gap-6 lg:grid-cols-2">
                                    <div className="space-y-4">
                                        <SelectField
                                            label="Tipo de servicio"
                                            value={form.tipoServicio}
                                            onChange={(event) => setForm((current) => ({ ...current, tipoServicio: event.target.value as TipoServicio }))}
                                            options={tipoServicioOptions.map((option) => ({ value: option.value, label: option.label }))}
                                            className="rounded-xl border-border-subtle focus:border-amber-500/50"
                                        />
                                        {selectedServiceMeta && (
                                            <div className="p-4 bg-bg-elevated/20 border border-border-subtle rounded-2xl">
                                                <p className="text-[11px] text-text-secondary leading-relaxed font-medium italic">
                                                    <BookOpen size={10} className="inline mr-2 text-amber-500" />
                                                    {selectedServiceMeta.helper}
                                                </p>
                                            </div>
                                        )}
                                        {form.esGranConsumidor && (
                                            <div className="flex items-center gap-4 rounded-2xl border border-red-500/30 bg-red-500/5 px-4 py-3 animate-in fade-in slide-in-from-top-1">
                                                <ShieldCheck size={20} className="text-red-500 shrink-0" />
                                                <div>
                                                    <p className="text-xs font-bold text-red-600 uppercase tracking-tight">Gran Consumidor Detectado</p>
                                                    <p className="text-[10px] text-text-secondary mt-0.5">Aplica tarifa plena (Decreto 763/2024).</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex rounded-2xl border border-border-subtle bg-bg-base p-1.5 shadow-inner">
                                            <button
                                                type="button"
                                                onClick={() => setInputMode('PRECIO')}
                                                className={`flex-1 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-300 ${
                                                    inputMode === 'PRECIO' 
                                                        ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' 
                                                        : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'
                                                }`}
                                            >
                                                Monto en Pesos ($)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setInputMode('GALONES')}
                                                className={`flex-1 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-300 ${
                                                    inputMode === 'GALONES' 
                                                        ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' 
                                                        : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'
                                                }`}
                                            >
                                                Cantidad Galones
                                            </button>
                                        </div>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            {inputMode === 'PRECIO' ? (
                                                <InputField
                                                    label="Valor Surtidor ($)"
                                                    type="number"
                                                    min="0"
                                                    value={form.precioTotalInput}
                                                    onChange={(event) => setForm((current) => ({ ...current, precioTotalInput: event.target.value }))}
                                                    required
                                                    className="rounded-xl border-border-subtle focus:border-amber-500/50"
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
                                                    className="rounded-xl border-border-subtle focus:border-amber-500/50"
                                                />
                                            )}
                                            <div className="relative group">
                                                <InputField
                                                    label="Placa Vehículo"
                                                    placeholder="ABC-123"
                                                    value={form.placaVehiculo}
                                                    onChange={(event) => setForm((current) => ({ ...current, placaVehiculo: normalizePlate(event.target.value) }))}
                                                    className="rounded-xl border-border-subtle focus:border-amber-500/50 uppercase font-mono font-bold"
                                                />
                                                <div className="absolute right-3 top-[34px] flex items-center gap-2">
                                                    {verificandoConsumo && (
                                                        <div className="animate-spin">
                                                            <Loader2 size={16} className="text-amber-500" />
                                                        </div>
                                                    )}
                                                    <div className="group-hover:block hidden absolute bottom-full mb-2 right-0 w-48 p-2 bg-bg-elevated border border-border-subtle rounded-lg text-[10px] text-text-secondary shadow-xl z-50">
                                                        Validación automática contra base de datos RUNT.
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="relative overflow-hidden rounded-[24px] bg-bg-elevated/40 border border-border-subtle p-1 shadow-inner">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <Receipt size={80} className="text-amber-500" />
                                </div>
                                <div className={`relative z-10 grid ${subsidy > 0 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'} gap-px bg-border-subtle/30 overflow-hidden`}>
                                    {[
                                        { label: 'Precio/gal', value: unitPrice ? formatCurrency(unitPrice) : '—', show: true },
                                        { label: 'Subsidio', value: subsidy > 0 ? formatCurrency(subsidy) : '—', show: subsidy > 0 },
                                        { label: 'Galones', value: gallons > 0 ? formatGallons(gallons) : '0', show: true },
                                        { label: 'Total Neto', value: estimatedTotal > 0 ? formatCurrency(estimatedTotal) : '$ 0', show: true },
                                    ]
                                        .filter(item => item.show)
                                        .map(({ label, value }) => (
                                            <div key={label} className="bg-bg-surface px-4 py-6 text-center">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-2">{label}</p>
                                                <p className="text-lg sm:text-xl font-black text-text-primary tabular-nums tracking-tight">{value}</p>
                                            </div>
                                        ))}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-border-subtle/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                                        <ShieldCheck size={16} />
                                    </div>
                                    <p className="text-[11px] text-text-muted leading-relaxed font-medium">
                                        {pricePreview
                                            ? <><span className="text-text-primary font-bold">{pricePreview.zona.nombre}</span> · Decreto {pricePreview.decreto.numero}</>
                                            : 'Validación regulatoria activa en tiempo real.'}
                                    </p>
                                </div>
                                <div className="flex gap-3 w-full sm:w-auto">
                                    <Button type="button" variant="ghost" onClick={fetchTanques} className="rounded-xl px-6 border-border-subtle hover:bg-bg-elevated">
                                        Actualizar Niveles
                                    </Button>
                                    <Button
                                        type="submit"
                                        isLoading={submitting || loading || pricingLoading}
                                        disabled={!selectedTanque || tanques.length === 0 || !form.placaVehiculo || Number(form.galones) <= 0}
                                        className="rounded-xl px-10 bg-amber-500 text-black font-bold shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition-transform flex-1 sm:flex-none"
                                    >
                                        Registrar Despacho
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </Card>

                    <Card className="rounded-[32px] border-border-subtle bg-bg-surface shadow-xl p-0 overflow-hidden ring-1 ring-white/5">
                        <div className="flex items-center justify-between gap-4 border-b border-border-subtle px-8 py-6 bg-bg-elevated/40">
                            <div className="flex items-center gap-4">
                                <div className="rounded-2xl border border-border-subtle bg-bg-base p-3 text-amber-500">
                                    <Receipt size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-text-primary tracking-tight">Despachos del Turno</h2>
                                    <p className="text-xs text-text-muted">Últimos registros de despacho oficial</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={fetchVentas}
                                className="group flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-widest hover:text-amber-400 transition-colors"
                            >
                                <TimerReset size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                                Refrescar
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-bg-base/30 text-[10px] text-text-muted uppercase font-bold tracking-[0.2em] border-b border-border-subtle">
                                        <th className="px-8 py-4 text-left">Hora</th>
                                        <th className="px-8 py-4 text-left">Vehículo / Placa</th>
                                        <th className="px-8 py-4 text-left">Combustible</th>
                                        <th className="px-8 py-4 text-left">Galones</th>
                                        <th className="px-8 py-4 text-right">Total Facturado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-subtle/50">
                                    {ventasLoading ? (
                                        [...Array(3)].map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td colSpan={5} className="px-8 py-4"><div className="h-12 bg-bg-elevated/40 rounded-xl" /></td>
                                            </tr>
                                        ))
                                    ) : ventas.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-12 text-center text-text-muted italic">
                                                No se registran transacciones en el turno actual.
                                            </td>
                                        </tr>
                                    ) : (
                                        ventas.map((v) => (
                                            <tr key={v.id} className="hover:bg-bg-elevated/20 transition-colors group">
                                                <td className="px-8 py-5">
                                                    <span className="font-mono text-xs font-bold text-text-primary">
                                                        {new Date(v.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-bg-base flex items-center justify-center border border-border-subtle group-hover:border-amber-500/30 transition-colors">
                                                            <Truck size={14} className="text-text-muted group-hover:text-amber-500 transition-colors" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black font-mono text-text-primary uppercase">{v.placaVehiculo || 'SIN PLACA'}</p>
                                                            <p className="text-[10px] text-text-muted uppercase tracking-tighter">{v.tipoServicio}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <Badge variant="blue" className="text-[9px] uppercase tracking-wider">{v.tipoCombustible.replace('_', ' ')}</Badge>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="font-mono text-xs font-bold text-text-primary">{formatGallons(Number(v.galones))} GAL</span>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <span className="font-mono text-sm font-black text-amber-500">{formatCurrency(Number(v.precioTotal))}</span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                <div className="space-y-8">
                    <div className="flex flex-col items-center">
                        <div className="w-full rounded-[32px] border-[6px] border-[#1a1c23] bg-[#050505] shadow-2xl overflow-hidden flex flex-col relative z-20 shrink-0">
                            <div className="bg-linear-to-b from-[#111] to-[#050505] py-6 px-8 border-b border-[#1a1c23] flex flex-col items-center justify-center z-10 relative">
                                <span className="text-amber-500/40 text-[10px] font-black tracking-[0.4em] uppercase mb-1.5">easy</span>
                                <span className="text-white font-display text-[28px] tracking-[0.2em] font-black leading-none drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">DIESEL</span>
                            </div>
                            <div className="p-8 flex flex-col gap-8 justify-center z-10">
                                {pricesLoading ? (
                                    <div className="flex flex-col items-center justify-center p-14 text-white/20 gap-4">
                                        <Loader2 size={40} className="animate-spin text-amber-500" />
                                        <span className="text-[10px] font-black tracking-[0.3em] uppercase">Sincronizando...</span>
                                    </div>
                                ) : pricesData.particular.length > 0 || pricesData.publico.length > 0 ? (
                                    Array.from(new Set(tanques.map(t => t.tipoCombustible))).map((fuel, idx) => {
                                        const particularPrice = pricesData.particular.find(p => p.tipoCombustible === fuel);
                                        const publicoPrice = pricesData.publico.find(p => p.tipoCombustible === fuel);
                                        const valParticular = particularPrice ? Number(particularPrice.precioGalon) + Number(particularPrice.subsidioGalon) : 0;
                                        const valPublico = publicoPrice ? Number(publicoPrice.precioGalon) + Number(publicoPrice.subsidioGalon) : 0;
                                        const isDiesel = fuel.toUpperCase().includes('DIESEL');
                                        const colorPart = isDiesel ? 'text-[#F5A623] drop-shadow-[0_0_15px_rgba(245,166,35,0.9)]' : 'text-[#ef4444] drop-shadow-[0_0_15px_rgba(239,68,68,0.9)]';
                                        const colorPub = isDiesel ? 'text-[#06b6d4] drop-shadow-[0_0_12px_rgba(6,182,212,0.9)]' : 'text-[#10B981] drop-shadow-[0_0_15_rgba(16,185,129,0.9)]';
                                        return (
                                            <div key={idx} className="bg-[#0a0a0a] border-2 border-[#1a1c23] rounded-[24px] p-8 flex flex-col items-center shadow-inner relative overflow-hidden group">
                                                <h4 className="text-[11px] font-black tracking-[0.3em] text-white/50 uppercase mb-6 relative z-10">
                                                    {fuel.replace('_', ' ')}
                                                </h4>
                                                <div className="relative h-[64px] w-full flex justify-center items-center">
                                                    <div className={`absolute transition-all duration-1500 ease-in-out ${activeTarifa === 'PARTICULAR' ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} ${colorPart}`}>
                                                        <div className="font-mono text-[56px] sm:text-[64px] leading-none font-black tracking-tighter text-center">
                                                            {valParticular ? valParticular.toLocaleString('es-CO') : '----'}
                                                        </div>
                                                    </div>
                                                    <div className={`absolute transition-all duration-1500 ease-in-out ${activeTarifa === 'PUBLICO' ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} ${colorPub}`}>
                                                         <div className="font-mono text-[56px] sm:text-[64px] leading-none font-black tracking-tighter text-center">
                                                            {valPublico ? valPublico.toLocaleString('es-CO') : '----'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center text-red-500/40 font-black text-[14px] tracking-[0.4em] uppercase animate-pulse border-2 border-red-500/10 p-10 rounded-[24px]">
                                        OFFLINE
                                    </div>
                                )}
                            </div>
                            <div className="bg-[#080808] border-t-2 border-[#1a1c23] z-10 relative h-[100px] flex items-center justify-center overflow-hidden shrink-0">
                                <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-1500 ${activeTarifa === 'PARTICULAR' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                                    <span className="text-[12px] font-black text-[#ef4444] tracking-[0.3em] uppercase flex items-center justify-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-[#ef4444] shadow-[0_0_12px_rgba(239,68,68,1)] animate-pulse" />
                                        TARIFA PLENA
                                    </span>
                                    <span className="text-[10px] font-bold text-white/20 mt-2 uppercase tracking-[0.2em]">
                                        {pricesData.particular[0]?.decreto.numero ? `Resolución ${pricesData.particular[0]?.decreto.numero}` : 'PRECIO VIGENTE'}
                                    </span>
                                </div>
                                <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-1500 ${activeTarifa === 'PUBLICO' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                                    <span className="text-[12px] font-black text-[#10B981] tracking-[0.3em] uppercase flex items-center justify-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_12px_rgba(16,185,129,1)] animate-pulse" />
                                        SUBSIDIO ACTIVO
                                    </span>
                                    <span className="text-[10px] font-bold text-[#10B981]/30 mt-2 uppercase tracking-[0.2em]">
                                        {pricesData.publico[0]?.decreto.numero ? `Decreto ${pricesData.publico[0]?.decreto.numero}` : 'TARIFA DIFERENCIAL'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="w-[140px] h-[60px] bg-linear-to-r from-[#1c1f26] via-[#2d323e] to-[#1c1f26] border-x-4 border-[#111318] z-10 relative shadow-[inset_0_0_20px_rgba(0,0,0,0.9)] -mt-2" />
                        <div className="w-full max-w-[300px] h-[40px] bg-linear-to-b from-[#1c1f26] to-[#050505] rounded-t-[20px] border-t-4 border-x-4 border-[#2d323e] shadow-2xl z-20 relative -mt-1 shrink-0" />
                    </div>

                    <div className="space-y-6">
                        <Card className="rounded-[32px] border-border-subtle bg-bg-surface shadow-xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                                <Truck size={60} className="text-emerald-500" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between gap-3 mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-500 border border-emerald-500/20">
                                            <Truck size={18} />
                                        </div>
                                        <h3 className="text-base font-bold text-text-primary tracking-tight">Recepción</h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setDirectEntryForm({ tanqueId: tanques[0]?.id ?? '', galones: '0', precioUnitario: '0', observaciones: '' });
                                            setDirectEntryOpen(true);
                                        }}
                                        className="p-2 bg-emerald-500 text-black rounded-xl hover:scale-110 transition-transform shadow-lg shadow-emerald-500/20"
                                        title="Entrada Directa"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {pendingDeliveriesLoading ? (
                                        <div className="h-20 bg-bg-elevated/40 rounded-2xl animate-pulse" />
                                    ) : pendingDeliveries.length === 0 ? (
                                        <div className="p-6 text-center rounded-2xl bg-bg-elevated/20 border border-dashed border-border-subtle">
                                            <p className="text-[11px] text-text-muted font-bold uppercase tracking-widest">Sin remisiones</p>
                                        </div>
                                    ) : (
                                        pendingDeliveries.slice(0, 3).map((delivery) => (
                                            <div key={delivery.id} className="p-4 rounded-2xl bg-bg-base border border-border-subtle hover:border-emerald-500/30 transition-all group/item">
                                                <div className="flex items-start justify-between gap-2 mb-3">
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-black text-text-primary truncate">REM. {delivery.numeroRemision}</p>
                                                        <p className="text-[10px] text-text-muted font-mono mt-0.5">{formatGallons(Number(delivery.galones))} GAL · {delivery.tipoCombustible.split('_')[0]}</p>
                                                    </div>
                                                    <Badge variant="green" className="text-[8px] animate-pulse">PENDIENTE</Badge>
                                                </div>
                                                <Button type="button" variant="primary" onClick={() => openConfirmDelivery(delivery)} className="w-full h-8 text-[10px] font-bold uppercase tracking-widest rounded-lg bg-amber-500 hover:bg-amber-600 text-black">Confirmar Recepción</Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </Card>

                        <Card className="rounded-[32px] border-border-subtle bg-bg-surface shadow-xl p-6 relative overflow-hidden group hover:border-blue-500/30 transition-all">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                                <TimerReset size={60} className="text-blue-500" />
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-500 border border-blue-500/20">
                                        <ClipboardList size={18} />
                                    </div>
                                    <h3 className="text-base font-bold text-text-primary tracking-tight">Acta de Cierre</h3>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-4 rounded-2xl bg-bg-elevated/20 border border-border-subtle">
                                        <p className="text-[11px] text-text-secondary leading-relaxed font-medium">Verifique el nivel físico de los tanques y registre cualquier novedad para generar el acta digital.</p>
                                    </div>
                                    <button
                                        type="button"
                                        className="w-full py-4 rounded-2xl bg-bg-base border-2 border-dashed border-border-subtle text-xs font-bold text-text-muted hover:border-blue-500/50 hover:text-blue-500 transition-all uppercase tracking-widest"
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
                                        Generar Acta de Cierre
                                    </button>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            <Modal open={confirmDeliveryOpen} onClose={() => setConfirmDeliveryOpen(false)} title="Confirmar Recepción de Combustible">
                <form onSubmit={handleConfirmDelivery} className="space-y-6">
                    <div className="bg-bg-elevated/40 p-5 rounded-2xl border border-border-subtle">
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Detalles de Remisión</p>
                            <Badge variant="blue">Rem. {selectedDelivery?.numeroRemision}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] text-text-muted uppercase font-bold">Distribuidor</p>
                                <p className="text-sm font-bold text-text-primary">{selectedDelivery?.distribuidor?.nombre}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-text-muted uppercase font-bold">Total Remisionado</p>
                                <p className="text-sm font-bold text-text-primary">{formatGallons(esperado)} GAL</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Distribución en Tanques</p>
                            <Button type="button" variant="ghost" size="sm" onClick={addDistribucion} disabled={distribuciones.length >= compatibleTanques.length} className="text-[10px] h-8">
                                <Plus size={12} className="mr-1" /> Dividir Carga
                            </Button>
                        </div>
                        
                        <div className="space-y-3">
                            {distribuciones.map((dist, i) => (
                                <div key={i} className="flex gap-3 items-end animate-in slide-in-from-right-2">
                                    <div className="flex-1">
                                        <SelectField
                                            label={i === 0 ? "Tanque destino" : ""}
                                            value={dist.tanqueId}
                                            onChange={(e) => updateDistribucion(i, 'tanqueId', e.target.value)}
                                            options={compatibleTanques.map(t => ({ value: t.id, label: `${t.nombre} (${formatGallons(Number(t.nivelActual))} gal actuales)` }))}
                                            required
                                        />
                                    </div>
                                    <div className="w-[140px]">
                                        <InputField
                                            label={i === 0 ? "Galones" : ""}
                                            type="number"
                                            step="0.01"
                                            value={dist.galones}
                                            onChange={(e) => updateDistribucion(i, 'galones', e.target.value)}
                                            required
                                        />
                                    </div>
                                    {distribuciones.length > 1 && (
                                        <Button type="button" variant="ghost" onClick={() => removeDistribucion(i)} className="mb-0.5 h-10 w-10 p-0 text-red-500 hover:bg-red-500/10">
                                            <Minus size={16} />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className={cn(
                            "p-3 rounded-xl border text-center transition-colors",
                            Math.abs(totalAsignado - esperado) < 0.1 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                        )}>
                            <p className="text-[10px] font-bold uppercase tracking-widest">
                                {Math.abs(totalAsignado - esperado) < 0.1 
                                    ? "Distribución Completa" 
                                    : `Faltan asignar: ${formatGallons(esperado - totalAsignado)} GAL`}
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setConfirmDeliveryOpen(false)}>Cancelar</Button>
                        <Button type="submit" isLoading={submitting} disabled={Math.abs(totalAsignado - esperado) > 0.1} className="bg-emerald-500 text-black font-bold">Confirmar Ingreso</Button>
                    </div>
                </form>
            </Modal>

            <Modal open={directEntryOpen} onClose={() => setDirectEntryOpen(false)} title="Registro de Entrada Directa">
                <form onSubmit={handleDirectEntry} className="space-y-5">
                    <SelectField
                        label="Tanque de destino"
                        value={directEntryForm.tanqueId}
                        onChange={(e) => setDirectEntryForm(prev => ({ ...prev, tanqueId: e.target.value }))}
                        options={tanques.map(t => ({ value: t.id, label: `${t.nombre} (${t.tipoCombustible})` }))}
                        required
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <InputField
                            label="Galones recibidos"
                            type="number"
                            step="0.01"
                            value={directEntryForm.galones}
                            onChange={(e) => setDirectEntryForm(prev => ({ ...prev, galones: e.target.value }))}
                            required
                        />
                        <InputField
                            label="Precio por galón ($)"
                            type="number"
                            value={directEntryForm.precioUnitario}
                            onChange={(e) => setDirectEntryForm(prev => ({ ...prev, precioUnitario: e.target.value }))}
                            required
                        />
                    </div>
                    <TextAreaField
                        label="Observaciones / Novedades"
                        value={directEntryForm.observaciones}
                        onChange={(e) => setDirectEntryForm(prev => ({ ...prev, observaciones: e.target.value }))}
                        placeholder="Ej: Ajuste manual, compra local, etc."
                    />
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setDirectEntryOpen(false)}>Cancelar</Button>
                        <Button type="submit" isLoading={submitting} className="bg-emerald-500 text-black font-bold">Registrar Entrada</Button>
                    </div>
                </form>
            </Modal>

            <Modal open={cierreModalOpen} onClose={() => setCierreModalOpen(false)} title="Cierre Operativo de Turno">
                {!cierreResult ? (
                    <form onSubmit={handleCierre} className="space-y-6">
                        <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                            <p className="text-xs text-amber-600 leading-relaxed font-medium">
                                El cierre de turno calcula la diferencia entre el inventario teórico del sistema y la medición física real.
                            </p>
                        </div>
                        <SelectField
                            label="Tanque a cerrar"
                            value={cierreForm.tanqueId}
                            onChange={(e) => setCierreForm(prev => ({ ...prev, tanqueId: e.target.value }))}
                            options={tanques.map(t => ({ value: t.id, label: t.nombre }))}
                            required
                        />
                        <InputField
                            label="Nivel físico actual (Galones)"
                            type="number"
                            step="0.01"
                            value={cierreForm.nivelFisico}
                            onChange={(e) => setCierreForm(prev => ({ ...prev, nivelFisico: e.target.value }))}
                            required
                        />
                        <TextAreaField
                            label="Novedades detectadas"
                            value={cierreForm.observaciones}
                            onChange={(e) => setCierreForm(prev => ({ ...prev, observaciones: e.target.value }))}
                            placeholder="Describa cualquier descuadre o novedad en el equipo..."
                        />
                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="ghost" onClick={() => setCierreModalOpen(false)}>Cancelar</Button>
                            <Button type="submit" isLoading={submitting} className="bg-blue-500 text-black font-bold">Procesar Cierre</Button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-6 animate-in zoom-in-95">
                        <div className="flex flex-col items-center text-center p-6 bg-bg-elevated/40 rounded-[32px] border border-border-subtle">
                            <div className={cn(
                                "w-16 h-16 rounded-full flex items-center justify-center mb-4",
                                Math.abs(cierreResult.diferencia) < 5 ? "bg-emerald-500/20 text-emerald-500" : "bg-red-500/20 text-red-500"
                            )}>
                                {Math.abs(cierreResult.diferencia) < 5 ? <ShieldCheck size={32} /> : <ShieldAlert size={32} />}
                            </div>
                            <h3 className="text-xl font-bold text-text-primary">Resultado del Cierre</h3>
                            <p className="text-xs text-text-muted mt-1 uppercase tracking-widest font-bold">Tanque: {cierreResult.nombreTanque}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-bg-base p-4 rounded-2xl border border-border-subtle">
                                <p className="text-[10px] text-text-muted uppercase font-bold">Teórico</p>
                                <p className="text-lg font-mono font-bold text-text-primary">{formatGallons(cierreResult.nivelTeorico)}</p>
                            </div>
                            <div className="bg-bg-base p-4 rounded-2xl border border-border-subtle">
                                <p className="text-[10px] text-text-muted uppercase font-bold">Físico</p>
                                <p className="text-lg font-mono font-bold text-text-primary">{formatGallons(cierreResult.nivelFisico)}</p>
                            </div>
                        </div>

                        <div className={cn(
                            "p-6 rounded-[24px] border text-center",
                            Math.abs(cierreResult.diferencia) < 0.5 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-amber-500/10 border-amber-500/20"
                        )}>
                            <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Diferencia Neta</p>
                            <p className={cn(
                                "text-3xl font-black font-mono mt-2",
                                cierreResult.diferencia >= 0 ? "text-emerald-500" : "text-red-500"
                            )}>
                                {cierreResult.diferencia > 0 ? '+' : ''}{formatGallons(cierreResult.diferencia)} GAL
                            </p>
                        </div>

                        <Button className="w-full h-12 rounded-xl font-bold" onClick={() => setCierreModalOpen(false)}>Finalizar y Salir</Button>
                    </div>
                )}
            </Modal>
        </div>
    );
}
