import { useState, useEffect, type FormEvent } from 'react';
import { Plus, Pencil, MapPin } from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { InputField, TextAreaField, SelectField } from '@/components/ui/FormFields';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { zonasService, type Zona } from '@/services/admin';

const tipoZonaOptions = [
    { value: 'INTERCONECTADA', label: 'Interconectada' },
    { value: 'NO_INTERCONECTADA', label: 'No Interconectada' },
];

export function ZonasPage() {
    const toast = useToast();
    const [zonas, setZonas] = useState<Zona[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Zona | null>(null);

    // Form state
    const [nombre, setNombre] = useState('');
    const [tipoZona, setTipoZona] = useState('INTERCONECTADA');
    const [departamentos, setDepartamentos] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchZonas = async () => {
        try {
            setLoading(true);
            const data = await zonasService.getAll();
            setZonas(data);
        } catch (err: any) {
            toast.error('Error al cargar zonas: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchZonas(); }, []);

    const openCreate = () => {
        setEditing(null);
        setNombre('');
        setTipoZona('INTERCONECTADA');
        setDepartamentos('');
        setDescripcion('');
        setModalOpen(true);
    };

    const openEdit = (zona: Zona) => {
        setEditing(zona);
        setNombre(zona.nombre);
        setTipoZona(zona.tipoZona);
        setDepartamentos(zona.departamentos.join(', '));
        setDescripcion(zona.descripcion || '');
        setModalOpen(true);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                nombre,
                tipoZona: tipoZona as any,
                departamentos: departamentos.split(',').map(d => d.trim()).filter(Boolean),
                descripcion: descripcion || null,
            };

            if (editing) {
                await zonasService.update(editing.id, payload);
                toast.success('Zona actualizada correctamente');
            } else {
                await zonasService.create(payload);
                toast.success('Zona creada correctamente');
            }

            setModalOpen(false);
            fetchZonas();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Error al guardar zona');
        } finally {
            setSubmitting(false);
        }
    };

    const columns: Column<Zona>[] = [
        {
            key: 'nombre',
            header: 'Nombre',
            render: (z) => (
                <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-amber-500 shrink-0" />
                    <span className="font-medium">{z.nombre}</span>
                </div>
            ),
        },
        {
            key: 'tipoZona',
            header: 'Tipo',
            render: (z) => (
                <Badge variant={z.tipoZona === 'INTERCONECTADA' ? 'green' : 'amber'}>
                    {z.tipoZona === 'INTERCONECTADA' ? 'Interconectada' : 'No Interconectada'}
                </Badge>
            ),
        },
        {
            key: 'departamentos',
            header: 'Departamentos',
            render: (z) => (
                <span className="text-[12px] text-text-secondary">{z.departamentos?.join(', ') || '—'}</span>
            ),
        },
        {
            key: '_count',
            header: 'Estaciones',
            render: (z) => (
                <span className="font-mono text-[12px]">{z._count?.estaciones ?? 0}</span>
            ),
        },
    ];

    return (
        <div className="animate-enter">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-h1 text-text-primary">Zonas de distribución</h1>
                    <p className="text-small text-text-secondary mt-1">
                        Gestiona las zonas geográficas para la distribución de combustibles.
                    </p>
                </div>
                <Button onClick={openCreate}>
                    <Plus size={14} strokeWidth={1.5} />
                    Nueva zona
                </Button>
            </div>

            <DataTable
                columns={columns}
                data={zonas}
                loading={loading}
                searchPlaceholder="Buscar por nombre o departamento..."
                emptyMessage="No hay zonas registradas. Crea la primera."
                actions={(zona) => (
                    <button
                        onClick={(e) => { e.stopPropagation(); openEdit(zona); }}
                        className="p-1.5 rounded-brand hover:bg-bg-elevated interactive text-text-muted hover:text-amber-500"
                        title="Editar"
                    >
                        <Pencil size={14} />
                    </button>
                )}
            />

            {/* Modal crear/editar */}
            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editing ? 'Editar zona' : 'Nueva zona'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <InputField
                        label="Nombre de la zona"
                        id="zona-nombre"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Ej: Zona Centro"
                        required
                    />
                    <SelectField
                        label="Tipo de zona"
                        id="zona-tipo"
                        value={tipoZona}
                        onChange={(e) => setTipoZona(e.target.value)}
                        options={tipoZonaOptions}
                    />
                    <InputField
                        label="Departamentos"
                        id="zona-deptos"
                        value={departamentos}
                        onChange={(e) => setDepartamentos(e.target.value)}
                        placeholder="Cundinamarca, Boyacá, Meta (separados por coma)"
                    />
                    <TextAreaField
                        label="Descripción"
                        id="zona-desc"
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        placeholder="Descripción opcional de la zona"
                    />
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" isLoading={submitting}>
                            {editing ? 'Guardar cambios' : 'Crear zona'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
