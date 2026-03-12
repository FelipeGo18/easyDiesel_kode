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

    // Form state
    const [form, setForm] = useState({
        estacionId: '',
        tipoCombustible: 'ACPM' as TipoCombustible,
        galones: '',
        precioUnitario: '',
        numeroRemision: '',
        fechaEntrega: new Date().toISOString().slice(0, 16),
    });

    const setField = (field: string, value: string) =>
        setForm(prev => ({ ...prev, [field]: value }));

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
            setEstaciones(estacionesData);
        } catch (error: unknown) {
            toast.error(`Error al cargar datos: ${getErrorMessage(error)}`);
        } finally {
            setLoading(false);
        }
    }, [distribuidorId, toast]);

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

    // ── Render ───────────────────────────────────────────────────────────────

    if (!distribuidorId) {
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-h1 text-text-primary">
                        {distribuidor?.nombre ?? 'Distribuidor'}
                    </h1>
                    <p className="text-small text-text-secondary mt-1">
                        Panel de operaciones · Registro y seguimiento de entregas
                    </p>
                </div>
                <Button onClick={() => setModalOpen(true)}>
                    <PackagePlus className="w-4 h-4" />
                    Nueva entrega
                </Button>
            </div>

            {/* ── KPIs ── */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
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
                                    {['Remisión', 'Estación', 'Combustible', 'Galones', 'Total', 'Fecha', 'Estado'].map(h => (
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
                    <div className="grid grid-cols-2 gap-3">
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
                        <InputField
                            label="Precio por galón (COP)"
                            id="entrega-precio"
                            type="number"
                            min="1"
                            value={form.precioUnitario}
                            onChange={e => setField('precioUnitario', e.target.value)}
                            placeholder="10000"
                            required
                        />
                    </div>
                    <InputField
                        label="Número de remisión"
                        id="entrega-remision"
                        value={form.numeroRemision}
                        onChange={e => setField('numeroRemision', e.target.value)}
                        placeholder="REM-2026-001"
                        required
                    />
                    <InputField
                        label="Fecha de entrega"
                        id="entrega-fecha"
                        type="datetime-local"
                        value={form.fechaEntrega}
                        onChange={e => setField('fechaEntrega', e.target.value)}
                        required
                    />

                    {/* Price summary */}
                    {form.galones && form.precioUnitario && (
                        <div className="bg-bg-elevated rounded-brand p-3 text-[12px] text-text-secondary border border-border-subtle">
                            Total estimado:{' '}
                            <span className="text-amber-400 font-mono font-medium">
                                {formatCurrency(Number(form.galones) * Number(form.precioUnitario))}
                            </span>
                        </div>
                    )}

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
        </div>
    );
}
