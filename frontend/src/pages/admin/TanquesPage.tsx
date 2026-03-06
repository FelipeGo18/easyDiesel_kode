import { useState, useEffect, type FormEvent } from 'react';
import { Icon } from '@/components/ui/Icon';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { InputField, SelectField } from '@/components/ui/FormFields';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { tanquesService } from '@/services/inventario';
import { estacionesService } from '@/services/actores';
import { type Tanque, type EstacionServicio, type TipoCombustible } from '@/types';

const tipoCombustibleOptions = [
    { value: 'ACPM', label: 'ACPM' },
    { value: 'GASOLINA_CORRIENTE', label: 'Gasolina Corriente' },
    { value: 'GASOLINA_EXTRA', label: 'Gasolina Extra' },
];

export function TanquesPage() {
    const toast = useToast();
    const [tanques, setTanques] = useState<Tanque[]>([]);
    const [estaciones, setEstaciones] = useState<EstacionServicio[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Tanque | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState<Partial<Tanque>>({
        nombre: '',
        capacidadGalones: 0,
        nivelMinimo: 0,
        tipoCombustible: 'ACPM',
        estacionId: '',
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [tanquesData, estacionesData] = await Promise.all([
                tanquesService.getAll(),
                estacionesService.getAll()
            ]);
            setTanques(Array.isArray(tanquesData) ? tanquesData : []);
            setEstaciones(Array.isArray(estacionesData) ? estacionesData : []);
        } catch (err: any) {
            toast.error('Error al cargar datos: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const openCreate = () => {
        setEditing(null);
        setFormData({
            nombre: '',
            capacidadGalones: 0,
            nivelMinimo: 0,
            tipoCombustible: 'ACPM',
            estacionId: '',
        });
        setModalOpen(true);
    };

    const openEdit = (tanque: Tanque) => {
        setEditing(tanque);
        setFormData({ ...tanque });
        setModalOpen(true);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editing) {
                await tanquesService.update(editing.id, formData);
                toast.success('Tanque actualizado correctamente');
            } else {
                await tanquesService.create(formData);
                toast.success('Tanque creado correctamente');
            }
            setModalOpen(false);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Error al guardar tanque');
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
            key: 'estacionId',
            header: 'Estación',
            render: (t) => {
                const est = estaciones.find(e => e.id === t.estacionId);
                return (
                    <div className="flex items-center gap-1.5 text-[12px]">
                        <Icon name="station" size={12} className="text-text-muted" />
                        <span>{est?.nombre || '—'}</span>
                    </div>
                );
            }
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
            key: 'capacidadGalones',
            header: 'Capacidad',
            render: (t) => <span className="font-mono">{Number(t.capacidadGalones).toLocaleString()} gal</span>,
        },
        {
            key: 'nivelMinimo',
            header: 'Mínimo Operativo',
            render: (t) => <span className="text-text-secondary text-[12px]">{Number(t.nivelMinimo).toLocaleString()} gal</span>,
        },
    ];

    return (
        <div className="animate-enter">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-h1 text-text-primary">Gestión de Tanques</h1>
                    <p className="text-small text-text-secondary mt-1">
                        Configura y administra los tanques de combustible de las estaciones.
                    </p>
                </div>
                <Button onClick={openCreate}>
                    <Icon name="plus" size={14} className="mr-1" />
                    Nuevo Tanque
                </Button>
            </div>

            <DataTable
                columns={columns}
                data={tanques}
                loading={loading}
                searchPlaceholder="Buscar tanque o estación..."
                actions={(tanque) => (
                    <button
                        onClick={(e) => { e.stopPropagation(); openEdit(tanque); }}
                        className="p-1.5 rounded-brand hover:bg-bg-elevated interactive text-text-muted hover:text-amber-500"
                        title="Editar"
                    >
                        <Icon name="pencil" size={14} />
                    </button>
                )}
            />

            {/* Modal Crear/Editar */}
            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editing ? 'Editar Tanque' : 'Nuevo Tanque'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <InputField
                        label="Nombre del Tanque"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        placeholder="Ej: Tanque ACPM Principal"
                        required
                    />
                    <SelectField
                        label="Estación de Servicio"
                        value={formData.estacionId}
                        onChange={(e) => setFormData({ ...formData, estacionId: e.target.value })}
                        options={estaciones.map(e => ({ value: e.id, label: e.nombre }))}
                        required
                    />
                    <SelectField
                        label="Tipo de Combustible"
                        value={formData.tipoCombustible}
                        onChange={(e) => setFormData({ ...formData, tipoCombustible: e.target.value as TipoCombustible })}
                        options={tipoCombustibleOptions}
                        required
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <InputField
                            label="Capacidad (Galones)"
                            type="number"
                            value={formData.capacidadGalones}
                            onChange={(e) => setFormData({ ...formData, capacidadGalones: parseFloat(e.target.value) })}
                            required
                        />
                        <InputField
                            label="Nivel Mínimo (Galones)"
                            type="number"
                            value={formData.nivelMinimo}
                            onChange={(e) => setFormData({ ...formData, nivelMinimo: parseFloat(e.target.value) })}
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" isLoading={submitting}>
                            {editing ? 'Guardar Cambios' : 'Crear Tanque'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
