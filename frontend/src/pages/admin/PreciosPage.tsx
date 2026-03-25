import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Icon } from '@/components/ui/Icon';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { InputField, SelectField } from '@/components/ui/FormFields';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/useToast';
import { preciosService, zonasService, decretosService, type Precio, type Zona, type Decreto } from '@/services/admin';
import { useAccess } from '@/hooks/useAccess';
import { getErrorMessage } from '@/lib/http';

const combustibleOptions = [
    { value: 'ACPM', label: 'ACPM (Diésel)' },
    { value: 'GASOLINA_CORRIENTE', label: 'Gasolina Corriente' },
];

const servicioOptions = [
    { value: 'PARTICULAR', label: 'Particular' },
    { value: 'PUBLICO', label: 'Público' },
    { value: 'OFICIAL', label: 'Oficial' },
    { value: 'DIPLOMATICO', label: 'Diplomático' },
    { value: 'CARGA', label: 'Carga' },
];

const formatCOP = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);

export function PreciosPage() {
    const toast = useToast();
    const { hasAnyPermission } = useAccess();
    const [precios, setPrecios] = useState<Precio[]>([]);
    const [zonas, setZonas] = useState<Zona[]>([]);
    const [decretos, setDecretos] = useState<Decreto[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Precio | null>(null);

    // Form
    const [tipoCombustible, setTipoCombustible] = useState('ACPM');
    const [tipoServicio, setTipoServicio] = useState('PARTICULAR');
    const [zonaId, setZonaId] = useState('');
    const [precioGalon, setPrecioGalon] = useState('');
    const [subsidioGalon, setSubsidioGalon] = useState('0');
    const [decretoId, setDecretoId] = useState('');
    const [vigenciaDesde, setVigenciaDesde] = useState('');
    const [vigenciaHasta, setVigenciaHasta] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [preciosData, zonasData, decretosData] = await Promise.all([
                preciosService.getAll(),
                zonasService.getAll(),
                decretosService.getAll(),
            ]);
            setPrecios(preciosData);
            setZonas(zonasData);
            setDecretos(decretosData.filter(d => d.activo));
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, 'Error al cargar datos'));
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const openCreate = () => {
        setEditing(null);
        setTipoCombustible('ACPM'); setTipoServicio('PARTICULAR');
        setZonaId(zonas[0]?.id || ''); setDecretoId(decretos[0]?.id || '');
        setPrecioGalon(''); setSubsidioGalon('0');
        setVigenciaDesde(new Date().toISOString().slice(0, 10)); setVigenciaHasta('');
        setModalOpen(true);
    };

    const openEdit = (p: Precio) => {
        setEditing(p);
        setTipoCombustible(p.tipoCombustible);
        setTipoServicio(p.tipoServicio);
        setZonaId(p.zonaId);
        setPrecioGalon(String(p.precioGalon));
        setSubsidioGalon(String(p.subsidioGalon));
        setDecretoId(p.decretoId);
        setVigenciaDesde(p.vigenciaDesde?.slice(0, 10) || '');
        setVigenciaHasta(p.vigenciaHasta?.slice(0, 10) || '');
        setModalOpen(true);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (!zonaId || !decretoId) {
                throw new Error('Selecciona una zona y un decreto vigentes');
            }

            if (Number(precioGalon) <= 0) {
                throw new Error('El precio por galón debe ser mayor a 0');
            }

            const payload = {
                tipoCombustible,
                tipoServicio,
                zonaId,
                precioGalon: parseFloat(precioGalon),
                subsidioGalon: parseFloat(subsidioGalon || '0'),
                decretoId,
                vigenciaDesde: vigenciaDesde ? `${vigenciaDesde}T00:00:00Z` : '',
                vigenciaHasta: vigenciaHasta ? `${vigenciaHasta}T23:59:59Z` : null,
            };

            if (editing) {
                await preciosService.update(editing.id, payload);
                toast.success('Precio actualizado correctamente');
            } else {
                await preciosService.create(payload);
                toast.success('Precio creado. El precio anterior fue desactivado automáticamente.');
            }

            setModalOpen(false);
            fetchData();
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, 'Error al guardar precio'));
        } finally {
            setSubmitting(false);
        }
    };

    const columns: Column<Precio>[] = [
        {
            key: 'tipoCombustible',
            header: 'Combustible',
            render: (p) => (
                <div className="flex items-center gap-2">
                    <Icon name="prices" size={14} className="text-amber-500 shrink-0" />
                    <span className="font-mono text-[12px] font-medium uppercase">{p.tipoCombustible.replace('_', ' ')}</span>
                </div>
            ),
        },
        {
            key: 'tipoServicio',
            header: 'Servicio',
            render: (p) => <span className="text-[12px]">{p.tipoServicio}</span>,
        },
        {
            key: 'zona',
            header: 'Zona',
            render: (p) => <span className="text-[12px] text-text-secondary">{p.zona?.nombre || p.zonaId}</span>,
        },
        {
            key: 'precioGalon',
            header: 'Precio/galón',
            render: (p) => <span className="font-mono text-[13px] text-amber-500 font-semibold">{formatCOP(Number(p.precioGalon))}</span>,
        },
        {
            key: 'subsidioGalon',
            header: 'Subsidio',
            render: (p) => (
                <span className={`font-mono text-[12px] ${Number(p.subsidioGalon) > 0 ? 'text-green-500' : 'text-text-muted'}`}>
                    {Number(p.subsidioGalon) > 0 ? formatCOP(Number(p.subsidioGalon)) : '—'}
                </span>
            ),
        },
        {
            key: 'decreto',
            header: 'Decreto',
            render: (p) => <span className="font-mono text-[11px] text-text-secondary">{p.decreto?.numero || '—'}</span>,
        },
        {
            key: 'activo',
            header: 'Estado',
            render: (p) => <Badge variant={p.activo ? 'green' : 'red'}>{p.activo ? 'Vigente' : 'Inactivo'}</Badge>,
        },
    ];

    return (
        <div className="animate-enter">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-h1 text-text-primary">Precios vigentes</h1>
                    <p className="text-small text-text-secondary mt-1">
                        Gestiona los precios por tipo de combustible, servicio y zona.
                        Al crear un precio nuevo, el anterior se desactiva automáticamente.
                    </p>
                </div>
                <Button onClick={openCreate} disabled={zonas.length === 0 || decretos.length === 0 || !hasAnyPermission('precios:escribir')} className="w-full sm:w-auto">
                    <Icon name="plus" size={14} className="mr-2" />
                    Nuevo precio
                </Button>
            </div>

            {(zonas.length === 0 || decretos.length === 0) && !loading && (
                <div className="px-4 py-3 mb-4 bg-amber-dim border border-amber-500/20 rounded-brand">
                    <p className="text-[12px] text-amber-500 font-sans">
                        Debes crear al menos una <strong>zona</strong> y un <strong>decreto</strong> antes de agregar precios.
                    </p>
                </div>
            )}

            <DataTable
                columns={columns}
                data={precios}
                loading={loading}
                searchPlaceholder="Buscar por combustible, zona..."
                emptyMessage="No hay precios registrados."
                actions={(p) => (
                    hasAnyPermission('precios:escribir') ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); openEdit(p); }}
                            className="p-1.5 rounded-brand hover:bg-bg-elevated interactive text-text-muted hover:text-amber-500"
                            title="Editar"
                        >
                            <Icon name="pencil" size={14} />
                        </button>
                    ) : null
                )}
            />

            {/* Modal */}
            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editing ? 'Editar precio' : 'Nuevo precio vigente'}
                maxWidth="520px"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <SelectField
                            label="Combustible"
                            id="precio-combustible"
                            value={tipoCombustible}
                            onChange={(e) => setTipoCombustible(e.target.value)}
                            options={combustibleOptions}
                        />
                        <SelectField
                            label="Tipo de servicio"
                            id="precio-servicio"
                            value={tipoServicio}
                            onChange={(e) => setTipoServicio(e.target.value)}
                            options={servicioOptions}
                        />
                    </div>
                    <SelectField
                        label="Zona"
                        id="precio-zona"
                        value={zonaId}
                        onChange={(e) => setZonaId(e.target.value)}
                        options={zonas.map(z => ({ value: z.id, label: z.nombre }))}
                        placeholder="Selecciona una zona"
                        required
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <InputField
                            label="Precio por galón (COP)"
                            id="precio-galon"
                            type="number"
                            value={precioGalon}
                            onChange={(e) => setPrecioGalon(e.target.value)}
                            placeholder="9876"
                            required
                        />
                        <InputField
                            label="Subsidio por galón (COP)"
                            id="precio-subsidio"
                            type="number"
                            value={subsidioGalon}
                            onChange={(e) => setSubsidioGalon(e.target.value)}
                            placeholder="0"
                        />
                    </div>
                    <SelectField
                        label="Decreto normativo"
                        id="precio-decreto"
                        value={decretoId}
                        onChange={(e) => setDecretoId(e.target.value)}
                        options={decretos.map(d => ({ value: d.id, label: `${d.numero} — ${d.titulo}` }))}
                        placeholder="Selecciona decreto"
                        required
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <InputField
                            label="Vigencia desde"
                            id="precio-desde"
                            type="date"
                            value={vigenciaDesde}
                            onChange={(e) => setVigenciaDesde(e.target.value)}
                            required
                        />
                        <InputField
                            label="Vigencia hasta"
                            id="precio-hasta"
                            type="date"
                            value={vigenciaHasta}
                            onChange={(e) => setVigenciaHasta(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" isLoading={submitting}>
                            {editing ? 'Guardar cambios' : 'Crear precio'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
