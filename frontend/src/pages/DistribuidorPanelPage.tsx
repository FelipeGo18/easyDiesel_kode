import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Building2, Fuel, PackageCheck, PackagePlus, Truck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { InputField, SelectField } from '@/components/ui/FormFields';
import { Modal } from '@/components/ui/Modal';
import { KpiCard } from '@/components/ui/KpiCard';
import { useToast } from '@/components/ui/useToast';
import { useAuth } from '@/context/useAuth';
import { getErrorMessage } from '@/lib/http';
import { api } from '@/services/api';
import { inventarioService, type RegistrarEntregaData } from '@/services/inventario';
import { estacionesService } from '@/services/actores';
import type { AuthenticatedUser, EntregaDistribuidor, EstacionServicio, TipoCombustible } from '@/types';

const tipoCombustibleOptions: { value: TipoCombustible; label: string }[] = [
    { value: 'ACPM',              label: 'ACPM (Diésel)' },
    { value: 'GASOLINA_CORRIENTE', label: 'Gasolina Corriente' },
    { value: 'GASOLINA_EXTRA',    label: 'Gasolina Extra' },
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

export function DistribuidorPanelPage() {
    const { user } = useAuth();
    const toast = useToast();
    const currentUser = user as AuthenticatedUser | null;
    const distribuidor = currentUser?.distribuidor;
    const distribuidorId = distribuidor?.id;

    const [entregas, setEntregas] = useState<EntregaDistribuidor[]>([]);
    const [estaciones, setEstaciones] = useState<EstacionServicio[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [canceling, setCanceling] = useState<string | null>(null);
    const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);

    // Form state
    const [form, setForm] = useState({
        estacionId: '',
        tipoCombustible: 'ACPM' as TipoCombustible,
        galones: '',
        precioUnitario: '',
        numeroRemision: '',
        fechaEntrega: new Date().toISOString().slice(0, 16),
    });

    const setField = (field: string, value: string | number) =>
        setForm(prev => ({ ...prev, [field]: value }));

    // Fetch automatic price and remission when station or fuel type changes
    useEffect(() => {
        const fetchMeta = async () => {
            if (!form.estacionId || !form.tipoCombustible) return;

            // 1. Get next remission (independent of station selection)
            try {
                const remRes = await api.get(`/inventario/proxima-remision`);
                const proximaRemision = remRes.data?.data?.proxima;
                if (proximaRemision) {
                    setField('numeroRemision', proximaRemision);
                }
            } catch (error) {
                console.error('Error fetching remisión:', error);
                setField('numeroRemision', 'Error');
            }

            // 2. Get zona price
            try {
                const selectedEstacion = estaciones.find(e => e.id === form.estacionId);
                const zonaId = selectedEstacion?.zonaId;

                if (!zonaId) {
                    console.warn('La estación seleccionada no tiene zona asignada');
                    setField('precioUnitario', '0');
                    return;
                }

                const priceRes = await api.get(`/precios/consultar`, {
                    params: {
                        zonaId,
                        tipoCombustible: form.tipoCombustible,
                        tipoServicio: 'CARGA'
                    }
                });
                const precioUnitario = priceRes.data?.data?.precioGalon || 0;
                setField('precioUnitario', precioUnitario ? String(precioUnitario) : '0');
            } catch (error) {
                console.error('Error fetching precio:', error);
                setField('precioUnitario', '0');
            }
        };
        fetchMeta();
    }, [form.estacionId, form.tipoCombustible, estaciones]);

    // ── Data loading ────────────────────────────────────────────────────────

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [entregasData, estacionesData] = await Promise.all([
                distribuidorId
                    ? inventarioService.listarEntregasPorDistribuidor(distribuidorId)
                    : Promise.resolve({ data: [], pagination: undefined }),
                estacionesService.getAll(),
            ]);
            setEntregas(entregasData.data ?? []);
            setEstaciones(estacionesData.data ?? []);
        } catch (error: unknown) {
            toast.error(`Error al cargar datos: ${getErrorMessage(error)}`);
        } finally {
            setLoading(false);
        }
    }, [distribuidorId]); // toast is stable after ToastProvider fix — excluded intentionally

    useEffect(() => { fetchData(); }, [fetchData]);

    // ── KPIs ────────────────────────────────────────────────────────────────

    const kpis = useMemo(() => {
        const totalEntregas    = entregas.length;
        const pendientes       = entregas.filter(e => !e.confirmada).length;
        const confirmadas      = entregas.filter(e => e.confirmada).length;
        const volumenTotal     = entregas.reduce((acc, e) => acc + Number(e.galones), 0);
        return { totalEntregas, pendientes, confirmadas, volumenTotal };
    }, [entregas]);

    // ── Submit new entrega ───────────────────────────────────────────────────

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!distribuidorId) return;

        const estacion = estaciones.find(s => s.id === form.estacionId);
        if (!estacion) {
            toast.error('Selecciona una estación destino');
            return;
        }

        // ── Validation: Available space check ──────────────────────────────────────
        const galonesADespachar = Number(form.galones);
        const tanquesCompatibles = (estacion.tanques || []).filter(t => t.tipoCombustible === form.tipoCombustible);
        
        if (tanquesCompatibles.length === 0) {
            toast.error(`La estación ${estacion.nombre} no tiene tanques registrados para ${form.tipoCombustible}`);
            return;
        }

        const espacioDisponibleTipo = tanquesCompatibles.reduce((acc, t) => {
            const disponible = Number(t.capacidadGalones) - Number(t.nivelActual || 0);
            return acc + Math.max(0, disponible);
        }, 0);
        
        if (galonesADespachar > espacioDisponibleTipo) {
            toast.error(`Exceso de capacidad: La estación solo tiene ${formatGallons(espacioDisponibleTipo)} gal de espacio libre para ${form.tipoCombustible}.`);
            return;
        }
        // ────────────────────────────────────────────────────────────────────

        setSubmitting(true);
        try {
            const payload: RegistrarEntregaData = {
                distribuidorId,
                estacionId:      form.estacionId,
                tanqueId:        '', // tanqueId is required by schema but assigned by station ops on confirm
                tipoCombustible: form.tipoCombustible,
                galones:         Number(form.galones),
                precioUnitario:  Number(form.precioUnitario),
                numeroRemision:  form.numeroRemision.trim(),
                fechaEntrega:    new Date(form.fechaEntrega).toISOString(),
            };

            // NOTE: tanqueId will be resolved by station on confirmation.
            // Backend requires the field, so we send a placeholder only when
            // the station hasn't confirmed yet. The station confirms with their tankId.
            // For Distribuidor flow we need to pick a default tank or let the station choose.
            // Temporarily the backend is called with tanqueId resolved from the first tank of the station.
            // This is handled transparently by the system.
            await inventarioService.registrarEntrega(payload);
            toast.success('Entrega registrada. Pendiente de confirmación por la estación.');
            setModalOpen(false);
            setForm({
                estacionId: '',
                tipoCombustible: 'ACPM',
                galones: '',
                precioUnitario: '',
                numeroRemision: '',
                fechaEntrega: new Date().toISOString().slice(0, 16),
            });
            fetchData();
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, 'Error al registrar la entrega'));
        } finally {
            setSubmitting(false);
        }
    };

    // ── Cancelar entrega pendiente ───────────────────────────────────────────────────────

    const handleCancelar = async () => {
        if (!cancelConfirmId) return;
        setCanceling(cancelConfirmId);
        try {
            await inventarioService.cancelarEntrega(cancelConfirmId);
            toast.success('Entrega cancelada');
            setCancelConfirmId(null);
            await fetchData();
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, 'No fue posible cancelar la entrega'));
        } finally {
            setCanceling(null);
        }
    };

    if (!distribuidor) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-text-muted">
                <Truck className="w-10 h-10 opacity-30" />
                <p className="text-small">Tu cuenta de distribuidor aún no tiene una empresa asignada.</p>
                <p className="text-[11px] font-mono opacity-60">Contacta al administrador del sistema.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-enter">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-h1 text-text-primary">
                        {distribuidor?.nombre ?? 'Distribuidor'}
                    </h1>
                    <p className="text-small text-text-secondary mt-1">
                        Panel de operaciones · Registro y seguimiento de entregas
                    </p>
                </div>
                <Button onClick={() => setModalOpen(true)} className="w-full sm:w-auto">
                    <PackagePlus className="w-4 h-4" />
                    Nueva entrega
                </Button>
            </div>

            {/* ── KPIs ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <KpiCard
                    label="Total entregas"
                    value={String(kpis.totalEntregas)}
                    icon={<PackageCheck className="w-4 h-4" />}
                />
                <KpiCard
                    label="Pendientes confirmación"
                    value={String(kpis.pendientes)}
                    icon={<Truck className="w-4 h-4" />}
                />
                <KpiCard
                    label="Confirmadas"
                    value={String(kpis.confirmadas)}
                    icon={<Building2 className="w-4 h-4" />}
                />
                <KpiCard
                    label="Volumen total"
                    value={`${formatGallons(kpis.volumenTotal)} gal`}
                    icon={<Fuel className="w-4 h-4" />}
                />
            </div>

            {/* ── Entregas table ── */}
            <Card>
                <div className="p-5 border-b border-border-subtle">
                    <h2 className="text-[14px] font-medium text-text-primary">Historial de entregas</h2>
                    <p className="text-[12px] text-text-muted mt-0.5">Ordenado de más reciente a más antiguo</p>
                </div>

                {loading ? (
                    <div className="p-6 space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-12 bg-bg-elevated rounded animate-pulse" />
                        ))}
                    </div>
                ) : entregas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-text-muted">
                        <PackageCheck className="w-9 h-9 opacity-30" />
                        <span className="text-small">No hay entregas registradas.</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-[12px]">
                            <thead>
                                <tr className="border-b border-border-subtle">
                                    {['Remisión', 'Estación', 'Combustible', 'Galones', 'Total', 'Fecha', 'Estado', ''].map(h => (
                                        <th key={h} className="text-left px-4 py-2.5 text-text-muted font-medium tracking-wide uppercase text-[10px]">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-subtle">
                                {entregas.map(e => (
                                    <tr key={e.id} className="hover:bg-bg-elevated/40 transition-colors">
                                        <td className="px-4 py-3 font-mono text-text-secondary">{e.numeroRemision}</td>
                                        <td className="px-4 py-3 text-text-primary">
                                            {(e as any).estacion?.nombre ?? '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant="amber">{e.tipoCombustible}</Badge>
                                        </td>
                                        <td className="px-4 py-3 text-text-secondary font-mono">
                                            {formatGallons(Number(e.galones))}
                                        </td>
                                        <td className="px-4 py-3 text-text-secondary font-mono">
                                            {formatCurrency(Number(e.precioTotal))}
                                        </td>
                                        <td className="px-4 py-3 text-text-muted font-mono">
                                            {new Date(e.fechaEntrega).toLocaleDateString('es-CO')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant={e.confirmada ? 'green' : 'yellow'}>
                                                {e.confirmada ? 'Confirmada' : 'Pendiente'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            {!e.confirmada && (
                                                <button
                                                    type="button"
                                                    onClick={() => setCancelConfirmId(e.id)}
                                                    className="text-[11px] font-medium text-red-400/80 hover:text-red-400 transition-colors px-2 py-1 rounded-[6px] hover:bg-red-500/10"
                                                    title="Cancelar entrega"
                                                >
                                                    Cancelar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* ── Modal: Nueva entrega ── */}
            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Registrar nueva entrega"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <SelectField
                        label="Estación destino"
                        id="entrega-estacion"
                        value={form.estacionId}
                        onChange={e => setField('estacionId', e.target.value)}
                        options={estaciones.map(s => ({ value: s.id, label: `${s.nombre} — ${s.ciudad}` }))}
                        placeholder="Seleccionar estación"
                        required
                    />
                    <SelectField
                        label="Tipo de combustible"
                        id="entrega-combustible"
                        value={form.tipoCombustible}
                        onChange={e => setField('tipoCombustible', e.target.value as TipoCombustible)}
                        options={tipoCombustibleOptions}
                    />
                    <InputField
                        label="Galones"
                        id="entrega-galones"
                        type="number"
                        min="1"
                        step="0.01"
                        value={form.galones}
                        onChange={e => setField('galones', e.target.value)}
                        placeholder="500"
                        required
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">
                                Número de Remisión
                            </label>
                            <div className="h-10 px-3 flex items-center bg-bg-surface border border-border-subtle rounded-brand font-mono text-amber-500 font-bold text-[13px]">
                                {form.numeroRemision || 'Generando...'}
                            </div>
                            <p className="text-[10px] text-text-muted">Asignado automáticamente</p>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">
                                Precio por Galón
                            </label>
                            <div className="h-10 px-3 flex items-center bg-bg-surface border border-border-subtle rounded-brand font-mono text-green-500 font-bold text-[13px]">
                                {form.precioUnitario && form.precioUnitario !== '0' ? formatCurrency(Number(form.precioUnitario)) : 'Consultando...'}
                            </div>
                            <p className="text-[10px] text-text-muted">Precio de zona vigente</p>
                        </div>
                    </div>

                    {form.galones && form.precioUnitario && form.precioUnitario !== '0' && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-brand p-4 flex flex-col gap-1">
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">Total de la entrega</span>
                                <span className="text-[16px] font-bold text-green-400 font-mono tracking-tight">
                                    {formatCurrency(Number(form.galones) * Number(form.precioUnitario))}
                                </span>
                            </div>
                            <div className="h-px bg-green-500/20 my-1" />
                            <div className="flex justify-between text-[10px] text-green-500/70">
                                <span>{formatGallons(Number(form.galones))} galones</span>
                                <span>×</span>
                                <span>{formatCurrency(Number(form.precioUnitario))} / gal</span>
                            </div>
                        </div>
                    )}

                    <InputField
                        label="Fecha de entrega"
                        id="entrega-fecha"
                        type="datetime-local"
                        value={form.fechaEntrega}
                        onChange={e => setField('fechaEntrega', e.target.value)}
                        required
                    />

                    {/* Capacity info */}
                    {(() => {
                        const s = estaciones.find(x => x.id === form.estacionId);
                        if (!s) return null;
                        const tks = (s.tanques || []).filter(t => t.tipoCombustible === form.tipoCombustible);
                        const disponible = tks.reduce((acc, t) => acc + (Number(t.capacidadGalones) - Number(t.nivelActual || 0)), 0);
                        return (
                            <div className="bg-bg-elevated rounded-brand p-3 text-[11px] text-text-muted border border-border-subtle flex items-center gap-2">
                                <Building2 className="w-3.5 h-3.5 text-amber-500/70" />
                                <span>Espacio disponible en {s.nombre} para {form.tipoCombustible}: <b>{formatGallons(Math.max(0, disponible))} gal</b></span>
                            </div>
                        );
                    })()}

                    {/* Price summary removed as it's redundant with the price field above */}

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" type="button" onClick={() => setModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" isLoading={submitting}>
                            Registrar entrega
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* ── Modal: Confirmar cancelación ── */}
            <Modal
                open={!!cancelConfirmId}
                onClose={() => setCancelConfirmId(null)}
                title="Cancelar entrega"
            >
                <div className="space-y-4">
                    <p className="text-[13px] text-text-secondary">
                        ¿Confirmas la cancelación de esta entrega pendiente? Solo las entregas no confirmadas por la estación pueden cancelarse.
                    </p>
                    {cancelConfirmId && (() => {
                        const e = entregas.find(x => x.id === cancelConfirmId);
                        if (!e) return null;
                        return (
                            <div className="rounded-brand border border-border-subtle bg-bg-elevated px-3 py-3 text-[12px] text-text-secondary">
                                Remisión <span className="font-mono text-text-primary">{e.numeroRemision}</span>
                                {' · '}{formatGallons(Number(e.galones))} gal
                                {' · '}<span className="text-amber-400">{e.tipoCombustible}</span>
                                {' · '}{formatCurrency(Number(e.precioTotal))}
                            </div>
                        );
                    })()}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" type="button" onClick={() => setCancelConfirmId(null)}>
                            No, conservar
                        </Button>
                        <Button
                            type="button"
                            isLoading={!!canceling}
                            onClick={handleCancelar}
                            className="border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                        >
                            Sí, cancelar entrega
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
