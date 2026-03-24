import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { InputField, SelectField } from '@/components/ui/FormFields';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { useToast } from '@/components/ui/useToast';
import { useAuth } from '@/context/useAuth';
import { tanquesService } from '@/services/inventario';
import { getErrorMessage } from '@/lib/http';
import { type AuthenticatedUser, type Tanque, type TipoCombustible } from '@/types';

export function InventarioPage() {
    const { user } = useAuth();
    const currentUser = user as AuthenticatedUser | null;
    const toast = useToast();
    const [tanques, setTanques] = useState<Tanque[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showTanqueForm, setShowTanqueForm] = useState(false);

    // Form state
    const [editingTanque, setEditingTanque] = useState<Tanque | null>(null);

    const [tanqueForm, setTanqueForm] = useState<Partial<Tanque>>({
        nombre: '',
        capacidadGalones: 0,
        nivelMinimo: 0,
        tipoCombustible: 'ACPM',
        estacionId: currentUser?.estacion?.id ?? '',
    });

    const fetchTanques = useCallback(async () => {
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
    }, [toast, currentUser?.estacion?.id]);

    useEffect(() => {
        fetchTanques();
    }, [fetchTanques]);

    const openCreateTanque = () => {
        setEditingTanque(null);
        setTanqueForm({
            nombre: '',
            capacidadGalones: 0,
            nivelMinimo: 0,
            tipoCombustible: 'ACPM',
            estacionId: currentUser?.estacion?.id ?? '',
        });
        setShowTanqueForm(true);
    };

    const openEditTanque = (tanque: Tanque) => {
        setEditingTanque(tanque);
        setTanqueForm({ ...tanque });
        setShowTanqueForm(true);
    };

    const handleTanqueSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingTanque) {
                await tanquesService.update(editingTanque.id, tanqueForm);
                toast.success('Tanque actualizado correctamente');
            } else {
                await tanquesService.create(tanqueForm);
                toast.success('Tanque creado correctamente');
            }
            setShowTanqueForm(false);
            fetchTanques();
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, 'Error al guardar tanque'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteTanque = async (id: string) => {
        if (!window.confirm('¿Estás seguro de eliminar este tanque? Esta acción no se puede deshacer.')) return;
        try {
            await tanquesService.delete(id);
            toast.success('Tanque eliminado correctamente');
            fetchTanques();
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, 'Error al eliminar tanque'));
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
                    <h1 className="text-h1 text-text-primary">Gestión de Tanques</h1>
                    <p className="text-small text-text-secondary mt-1">
                        Administra la capacidad y parámetros técnicos de tus tanques de combustible.
                    </p>
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

            {showTanqueForm ? (
                <Card className="p-6 mb-6 animate-enter">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-h2 text-text-primary">
                            {editingTanque ? 'Editar Tanque' : 'Nuevo Tanque'}
                        </h2>
                        <button
                            onClick={() => setShowTanqueForm(false)}
                            className="p-2 text-text-muted hover:text-text-primary transition-colors"
                        >
                            <Icon name="close" size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleTanqueSubmit} className="space-y-4 max-w-2xl">
                        <InputField
                            label="Nombre del Tanque"
                            value={tanqueForm.nombre}
                            onChange={(e) => setTanqueForm({ ...tanqueForm, nombre: e.target.value })}
                            placeholder="Ej: Tanque ACPM Principal"
                            required
                        />
                        <SelectField
                            label="Tipo de Combustible"
                            value={tanqueForm.tipoCombustible}
                            onChange={(e) => setTanqueForm({ ...tanqueForm, tipoCombustible: e.target.value as TipoCombustible })}
                            options={[
                                { value: 'ACPM', label: 'ACPM' },
                                { value: 'GASOLINA_CORRIENTE', label: 'Gasolina Corriente' },
                            ]}
                            required
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InputField
                                label="Capacidad (Galones)"
                                type="number"
                                value={tanqueForm.capacidadGalones}
                                onChange={(e) => setTanqueForm({ ...tanqueForm, capacidadGalones: parseFloat(e.target.value) })}
                                required
                            />
                            <InputField
                                label="Nivel Mínimo (Galones)"
                                type="number"
                                value={tanqueForm.nivelMinimo}
                                onChange={(e) => setTanqueForm({ ...tanqueForm, nivelMinimo: parseFloat(e.target.value) })}
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
                            <Button variant="ghost" type="button" onClick={() => setShowTanqueForm(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" isLoading={submitting}>
                                {editingTanque ? 'Guardar Cambios' : 'Crear Tanque'}
                            </Button>
                        </div>
                    </form>
                </Card>
            ) : (
                <DataTable
                    columns={columns}
                    data={tanques}
                    loading={loading}
                    searchPlaceholder="Buscar tanque..."
                    headerContent={
                        <Button onClick={openCreateTanque} size="sm" className="shrink-0">
                            <Icon name="plus" size={16} className="mr-1" />
                            Crear Nuevo Tanque
                        </Button>
                    }
                    actions={(tanque) => (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); openEditTanque(tanque); }}
                                className="p-2 rounded-brand hover:bg-bg-elevated interactive text-text-muted hover:text-amber-500 flex items-center justify-center"
                                title="Editar Tanque"
                            >
                                <Icon name="pencil" size={21} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteTanque(tanque.id); }}
                                className="p-2 rounded-brand hover:bg-bg-elevated interactive text-text-muted hover:text-red-600 flex items-center justify-center"
                                title="Eliminar Tanque"
                            >
                                <Icon name="close" size={21} />
                            </button>
                        </div>
                    )}
                />
            )}
        </div>
    );
}
