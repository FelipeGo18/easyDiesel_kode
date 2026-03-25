import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Icon } from '@/components/ui/Icon';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { InputField, TextAreaField, SelectField } from '@/components/ui/FormFields';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/useToast';
import { zonasService, type Zona } from '@/services/admin';
import { useAccess } from '@/hooks/useAccess';
import { getErrorMessage } from '@/lib/http';

const tipoZonaOptions = [
    { value: 'INTERCONECTADA', label: 'Interconectada' },
    { value: 'NO_INTERCONECTADA', label: 'No Interconectada' },
];

export function ZonasPage() {
    const toast = useToast();
    const { hasAnyPermission } = useAccess();
    const [zonas, setZonas] = useState<Zona[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Zona | null>(null);

    // Lógica de permisos
    const canWrite = hasAnyPermission('zonas:escribir');

    // Form state
    const [nombre, setNombre] = useState('');
    const [tipoZona, setTipoZona] = useState('INTERCONECTADA');
    const [departamentos, setDepartamentos] = useState('');
    const [municipios, setMunicipios] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchZonas = useCallback(async () => {
        try {
            setLoading(true);
            const data = await zonasService.getAll();
            setZonas(data);
        } catch (error: unknown) {
            toast.error(`Error al cargar zonas: ${getErrorMessage(error)}`);
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { fetchZonas(); }, [fetchZonas]);

    const openCreate = () => {
        setEditing(null);
        setNombre('');
        setTipoZona('INTERCONECTADA');
        setDepartamentos('');
        setMunicipios('');
        setDescripcion('');
        setModalOpen(true);
    };

    const openEdit = (zona: Zona) => {
        setEditing(zona);
        setNombre(zona.nombre);
        setTipoZona(zona.tipoZona);
        setDepartamentos(zona.departamentos.join(', '));
        setMunicipios(zona.municipios?.join(', ') || '');
        setDescripcion(zona.descripcion || '');
        setModalOpen(true);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const departamentosList = departamentos.split(',').map(d => d.trim()).filter(Boolean);
            const municipiosList = municipios.split(',').map(m => m.trim()).filter(Boolean);

            if (!nombre.trim()) {
                throw new Error('El nombre de la zona es obligatorio');
            }

            if (!departamentosList.length) {
                throw new Error('Debes registrar al menos un departamento');
            }

            const payload = {
                nombre: nombre.trim(),
                tipoZona: tipoZona as Zona['tipoZona'],
                departamentos: departamentosList,
                municipios: municipiosList,
                descripcion: descripcion.trim() || null,
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
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, 'Error al guardar zona'));
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
                    <Icon name="map" size={14} className="text-amber-500 shrink-0" />
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-h1 text-text-primary mb-1">Zonas de distribución</h1>
                    <p className="text-small text-text-secondary">Configuración de regiones y departamentos regulados</p>
                </div>
                {canWrite && (
                    <Button onClick={openCreate} size="sm" className="w-full sm:w-auto">
                        <Icon name="plus" size={16} className="shrink-0" />
                        Nueva zona
                    </Button>
                )}
            </div>

            <DataTable
                columns={columns}
                data={zonas}
                loading={loading}
                searchPlaceholder="Buscar por nombre o departamento..."
                emptyMessage="No hay zonas registradas. Crea la primera."
                actions={(zona) => canWrite ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); openEdit(zona); }}
                        className="p-1.5 rounded-brand hover:bg-bg-elevated interactive text-text-muted hover:text-amber-500"
                        title="Editar"
                    >
                        <Icon name="pencil" size={14} />
                    </button>
                ) : null}
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
                        placeholder="Cundinamarca, Meta (separados por coma)"
                    />
                    <InputField
                        label="Municipios (Influencia CREG)"
                        id="zona-munis"
                        value={municipios}
                        onChange={(e) => setMunicipios(e.target.value)}
                        placeholder="Cajicá, Chía, Sopó (separados por coma)"
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
