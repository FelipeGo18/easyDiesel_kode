import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { BellRing, Fuel, MapPinned, Plus, ShieldCheck, TimerReset, Truck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { InputField, SelectField } from '@/components/ui/FormFields';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/useToast';
import { useAuth } from '@/context/useAuth';
import { getErrorMessage } from '@/lib/http';
import { inventarioService, tanquesService, type EntradaDirectaData, type RegistrarTransaccionData } from '@/services/inventario';
import { preciosService, type PrecioActual } from '@/services/precios';
import type { AuthenticatedUser, EntregaDistribuidor, Tanque, TipoServicio } from '@/types';

const tipoServicioOptions: { value: TipoServicio; label: string; helper: string }[] = [
    { value: 'PARTICULAR', label: 'Particular', helper: 'Aplica precio pleno sin subsidio.' },
    { value: 'PUBLICO', label: 'Público', helper: 'Servicio público habilitado para subsidio.' },
    { value: 'CARGA', label: 'Carga', helper: 'Transporte de carga con tarifa regulada.' },
    { value: 'OFICIAL', label: 'Oficial', helper: 'Operación institucional o gubernamental.' },
    { value: 'DIPLOMATICO', label: 'Diplomático', helper: 'Casos especiales definidos por norma.' },
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
    const [priceError, setPriceError] = useState<string | null>(null);
    const [pendingDeliveries, setPendingDeliveries] = useState<EntregaDistribuidor[]>([]);
    const [confirmDeliveryOpen, setConfirmDeliveryOpen] = useState(false);
    const [selectedDelivery, setSelectedDelivery] = useState<EntregaDistribuidor | null>(null);
    const [confirmReceiptForm, setConfirmReceiptForm] = useState({
        tanqueId: '',
        galonesRecibidos: '0',
    });
    const [directEntryOpen, setDirectEntryOpen] = useState(false);
    const [directEntryForm, setDirectEntryForm] = useState({
        tanqueId: '',
        galones: '0',
        precioUnitario: '0',
        observaciones: '',
    });
    const [form, setForm] = useState({
        tanqueId: '',
        tipoServicio: 'PARTICULAR' as TipoServicio,
        galones: '0',
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
    }, [stationId, toast]);

    useEffect(() => {
        fetchTanques();
    }, [fetchTanques]);

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
    }, [stationId, toast]);

    useEffect(() => {
        fetchPendingDeliveries();
    }, [fetchPendingDeliveries]);

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

    const gallons = Number(form.galones) || 0;
    const unitPrice = Number(pricePreview?.precioGalon ?? 0);
    const subsidy = Number(pricePreview?.subsidioGalon ?? 0);
    const estimatedTotal = gallons * unitPrice;
    const lowTanks = tanques.filter((tanque) => Number(tanque.nivelActual) <= Number(tanque.nivelMinimo));
    const totalFuel = tanques.reduce((total, tanque) => total + Number(tanque.nivelActual), 0);
    const selectedServiceMeta = tipoServicioOptions.find((option) => option.value === form.tipoServicio);
    const receivedGallons = Number(confirmReceiptForm.galonesRecibidos) || 0;
    const selectedDeliveryTank = tanques.find((tanque) => tanque.id === confirmReceiptForm.tanqueId) ?? null;

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
                galones: '0',
                placaVehiculo: '',
                esGranConsumidor: false,
            }));
            await fetchTanques();
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, 'No fue posible registrar la venta'));
        } finally {
            setSubmitting(false);
        }
    };

    const openConfirmDelivery = (delivery: EntregaDistribuidor) => {
        setSelectedDelivery(delivery);
        setConfirmReceiptForm({
            tanqueId: delivery.tanqueId,
            galonesRecibidos: String(Number(delivery.galones) || 0),
        });
        setConfirmDeliveryOpen(true);
    };

    const handleConfirmDelivery = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!stationId || !selectedDelivery) {
            toast.error('No hay una entrega pendiente seleccionada.');
            return;
        }

        if (!confirmReceiptForm.tanqueId) {
            toast.error('Selecciona el tanque de recepción.');
            return;
        }

        if (receivedGallons <= 0) {
            toast.error('Ingresa una cantidad recibida mayor a 0.');
            return;
        }

        setSubmitting(true);
        try {
            const result = await inventarioService.confirmarEntrega(selectedDelivery.id, {
                estacionId: stationId,
                tanqueId: confirmReceiptForm.tanqueId,
                galonesRecibidos: receivedGallons,
            });

            toast.success(`Entrega confirmada por ${formatGallons(Number(result.transaccion.galones))} gal`);
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
        <div className="space-y-6 animate-enter">
            {/* ── Alerta de niveles críticos (Decreto 318/2003) ── */}
            {lowTanks.length > 0 && (
                <div className="rounded-[18px] border border-red-500/30 bg-red-500/[0.07] px-5 py-4">
                    <div className="flex items-start gap-3">
                        <BellRing size={16} className="mt-0.5 shrink-0 text-red-400" />
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-red-300">
                                {lowTanks.length === 1 ? '1 tanque por debajo del nivel mínimo operativo' : `${lowTanks.length} tanques por debajo del nivel mínimo operativo`}
                                <span className="ml-2 font-mono text-[10px] text-red-400/70 font-normal">Decreto 318/2003</span>
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {lowTanks.map((t) => (
                                    <span key={t.id} className="inline-flex items-center gap-1.5 rounded-[6px] border border-red-500/25 bg-red-500/10 px-2.5 py-1 text-[11px] text-red-300">
                                        <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                                        {t.nombre} · {formatGallons(Number(t.nivelActual))} / {formatGallons(Number(t.nivelMinimo))} gal
                                        <span className="font-mono text-[9px] text-red-400/60">{t.tipoCombustible}</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <section className="relative overflow-hidden rounded-[28px] border border-amber-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(245,166,35,0.18),_transparent_30%),linear-gradient(135deg,_rgba(18,18,16,1)_0%,_rgba(12,12,10,1)_55%,_rgba(36,21,2,1)_100%)] p-6 sm:p-8">
                <div className="absolute inset-y-0 right-0 w-[38%] bg-[linear-gradient(135deg,transparent_0%,rgba(245,166,35,0.08)_45%,transparent_100%)]" />
                <div className="relative grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
                    <div>
                        <Badge variant="amber" className="mb-4">ROL OPERATIVO · ESTACIÓN</Badge>
                        <h1 className="max-w-3xl font-display text-3xl leading-tight text-white sm:text-4xl">
                            Venta asistida por regla regulatoria, tanque y estación.
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/72">
                            Este panel está pensado para operación de pista: capturas placa, eliges el servicio y el sistema trae la tarifa vigente de la zona antes de registrar la salida del tanque.
                        </p>

                        <div className="mt-6 grid gap-3 sm:grid-cols-3">
                            <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                                <div className="flex items-center gap-2 text-white/60">
                                    <MapPinned size={15} />
                                    <span className="text-[11px] font-mono uppercase tracking-[0.18em]">Estación</span>
                                </div>
                                <p className="mt-3 text-lg font-semibold text-white">{station?.nombre || 'Sin estación'}</p>
                                <p className="mt-1 text-xs text-white/50">SICOM {station?.codigoSicom || 'pendiente'}</p>
                            </div>
                            <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                                <div className="flex items-center gap-2 text-white/60">
                                    <Fuel size={15} />
                                    <span className="text-[11px] font-mono uppercase tracking-[0.18em]">Inventario</span>
                                </div>
                                <p className="mt-3 text-lg font-semibold text-white">{formatGallons(totalFuel)} gal</p>
                                <p className="mt-1 text-xs text-white/50">Disponible entre {tanques.length || 0} tanques</p>
                            </div>
                            <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                                <div className="flex items-center gap-2 text-white/60">
                                    <BellRing size={15} />
                                    <span className="text-[11px] font-mono uppercase tracking-[0.18em]">Alertas</span>
                                </div>
                                <p className="mt-3 text-lg font-semibold text-white">{lowTanks.length}</p>
                                <p className="mt-1 text-xs text-white/50">Tanques en mínimo operativo</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[24px] border border-amber-500/20 bg-black/25 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-md">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-amber-300/70">Tarifa activa</p>
                                <p className="mt-2 text-3xl font-semibold text-white">
                                    {pricingLoading ? 'Consultando...' : unitPrice ? formatCurrency(unitPrice) : 'Sin tarifa'}
                                </p>
                            </div>
                            <Badge variant={form.tipoServicio === 'PARTICULAR' ? 'red' : 'green'} className="px-3 py-1 text-[10px]">
                                {form.tipoServicio}
                            </Badge>
                        </div>
                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-[18px] border border-white/8 bg-white/5 p-3">
                                <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/48">Subsidio</p>
                                <p className="mt-2 text-sm text-white">{subsidy > 0 ? formatCurrency(subsidy) : 'No aplica'}</p>
                            </div>
                            <div className="rounded-[18px] border border-white/8 bg-white/5 p-3">
                                <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/48">Decreto base</p>
                                <p className="mt-2 text-sm text-white">{pricePreview?.decreto.numero || 'Sin referencia'}</p>
                            </div>
                        </div>
                        <p className="mt-4 text-xs leading-5 text-white/55">
                            {priceError || pricePreview?.decreto.titulo || 'El valor definitivo se valida nuevamente en backend al confirmar la venta.'}
                        </p>
                    </div>
                </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
                <Card className="rounded-[28px] border-white/5 bg-[linear-gradient(180deg,rgba(20,20,18,0.98),rgba(12,12,10,0.98))] p-0 overflow-hidden">
                    <div className="border-b border-white/6 px-6 py-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-amber-500/70">Cabina de despacho</p>
                                <h2 className="mt-2 text-2xl font-semibold text-white">Registrar venta</h2>
                                <p className="mt-2 max-w-xl text-sm leading-6 text-white/60">
                                    Captura rápida para surtidor. El precio se previsualiza y se recalcula en servidor al guardar para que no dependa del navegador.
                                </p>
                            </div>
                            <div className="hidden rounded-[18px] border border-white/8 bg-white/5 px-4 py-3 text-right sm:block">
                                <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/42">Meta del ticket</p>
                                <p className="mt-1 text-xl font-semibold text-white">{estimatedTotal > 0 ? formatCurrency(estimatedTotal) : '$ 0'}</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="grid gap-6 px-6 py-6 lg:grid-cols-[0.95fr_1.05fr]">
                        <div className="space-y-4">
                            <div className="grid gap-3 md:grid-cols-2">
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
                                                'rounded-[22px] border p-4 text-left transition-all',
                                                isSelected ? 'border-amber-500/45 bg-amber-500/10 shadow-[0_18px_50px_rgba(245,166,35,0.12)]' : 'border-white/8 bg-white/[0.03] hover:border-white/16 hover:bg-white/[0.05]',
                                            ].join(' ')}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-white">{tanque.nombre}</p>
                                                    <p className="mt-1 text-[11px] font-mono uppercase tracking-[0.16em] text-white/42">{tanque.tipoCombustible}</p>
                                                </div>
                                                <Badge variant={isLow ? 'red' : 'blue'}>{Math.round(percentage)}%</Badge>
                                            </div>
                                            <div className="mt-4 h-2 rounded-full bg-white/8">
                                                <div
                                                    className={isLow ? 'h-2 rounded-full bg-red-500' : 'h-2 rounded-full bg-amber-500'}
                                                    style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                                                />
                                            </div>
                                            <p className="mt-3 text-xs text-white/60">
                                                {formatGallons(Number(tanque.nivelActual))} gal disponibles de {formatGallons(Number(tanque.capacidadGalones))} gal.
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>

                            {!loading && tanques.length === 0 && (
                                <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-white/60">
                                    No hay tanques configurados para esta estación. Debes crear al menos uno antes de usar el panel operativo.
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <SelectField
                                label="Tipo de servicio"
                                value={form.tipoServicio}
                                onChange={(event) => setForm((current) => ({ ...current, tipoServicio: event.target.value as TipoServicio }))}
                                options={tipoServicioOptions.map((option) => ({ value: option.value, label: option.label }))}
                            />

                            {selectedTanque?.tipoCombustible === 'ACPM' && (
                                <label className="flex cursor-pointer items-center gap-3 rounded-[18px] border border-amber-500/20 bg-amber-500/[0.05] px-4 py-3 hover:bg-amber-500/[0.09] transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={form.esGranConsumidor}
                                        onChange={(e) => setForm((current) => ({ ...current, esGranConsumidor: e.target.checked }))}
                                        className="h-4 w-4 rounded border-amber-500/40 bg-transparent accent-amber-500"
                                    />
                                    <div>
                                        <p className="text-[13px] font-medium text-white">Gran Consumidor <span className="ml-1 font-mono text-[10px] text-amber-400/80">Decreto 763/2024</span></p>
                                        <p className="text-[11px] text-white/50 mt-0.5">Distribuidor REGULADO (&gt;20.000 gal/mes) · Precio paridad internacional</p>
                                    </div>
                                </label>
                            )}

                            <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/68">
                                {selectedServiceMeta?.helper}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <InputField
                                    label="Galones a despachar"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.galones}
                                    onChange={(event) => setForm((current) => ({ ...current, galones: event.target.value }))}
                                    required
                                />
                                <InputField
                                    label="Placa del vehículo"
                                    placeholder="ABC123"
                                    value={form.placaVehiculo}
                                    onChange={(event) => setForm((current) => ({ ...current, placaVehiculo: normalizePlate(event.target.value) }))}
                                />
                            </div>

                            <div className="grid gap-3 rounded-[24px] border border-amber-500/16 bg-amber-500/[0.06] p-4 md:grid-cols-3">
                                <div>
                                    <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-amber-200/62">Precio galón</p>
                                    <p className="mt-2 text-lg font-semibold text-white">{unitPrice ? formatCurrency(unitPrice) : 'Pendiente'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-amber-200/62">Subsidio</p>
                                    <p className="mt-2 text-lg font-semibold text-white">{subsidy > 0 ? formatCurrency(subsidy) : 'No aplica'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-amber-200/62">Total estimado</p>
                                    <p className="mt-2 text-lg font-semibold text-white">{estimatedTotal > 0 ? formatCurrency(estimatedTotal) : '$ 0'}</p>
                                </div>
                            </div>

                            <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/45">Cumplimiento</p>
                                        <p className="mt-2 text-sm text-white">Validación por zona, combustible y tipo de servicio.</p>
                                    </div>
                                    <ShieldCheck size={18} className="text-emerald-400" />
                                </div>
                                <p className="mt-3 text-xs leading-5 text-white/58">
                                    {pricePreview
                                        ? `Tarifa ${pricePreview.zona.nombre} · Decreto ${pricePreview.decreto.numero}.`
                                        : 'El backend seguirá validando la tarifa aunque falle la previsualización en pantalla.'}
                                </p>
                            </div>

                            <div className="flex flex-wrap justify-end gap-3 pt-2">
                                <Button type="button" variant="ghost" onClick={fetchTanques}>
                                    Actualizar niveles
                                </Button>
                                <Button type="submit" isLoading={submitting || loading || pricingLoading} disabled={!selectedTanque || tanques.length === 0}>
                                    Confirmar despacho
                                </Button>
                            </div>
                        </div>
                    </form>
                </Card>

                <div className="space-y-6">
                    <Card className="rounded-[28px] border-white/6 bg-[linear-gradient(180deg,rgba(16,16,14,0.98),rgba(10,10,9,0.98))]">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="rounded-[16px] border border-white/8 bg-white/[0.04] p-3 text-emerald-400">
                                    <Truck size={18} />
                                </div>
                                <div>
                                    <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-white/42">Recepción</p>
                                    <h3 className="mt-1 text-lg font-semibold text-white">Entregas pendientes</h3>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setDirectEntryForm({ tanqueId: tanques[0]?.id ?? '', galones: '0', precioUnitario: '0', observaciones: '' });
                                    setDirectEntryOpen(true);
                                }}
                                className="flex items-center gap-1.5 rounded-[12px] border border-emerald-500/25 bg-emerald-500/[0.08] px-3 py-1.5 text-[12px] font-medium text-emerald-300 transition-colors hover:bg-emerald-500/[0.14]"
                            >
                                <Plus size={13} />
                                Entrada directa
                            </button>
                        </div>

                        <div className="mt-5 space-y-3">
                            {pendingDeliveriesLoading && (
                                <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-white/55">
                                    Cargando entregas pendientes...
                                </div>
                            )}

                            {!pendingDeliveriesLoading && pendingDeliveries.length === 0 && (
                                <div className="rounded-[18px] border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-4 text-sm text-emerald-100/85">
                                    No hay entregas pendientes por confirmar para esta estación.
                                </div>
                            )}

                            {pendingDeliveries.map((delivery) => (
                                <div key={delivery.id} className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-white">Remisión {delivery.numeroRemision}</p>
                                            <p className="mt-1 text-xs text-white/58">
                                                {delivery.distribuidor?.nombre || 'Distribuidor'} · {delivery.tipoCombustible} · {formatGallons(Number(delivery.galones))} gal
                                            </p>
                                        </div>
                                        <Badge variant="blue">Pendiente</Badge>
                                    </div>
                                    <p className="mt-3 text-xs text-white/58">
                                        Tanque sugerido: {delivery.tanque?.nombre || 'Sin tanque'} · {new Date(delivery.fechaEntrega).toLocaleString('es-CO')}
                                    </p>
                                    <div className="mt-4 flex justify-end">
                                        <Button type="button" variant="ghost" onClick={() => openConfirmDelivery(delivery)}>
                                            Confirmar recepción
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="rounded-[28px] border-white/6 bg-[linear-gradient(180deg,rgba(16,16,14,0.98),rgba(10,10,9,0.98))]">
                        <div className="flex items-center gap-3">
                            <div className="rounded-[16px] border border-white/8 bg-white/[0.04] p-3 text-amber-400">
                                <Truck size={18} />
                            </div>
                            <div>
                                <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-white/42">Foco operativo</p>
                                <h3 className="mt-1 text-lg font-semibold text-white">Checklist de turno</h3>
                            </div>
                        </div>
                        <div className="mt-5 space-y-3 text-sm text-white/65">
                            <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3">Verificar placa y tipo de servicio antes de confirmar.</div>
                            <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3">Despachar solo desde el tanque correcto para el combustible seleccionado.</div>
                            <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3">Escalar de inmediato si un tanque cae por debajo del mínimo operativo.</div>
                        </div>
                    </Card>

                    <Card className="rounded-[28px] border-white/6 bg-[linear-gradient(180deg,rgba(16,16,14,0.98),rgba(10,10,9,0.98))]">
                        <div className="flex items-center gap-3">
                            <div className="rounded-[16px] border border-white/8 bg-white/[0.04] p-3 text-sky-400">
                                <TimerReset size={18} />
                            </div>
                            <div>
                                <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-white/42">Señales de riesgo</p>
                                <h3 className="mt-1 text-lg font-semibold text-white">Estado de tanques</h3>
                            </div>
                        </div>

                        <div className="mt-5 space-y-3">
                            {loading && (
                                <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-white/55">
                                    Cargando estado de tanques...
                                </div>
                            )}

                            {!loading && lowTanks.length === 0 && (
                                <div className="rounded-[18px] border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-4 text-sm text-emerald-100/85">
                                    Sin alertas activas. Todos los tanques están por encima del nivel mínimo.
                                </div>
                            )}

                            {lowTanks.map((tanque) => (
                                <div key={tanque.id} className="rounded-[18px] border border-red-500/20 bg-red-500/[0.06] px-4 py-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-white">{tanque.nombre}</p>
                                            <p className="mt-1 text-xs text-white/58">{tanque.tipoCombustible}</p>
                                        </div>
                                        <Badge variant="red">Mínimo</Badge>
                                    </div>
                                    <p className="mt-3 text-xs text-white/65">
                                        Actual {formatGallons(Number(tanque.nivelActual))} gal de mínimo {formatGallons(Number(tanque.nivelMinimo))} gal.
                                    </p>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>

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
                        Esperado: {formatGallons(Number(selectedDelivery?.galones || 0))} gal · {selectedDelivery?.tipoCombustible || 'Combustible'}
                    </div>

                    <SelectField
                        label="Tanque receptor"
                        value={confirmReceiptForm.tanqueId}
                        onChange={(event) => setConfirmReceiptForm((current) => ({ ...current, tanqueId: event.target.value }))}
                        options={tanques
                            .filter((tanque) => !selectedDelivery || tanque.tipoCombustible === selectedDelivery.tipoCombustible)
                            .map((tanque) => ({ value: tanque.id, label: `${tanque.nombre} · ${tanque.tipoCombustible}` }))}
                    />

                    <InputField
                        label="Galones recibidos"
                        type="number"
                        min="0"
                        step="0.01"
                        value={confirmReceiptForm.galonesRecibidos}
                        onChange={(event) => setConfirmReceiptForm((current) => ({ ...current, galonesRecibidos: event.target.value }))}
                        required
                    />

                    <div className="rounded-brand border border-border-subtle bg-bg-elevated px-3 py-3 text-[12px] text-text-secondary">
                        Nivel proyectado del tanque: {selectedDeliveryTank ? `${formatGallons(Number(selectedDeliveryTank.nivelActual) + receivedGallons)} gal` : 'Selecciona un tanque'}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" type="button" onClick={() => {
                            setConfirmDeliveryOpen(false);
                            setSelectedDelivery(null);
                        }}>
                            Cancelar
                        </Button>
                        <Button type="submit" isLoading={submitting}>
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
        </div>
    );
}