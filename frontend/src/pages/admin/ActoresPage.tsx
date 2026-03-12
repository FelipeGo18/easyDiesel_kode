import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { MapPin, Search } from 'lucide-react';
import { Icon } from '@/components/ui/Icon';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { InputField, SelectField } from '@/components/ui/FormFields';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/useToast';
import { estacionesService, distribuidoresService } from '@/services/actores';
import { zonasService, usuariosService, type Zona, type Usuario } from '@/services/admin';
import { type EstacionServicio, type Distribuidor } from '@/types';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/http';

type ActorFormData = {
    nombre: string;
    nit: string;
    direccion: string;
    ciudad: string;
    departamento: string;
    usuarioId: string;
    codigoSicom?: string;
    zonaId?: string;
    tipo?: 'MAYORISTA' | 'REGULADO';
};

export function ActoresPage() {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState<'estaciones' | 'distribuidores'>('estaciones');
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [estPage, setEstPage] = useState(1);
    const [distPage, setDistPage] = useState(1);
    const [estPagination, setEstPagination] = useState({ total: 0, totalPages: 1 });
    const [distPagination, setDistPagination] = useState({ total: 0, totalPages: 1 });
    const LIMIT = 25;

    // Data states
    const [estaciones, setEstaciones] = useState<EstacionServicio[]>([]);
    const [distribuidores, setDistribuidores] = useState<Distribuidor[]>([]);
    const [zonas, setZonas] = useState<Zona[]>([]);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);

    // Form state
    const [editing, setEditing] = useState<EstacionServicio | Distribuidor | null>(null);
    const [formData, setFormData] = useState<ActorFormData>({
        nombre: '', nit: '', direccion: '', ciudad: '', departamento: '', usuarioId: ''
    });
    const [submitting, setSubmitting] = useState(false);

    // Zone change state
    const [zoneChangeId, setZoneChangeId] = useState<string | null>(null);
    const [zoneChangeVal, setZoneChangeVal] = useState('');
    const [changingZone, setChangingZone] = useState(false);

    // Fetch meta (zones + users for the modal) once on mount
    useEffect(() => {
        Promise.all([zonasService.getAll(), usuariosService.getAll({ limit: 500 })])
            .then(([z, u]) => { setZonas(z); setUsuarios(u.data); })
            .catch(() => {});
    }, []);

    const fetchActores = useCallback(async (tab: 'estaciones' | 'distribuidores', searchTerm: string, page: number) => {
        setLoading(true);
        try {
            if (tab === 'estaciones') {
                const result = await estacionesService.getAll({ search: searchTerm, page, limit: LIMIT });
                setEstaciones(result.data ?? []);
                setEstPagination({ total: result.pagination?.total ?? 0, totalPages: result.pagination?.totalPages ?? 1 });
            } else {
                const result = await distribuidoresService.getAll({ search: searchTerm, page, limit: LIMIT });
                setDistribuidores(result.data ?? []);
                setDistPagination({ total: result.pagination?.total ?? 0, totalPages: result.pagination?.totalPages ?? 1 });
            }
        } catch (error: unknown) {
            toast.error(`Error al cargar datos: ${getErrorMessage(error)}`);
        } finally {
            setLoading(false);
        }
    }, []); // toast excluded — stable after ToastProvider fix

    // Debounce: re-fetch when search/tab/page changes
    useEffect(() => {
        const page = activeTab === 'estaciones' ? estPage : distPage;
        const delay = search ? 300 : 0;
        const timer = setTimeout(() => fetchActores(activeTab, search, page), delay);
        return () => clearTimeout(timer);
    }, [activeTab, search, estPage, distPage, fetchActores]);

    const fetchData = useCallback(async () => {
        await fetchActores(activeTab, search, activeTab === 'estaciones' ? estPage : distPage);
    }, [activeTab, search, estPage, distPage, fetchActores]);

    const openCreate = () => {
        setEditing(null);
        setFormData(activeTab === 'estaciones' ? {
            nombre: '', nit: '', direccion: '', ciudad: '', departamento: '', codigoSicom: '', zonaId: '', usuarioId: ''
        } : {
            nombre: '', nit: '', tipo: 'MAYORISTA', direccion: '', ciudad: '', departamento: '', usuarioId: ''
        });
        setModalOpen(true);
    };

    const openEdit = (actor: EstacionServicio | Distribuidor) => {
        setEditing(actor);
        setFormData({
            nombre: actor.nombre,
            nit: actor.nit,
            direccion: actor.direccion,
            ciudad: actor.ciudad,
            departamento: actor.departamento,
            usuarioId: actor.usuarioId || '',
            codigoSicom: 'codigoSicom' in actor ? actor.codigoSicom : '',
            zonaId: 'zonaId' in actor ? actor.zonaId : '',
            tipo: 'tipo' in actor ? actor.tipo : undefined,
        });
        setModalOpen(true);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (activeTab === 'estaciones') {
                if (editing) {
                    await estacionesService.update(editing.id, formData);
                    toast.success('Estación actualizada correctamente');
                } else {
                    await estacionesService.create(formData);
                    toast.success('Estación creada correctamente');
                }
            } else {
                if (editing) {
                    await distribuidoresService.update(editing.id, formData);
                    toast.success('Distribuidor actualizado correctamente');
                } else {
                    await distribuidoresService.create(formData);
                    toast.success('Distribuidor creado correctamente');
                }
            }
            setModalOpen(false);
            fetchData();
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, 'Error al guardar'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleZoneChange = async (e: FormEvent) => {
        e.preventDefault();
        if (!zoneChangeId || !zoneChangeVal) return;
        setChangingZone(true);
        try {
            await estacionesService.updateZona(zoneChangeId, zoneChangeVal);
            toast.success('Zona actualizada correctamente');
            setZoneChangeId(null);
            fetchData();
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, 'Error al cambiar zona'));
        } finally {
            setChangingZone(false);
        }
    };

    const estacionColumns: Column<EstacionServicio>[] = [
        {
            key: 'nombre',
            header: 'Nombre',
            render: (e) => (
                <div className="flex items-center gap-2">
                    <Icon name="station" size={14} className="text-blue-500 shrink-0" />
                    <span className="font-medium">{e.nombre}</span>
                </div>
            ),
        },
        { key: 'nit', header: 'NIT' },
        { key: 'codigoSicom', header: 'SICOM' },
        { key: 'ciudad', header: 'Ciudad' },
        {
            key: 'zona',
            header: 'Zona',
            render: (e) => <Badge variant="blue">{e.zona?.nombre || '—'}</Badge>
        },
        {
            key: 'usuario',
            header: 'Administrador',
            render: (e) => (
                <div className="flex items-center gap-1.5 text-[12px]">
                    <Icon name="users" size={12} className="text-text-muted" />
                    <span>{e.usuario?.nombre || '—'}</span>
                </div>
            )
        },
    ];

    const distribuidorColumns: Column<Distribuidor>[] = [
        {
            key: 'nombre',
            header: 'Nombre',
            render: (d) => (
                <div className="flex items-center gap-2">
                    <Icon name="truck" size={14} className="text-green-500 shrink-0" />
                    <span className="font-medium">{d.nombre}</span>
                </div>
            ),
        },
        { key: 'nit', header: 'NIT' },
        { key: 'ciudad', header: 'Ciudad' },
        {
            key: 'tipo',
            header: 'Tipo',
            render: (d) => (
                <Badge variant={d.tipo === 'MAYORISTA' ? 'green' : 'amber'}>
                    {d.tipo}
                </Badge>
            )
        },
        {
            key: 'usuario',
            header: 'Responsable',
            render: (d) => (
                <div className="flex items-center gap-1.5 text-[12px]">
                    <Icon name="users" size={12} className="text-text-muted" />
                    <span>{d.usuario?.nombre || '—'}</span>
                </div>
            )
        },
    ];

    return (
        <div className="animate-enter">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-h1 text-text-primary">Gestión de Actores</h1>
                    <p className="text-small text-text-secondary mt-1">
                        Administra las estaciones de servicio y distribuidores mayoristas.
                    </p>
                </div>
                <Button onClick={openCreate}>
                    <Icon name="plus" size={14} className="mr-1" />
                    {activeTab === 'estaciones' ? 'Nueva Estación' : 'Nuevo Distribuidor'}
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-border-subtle mb-4">
                <button
                    onClick={() => { setActiveTab('estaciones'); setSearch(''); setEstPage(1); }}
                    className={cn(
                        "pb-2 px-1 text-small font-medium transition-colors relative",
                        activeTab === 'estaciones' ? "text-amber-500" : "text-text-muted hover:text-text-primary"
                    )}
                >
                    Estaciones de Servicio
                    {activeTab === 'estaciones' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />}
                </button>
                <button
                    onClick={() => { setActiveTab('distribuidores'); setSearch(''); setDistPage(1); }}
                    className={cn(
                        "pb-2 px-1 text-small font-medium transition-colors relative",
                        activeTab === 'distribuidores' ? "text-amber-500" : "text-text-muted hover:text-text-primary"
                    )}
                >
                    Distribuidores
                    {activeTab === 'distribuidores' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />}
                </button>
            </div>

            {/* Search input */}
            <div className="relative mb-6">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <input
                    type="text"
                    placeholder={activeTab === 'estaciones' ? 'Buscar por nombre, NIT, ciudad o código SICOM…' : 'Buscar por nombre, NIT o ciudad…'}
                    value={search}
                    onChange={e => { setSearch(e.target.value); if (activeTab === 'estaciones') setEstPage(1); else setDistPage(1); }}
                    className="w-full rounded-brand border border-border-input bg-bg-input pl-8 pr-4 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-colors"
                />
            </div>

            {activeTab === 'estaciones' ? (
                <>
                <DataTable
                    columns={estacionColumns}
                    data={estaciones}
                    loading={loading}
                    searchable={false}
                    pageSize={LIMIT}
                    actions={(actor) => (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); setZoneChangeId(actor.id); setZoneChangeVal((actor as EstacionServicio).zonaId || ''); }}
                                className="p-1.5 rounded-brand hover:bg-bg-elevated interactive text-text-muted hover:text-emerald-500"
                                title="Cambiar zona"
                            >
                                <MapPin size={14} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); openEdit(actor); }}
                                className="p-1.5 rounded-brand hover:bg-bg-elevated interactive text-text-muted hover:text-amber-500"
                                title="Editar"
                            >
                                <Icon name="pencil" size={14} />
                            </button>
                        </>
                    )}
                />
                {estPagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 px-1">
                        <p className="text-[12px] text-text-muted">{estPagination.total} estaciones</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setEstPage(p => Math.max(1, p - 1))}
                                disabled={estPage <= 1}
                                className="px-3 py-1.5 rounded-brand border border-border-subtle text-[12px] text-text-muted hover:text-text-primary disabled:opacity-40 transition-colors"
                            >
                                Anterior
                            </button>
                            <span className="px-3 py-1.5 text-[12px] text-text-secondary">{estPage} / {estPagination.totalPages}</span>
                            <button
                                onClick={() => setEstPage(p => Math.min(estPagination.totalPages, p + 1))}
                                disabled={estPage >= estPagination.totalPages}
                                className="px-3 py-1.5 rounded-brand border border-border-subtle text-[12px] text-text-muted hover:text-text-primary disabled:opacity-40 transition-colors"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
                </>
            ) : (
                <>
                <DataTable
                    columns={distribuidorColumns}
                    data={distribuidores}
                    loading={loading}
                    searchable={false}
                    pageSize={LIMIT}
                    actions={(actor) => (
                        <button
                            onClick={(e) => { e.stopPropagation(); openEdit(actor); }}
                            className="p-1.5 rounded-brand hover:bg-bg-elevated interactive text-text-muted hover:text-amber-500"
                            title="Editar"
                        >
                            <Icon name="pencil" size={14} />
                        </button>
                    )}
                />
                {distPagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 px-1">
                        <p className="text-[12px] text-text-muted">{distPagination.total} distribuidores</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setDistPage(p => Math.max(1, p - 1))}
                                disabled={distPage <= 1}
                                className="px-3 py-1.5 rounded-brand border border-border-subtle text-[12px] text-text-muted hover:text-text-primary disabled:opacity-40 transition-colors"
                            >
                                Anterior
                            </button>
                            <span className="px-3 py-1.5 text-[12px] text-text-secondary">{distPage} / {distPagination.totalPages}</span>
                            <button
                                onClick={() => setDistPage(p => Math.min(distPagination.totalPages, p + 1))}
                                disabled={distPage >= distPagination.totalPages}
                                className="px-3 py-1.5 rounded-brand border border-border-subtle text-[12px] text-text-muted hover:text-text-primary disabled:opacity-40 transition-colors"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
                </>
            )}

            {/* Modal */}
            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editing ? `Editar ${activeTab === 'estaciones' ? 'Estación' : 'Distribuidor'}` : `Nueva ${activeTab === 'estaciones' ? 'Estación' : 'Distribuidor'}`}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <InputField
                            label="Nombre"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            required
                        />
                        <InputField
                            label="NIT"
                            value={formData.nit}
                            onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                            required
                        />
                    </div>

                    {activeTab === 'distribuidores' && (
                        <SelectField
                            label="Tipo de Distribuidor"
                            value={formData.tipo}
                            onChange={(e) => setFormData({ ...formData, tipo: e.target.value as ActorFormData['tipo'] })}
                            options={[
                                { value: 'MAYORISTA', label: 'Mayorista' },
                                { value: 'REGULADO', label: 'Regulado' },
                            ]}
                        />
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <InputField
                            label="Dirección"
                            value={formData.direccion}
                            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                            required
                        />
                        <InputField
                            label="Ciudad"
                            value={formData.ciudad}
                            onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <InputField
                            label="Departamento"
                            value={formData.departamento}
                            onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                            required
                        />
                        {activeTab === 'estaciones' && (
                            <InputField
                                label="Código SICOM"
                                value={formData.codigoSicom}
                                onChange={(e) => setFormData({ ...formData, codigoSicom: e.target.value })}
                                required
                            />
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {activeTab === 'estaciones' && (
                            <SelectField
                                label="Zona"
                                value={formData.zonaId}
                                onChange={(e) => setFormData({ ...formData, zonaId: e.target.value })}
                                options={zonas.map(z => ({ value: z.id, label: z.nombre }))}
                                required
                            />
                        )}
                        <SelectField
                            label={activeTab === 'estaciones' ? "Administrador" : "Responsable"}
                            value={formData.usuarioId}
                            onChange={(e) => setFormData({ ...formData, usuarioId: e.target.value })}
                            options={usuarios.map(u => ({ value: u.id, label: u.nombre }))}
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" isLoading={submitting}>
                            {editing ? 'Guardar Cambios' : 'Crear'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal: Cambiar zona de estación */}
            <Modal
                open={!!zoneChangeId}
                onClose={() => setZoneChangeId(null)}
                title="Cambiar zona regulatoria"
            >
                <form onSubmit={handleZoneChange} className="space-y-4">
                    <p className="text-[13px] text-text-secondary">
                        Reasignar zona de <strong>{estaciones.find(e => e.id === zoneChangeId)?.nombre ?? 'la estación'}</strong>.
                    </p>
                    <SelectField
                        label="Nueva zona"
                        value={zoneChangeVal}
                        onChange={(e) => setZoneChangeVal(e.target.value)}
                        options={zonas.map(z => ({ value: z.id, label: `${z.nombre} (${z.tipoZona})` }))}
                        placeholder="Seleccionar zona"
                        required
                    />
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" type="button" onClick={() => setZoneChangeId(null)}>Cancelar</Button>
                        <Button type="submit" isLoading={changingZone}>Actualizar zona</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
