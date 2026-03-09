import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Icon } from '@/components/ui/Icon';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { InputField, SelectField, TextAreaField } from '@/components/ui/FormFields';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { KpiCard } from '@/components/ui/KpiCard';
import { useToast } from '@/components/ui/useToast';
import { useAuth } from '@/context/useAuth';
import { tanquesService, inventarioService, type RegistrarEntregaData, type RegistrarTransaccionData, type CierreTurnoData } from '@/services/inventario';
import { getErrorMessage } from '@/lib/http';
import { type AuthenticatedUser, type Tanque, type TipoServicio } from '@/types';

const tipoServicioOptions = [
    { value: 'PARTICULAR', label: 'Particular' },
    { value: 'PUBLICO', label: 'Público' },
    { value: 'DIPLOMATICO', label: 'Diplomático' },
    { value: 'OFICIAL', label: 'Oficial' },
    { value: 'CARGA', label: 'Carga' },
];

export function InventarioPage() {
    const { user } = useAuth();
    const toast = useToast();
    const [tanques, setTanques] = useState<Tanque[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Modals state
    const [entregaModalOpen, setEntregaModalOpen] = useState(false);
    const [transaccionModalOpen, setTransaccionModalOpen] = useState(false);
    const [cierreModalOpen, setCierreModalOpen] = useState(false);
    const [selectedTanque, setSelectedTanque] = useState<Tanque | null>(null);

    // Form states
    const [entregaForm, setEntregaForm] = useState<Partial<RegistrarEntregaData>>({
        galones: 0,
        precioUnitario: 0,
        numeroRemision: '',
        fechaEntrega: new Date().toISOString().slice(0, 16),
    });

    const [transaccionForm, setTransaccionForm] = useState<Partial<RegistrarTransaccionData>>({
        tipo: 'SALIDA',
        tipoServicio: 'PARTICULAR',
        galones: 0,
        placaVehiculo: '',
    });

    const [cierreForm, setCierreForm] = useState<Partial<CierreTurnoData>>({
        nivelFisico: 0,
        observaciones: '',
    });

    const fetchTanques = useCallback(async () => {
        const currentUser = user as AuthenticatedUser | null;
        if (!currentUser?.estacion?.id) return;
        try {
            setLoading(true);
            const data = await tanquesService.getAll(currentUser.estacion.id);
            setTanques(Array.isArray(data) ? data : []);
        } catch (error: unknown) {
            toast.error(`Error al cargar tanques: ${getErrorMessage(error)}`);
        } finally {
            setLoading(false);
        }
    }, [toast, user]);

    useEffect(() => {
        fetchTanques();
    }, [fetchTanques]);

    const handleEntregaSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const currentUser = user as AuthenticatedUser | null;
        if (!selectedTanque || !currentUser?.estacion?.id) return;
        setSubmitting(true);
        try {
            await inventarioService.registrarEntrega({
                ...entregaForm as RegistrarEntregaData,
                tanqueId: selectedTanque.id,
                estacionId: currentUser.estacion.id,
                tipoCombustible: selectedTanque.tipoCombustible,
                distribuidorId: currentUser.distribuidor?.id || '',
            });
            toast.success('Entrega registrada correctamente');
            setEntregaModalOpen(false);
            fetchTanques();
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, 'Error al registrar entrega'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleTransaccionSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const currentUser = user as AuthenticatedUser | null;
        if (!selectedTanque || !currentUser?.estacion?.id) return;
        setSubmitting(true);
        try {
            if (!transaccionForm.galones || Number(transaccionForm.galones) <= 0) {
                throw new Error('La cantidad de galones debe ser mayor a 0');
            }

            const result = await inventarioService.registrarTransaccion({
                ...transaccionForm as RegistrarTransaccionData,
                tanqueId: selectedTanque.id,
                estacionId: currentUser.estacion.id,
                tipoCombustible: selectedTanque.tipoCombustible,
            });
            const precioAplicado = result.pricing?.precioUnitario;
            toast.success(
                precioAplicado
                    ? `Transacción registrada a ${Math.round(precioAplicado).toLocaleString('es-CO')} COP/galón`
                    : 'Transacción registrada correctamente'
            );
            if (result.alerta) {
                toast.error(result.alerta);
            }
            setTransaccionModalOpen(false);
            fetchTanques();
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, 'Error al registrar transacción'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleCierreSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const currentUser = user as AuthenticatedUser | null;
        if (!selectedTanque || !currentUser?.estacion?.id) return;
        setSubmitting(true);
        try {
            const result = await inventarioService.cierreTurno({
                ...cierreForm as CierreTurnoData,
                tanqueId: selectedTanque.id,
                estacionId: currentUser.estacion.id,
            });
            toast.success(`Cierre completado. Diferencia: ${result.diferencia.toFixed(2)} gal.`);
            setCierreModalOpen(false);
            fetchTanques();
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, 'Error al realizar cierre'));
        } finally {
            setSubmitting(false);
        }
    };

    const columns: Column<Tanque>[] = [
        {
            key: 'nombre',
            header: 'Tanque',
            render: (t) => (
                <div className="flex items-center gap-2">
                    <Icon name="tank" size={14} className="text-blue-500 shrink-0" />
                    <span className="font-medium">{t.nombre}</span>
                </div>
            ),
        },
        {
            key: 'tipoCombustible',
            header: 'Combustible',
            render: (t) => (
                <Badge variant={t.tipoCombustible === 'ACPM' ? 'amber' : 'green'}>
                    {t.tipoCombustible}
                </Badge>
            ),
        },
        {
            key: 'nivelActual',
            header: 'Nivel Actual',
            render: (t) => {
                const nivel = Number(t.nivelActual) || 0;
                const capacidad = Number(t.capacidadGalones) || 1;
                const percentage = (nivel / capacidad) * 100;
                const isLow = nivel <= Number(t.nivelMinimo);
                return (
                    <div className="w-full max-w-[150px]">
                        <div className="flex justify-between mb-1 text-[11px]">
                            <span className={isLow ? 'text-red-500 font-bold' : ''}>
                                {nivel.toLocaleString()} / {capacidad.toLocaleString()} gal
                            </span>
                            <span>{percentage.toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-bg-elevated rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${isLow ? 'bg-red-500' : 'bg-blue-500'}`}
                                style={{ width: `${Math.min(100, percentage)}%` }}
                            />
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'nivelMinimo',
            header: 'Mínimo',
            render: (t) => <span className="text-[12px]">{Number(t.nivelMinimo).toLocaleString()} gal</span>,
        },
    ];

    const safeTanques = Array.isArray(tanques) ? tanques : [];
    const totalInventario = safeTanques.reduce((acc, t) => acc + (Number(t.nivelActual) || 0), 0);
    const tanquesBajos = safeTanques.filter(t => (Number(t.nivelActual) || 0) <= (Number(t.nivelMinimo) || 0)).length;

    return (
        <div className="animate-enter">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-h1 text-text-primary">Control de Inventario</h1>
                    <p className="text-small text-text-secondary mt-1">
                        Monitorea niveles de tanques y registra movimientos de combustible.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                        <Icon name="history" size={14} className="mr-1" />
                        Historial
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <KpiCard
                    label="Total Combustible"
                    value={`${totalInventario.toLocaleString()} gal`}
                    icon={<Icon name="tank" size={18} />}
                    trend={{ direction: 'up', text: 'Capacidad total' }}
                />
                <KpiCard
                    label="Alertas de Nivel"
                    value={tanquesBajos.toString()}
                    icon={<Icon name="alert" size={18} />}
                    trend={{ direction: tanquesBajos > 0 ? 'down' : 'neutral', text: 'Tanques bajo mínimo' }}
                    className={tanquesBajos > 0 ? 'border-red-500/50' : ''}
                />
                <KpiCard
                    label="Estación"
                    value={user?.estacion?.nombre || 'N/A'}
                    icon={<Icon name="clipboard-check" size={18} />}
                    trend={{ direction: 'neutral', text: `SICOM: ${user?.estacion?.codigoSicom || '—'}` }}
                />
            </div>

            <DataTable
                columns={columns}
                data={tanques}
                loading={loading}
                searchPlaceholder="Buscar tanque..."
                actions={(tanque) => (
                    <div className="flex gap-1">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTanque(tanque);
                                setTransaccionModalOpen(true);
                            }}
                            className="p-1.5 rounded-brand hover:bg-bg-elevated interactive text-text-muted hover:text-red-500"
                            title="Registrar Venta (Salida)"
                        >
                            <Icon name="arrow-up-right" size={14} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTanque(tanque);
                                setEntregaModalOpen(true);
                            }}
                            className="p-1.5 rounded-brand hover:bg-bg-elevated interactive text-text-muted hover:text-green-500"
                            title="Registrar Entrega (Entrada)"
                        >
                            <Icon name="arrow-down-left" size={14} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTanque(tanque);
                                setCierreModalOpen(true);
                            }}
                            className="p-1.5 rounded-brand hover:bg-bg-elevated interactive text-text-muted hover:text-blue-500"
                            title="Cierre de Turno / Ajuste"
                        >
                            <Icon name="clipboard-check" size={14} />
                        </button>
                    </div>
                )}
            />

            {/* Modal Entrega (Entrada) */}
            <Modal
                open={entregaModalOpen}
                onClose={() => setEntregaModalOpen(false)}
                title={`Registrar Entrega - ${selectedTanque?.nombre}`}
            >
                <form onSubmit={handleEntregaSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <InputField
                            label="Galones"
                            type="number"
                            value={entregaForm.galones}
                            onChange={(e) => setEntregaForm({ ...entregaForm, galones: parseFloat(e.target.value) })}
                            required
                        />
                        <InputField
                            label="Precio Unitario"
                            type="number"
                            value={entregaForm.precioUnitario}
                            onChange={(e) => setEntregaForm({ ...entregaForm, precioUnitario: parseFloat(e.target.value) })}
                            required
                        />
                    </div>
                    <InputField
                        label="Número de Remisión"
                        value={entregaForm.numeroRemision}
                        onChange={(e) => setEntregaForm({ ...entregaForm, numeroRemision: e.target.value })}
                        required
                    />
                    <InputField
                        label="Fecha de Entrega"
                        type="datetime-local"
                        value={entregaForm.fechaEntrega}
                        onChange={(e) => setEntregaForm({ ...entregaForm, fechaEntrega: e.target.value })}
                        required
                    />
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" type="button" onClick={() => setEntregaModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" isLoading={submitting} className="bg-green-600 hover:bg-green-700">
                            Registrar Entrada
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal Transacción (Salida) */}
            <Modal
                open={transaccionModalOpen}
                onClose={() => setTransaccionModalOpen(false)}
                title={`Registrar Venta - ${selectedTanque?.nombre}`}
            >
                <form onSubmit={handleTransaccionSubmit} className="space-y-4">
                    <SelectField
                        label="Tipo de Servicio"
                        value={transaccionForm.tipoServicio}
                        onChange={(e) => setTransaccionForm({ ...transaccionForm, tipoServicio: e.target.value as TipoServicio })}
                        options={tipoServicioOptions}
                    />
                    <div className="grid grid-cols-1 gap-4">
                        <InputField
                            label="Galones"
                            type="number"
                            value={transaccionForm.galones}
                            onChange={(e) => setTransaccionForm({ ...transaccionForm, galones: parseFloat(e.target.value) })}
                            required
                        />
                    </div>
                    <div className="rounded-brand border border-border-subtle bg-bg-elevated px-3 py-2 text-[12px] text-text-secondary">
                        El precio y el subsidio se calculan automáticamente desde el backend según zona, combustible y tipo de servicio.
                    </div>
                    <InputField
                        label="Placa Vehículo (Opcional)"
                        value={transaccionForm.placaVehiculo}
                        onChange={(e) => setTransaccionForm({ ...transaccionForm, placaVehiculo: e.target.value })}
                    />
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" type="button" onClick={() => setTransaccionModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" isLoading={submitting} className="bg-red-600 hover:bg-red-700">
                            Registrar Salida
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal Cierre / Ajuste */}
            <Modal
                open={cierreModalOpen}
                onClose={() => setCierreModalOpen(false)}
                title={`Cierre de Turno - ${selectedTanque?.nombre}`}
            >
                <form onSubmit={handleCierreSubmit} className="space-y-4">
                    <div className="bg-bg-elevated p-3 rounded-brand mb-4">
                        <p className="text-small text-text-secondary">
                            Nivel Teórico Actual: <span className="font-bold text-text-primary">{selectedTanque?.nivelActual.toLocaleString()} gal</span>
                        </p>
                    </div>
                    <InputField
                        label="Nivel Físico (Lectura de vara)"
                        type="number"
                        value={cierreForm.nivelFisico}
                        onChange={(e) => setCierreForm({ ...cierreForm, nivelFisico: parseFloat(e.target.value) })}
                        required
                    />
                    <TextAreaField
                        label="Observaciones"
                        value={cierreForm.observaciones}
                        onChange={(e) => setCierreForm({ ...cierreForm, observaciones: e.target.value })}
                        placeholder="Motivo del ajuste si hay diferencia..."
                    />
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" type="button" onClick={() => setCierreModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" isLoading={submitting}>
                            Completar Cierre
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
