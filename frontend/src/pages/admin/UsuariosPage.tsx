import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Search } from 'lucide-react';
import { Icon } from '@/components/ui/Icon';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { InputField, SelectField } from '@/components/ui/FormFields';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/useToast';
import { usuariosService, rolesService, type Usuario, type Rol } from '@/services/admin';
import { estacionesService, distribuidoresService } from '@/services/actores';
import type { EstacionServicio, Distribuidor } from '@/types';
import { getErrorMessage } from '@/lib/http';

export function UsuariosPage() {
    const toast = useToast();
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [roles, setRoles] = useState<Rol[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Usuario | null>(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
    const LIMIT = 25;

    // Form
    const [email, setEmail] = useState('');
    const [nombre, setNombre] = useState('');
    const [password, setPassword] = useState('');
    const [rolId, setRolId] = useState('');
    const [estacionId, setEstacionId] = useState('');
    const [distribuidorId, setDistribuidorId] = useState('');
    const [estaciones, setEstaciones] = useState<EstacionServicio[]>([]);
    const [distribuidores, setDistribuidores] = useState<Distribuidor[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const fetchUsers = useCallback(async (searchTerm: string, pg: number) => {
        try {
            setLoading(true);
            const usersData = await usuariosService.getAll({ search: searchTerm, page: pg, limit: LIMIT });
            setUsuarios(usersData.data ?? []);
            setPagination({ total: usersData.pagination?.total ?? 0, totalPages: usersData.pagination?.totalPages ?? 1 });
        } catch (error: unknown) {
            toast.error(`Error al cargar usuarios: ${getErrorMessage(error)}`);
        } finally {
            setLoading(false);
        }
    }, []); // toast excluded — stable ref

    // Fetch roles, estaciones, and distribuidores once on mount
    useEffect(() => {
        rolesService.getAll().then(r => setRoles(r)).catch(() => {});
        estacionesService.getAll().then(res => {
            console.log('Estaciones fetched:', res);
            setEstaciones(res.data || []);
        }).catch(err => console.error('Error fetching estaciones:', err));
        
        distribuidoresService.getAll({ limit: 1000 }).then(res => {
            console.log('Distribuidores fetched:', res);
            setDistribuidores(res.data || []);
        }).catch(err => console.error('Error fetching distribuidores:', err));
    }, []);

    // Debounced re-fetch on search/page change
    useEffect(() => {
        const delay = search ? 300 : 0;
        const t = setTimeout(() => fetchUsers(search, page), delay);
        return () => clearTimeout(t);
    }, [search, page, fetchUsers]);

    const fetchData = useCallback(() => {
        fetchUsers(search, page);
    }, [fetchUsers, search, page]);

    const openCreate = () => {
        setEditing(null);
        setEmail(''); setNombre(''); setPassword('');
        setRolId(roles[0]?.id || '');
        setEstacionId('');
        setDistribuidorId('');
        setModalOpen(true);
    };

    const openEdit = (u: Usuario) => {
        setEditing(u);
        setEmail(u.email);
        setNombre(u.nombre);
        setPassword('');
        setRolId(u.rol?.id || '');
        setEstacionId(u.estacionGestionada?.id || '');
        setDistribuidorId(u.distribuidorGestionado?.id || '');
        setModalOpen(true);
    };

    const handleDeactivate = async (u: Usuario) => {
        if (!confirm(`¿Desactivar a ${u.nombre} (${u.email})?`)) return;
        try {
            await usuariosService.deactivate(u.id);
            toast.success('Usuario desactivado');
            fetchData();
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, 'Error al desactivar usuario'));
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const selectedRoleName = roles.find(r => r.id === rolId)?.nombre || '';
        try {
            if (editing) {
                const payload: Record<string, unknown> = { nombre, email };
                if (password) payload.password = password;
                if (rolId) payload.rolId = rolId;
                if (selectedRoleName === 'estacion') payload.estacionId = estacionId || null;
                if (selectedRoleName === 'distribuidor') payload.distribuidorId = distribuidorId || null;
                await usuariosService.update(editing.id, payload);
                toast.success('Usuario actualizado');
            } else {
                const createPayload: Record<string, unknown> = { email, nombre, password: password || undefined, rolId };
                if (selectedRoleName === 'estacion' && estacionId) createPayload.estacionId = estacionId;
                if (selectedRoleName === 'distribuidor' && distribuidorId) createPayload.distribuidorId = distribuidorId;
                await usuariosService.create(createPayload);
                toast.success('Usuario creado correctamente');
            }
            setModalOpen(false);
            fetchData();
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, 'Error al guardar usuario'));
        } finally {
            setSubmitting(false);
        }
    };

    const columns: Column<Usuario>[] = [
        {
            key: 'nombre',
            header: 'Nombre',
            render: (u) => (
                <div className="flex items-center gap-2.5">
                    {u.fotoUrl ? (
                        <div className="relative w-7 h-7 shrink-0">
                            <img
                                src={u.fotoUrl}
                                alt=""
                                referrerPolicy="no-referrer"
                                className="w-7 h-7 rounded-full border border-border-default object-cover absolute inset-0"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                            <div className="w-7 h-7 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                                <Icon name="users" size={13} />
                            </div>
                        </div>
                    ) : (
                        <div className="w-7 h-7 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                            <Icon name="users" size={13} />
                        </div>
                    )}
                    <div className="flex flex-col">
                        <span className="text-[13px] font-medium">{u.nombre}</span>
                        <span className="text-[11px] text-text-muted">{u.email}</span>
                    </div>
                </div>
            ),
        },
        {
            key: 'rol',
            header: 'Rol',
            render: (u) => <Badge variant="amber">{u.rol?.nombre || '—'}</Badge>,
        },
        {
            key: 'authProvider',
            header: 'Auth',
            render: (u) => (
                <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider">
                    {u.authProvider || 'LOCAL'}
                </span>
            ),
        },
        {
            key: 'activo',
            header: 'Estado',
            render: (u) => <Badge variant={u.activo ? 'green' : 'red'}>{u.activo ? 'Activo' : 'Inactivo'}</Badge>,
        },
        {
            key: 'createdAt',
            header: 'Creado',
            render: (u) => (
                <span className="font-mono text-[11px] text-text-muted">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-CO') : '—'}
                </span>
            ),
        },
    ];

    return (
        <div className="animate-enter">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-h1 text-text-primary">Usuarios</h1>
                    <p className="text-small text-text-secondary mt-1">
                        Gestiona los usuarios del sistema y asigna roles.
                    </p>
                </div>
                <Button onClick={openCreate}>
                    <Icon name="plus" size={14} />
                    Nuevo usuario
                </Button>
            </div>

            <div className="mb-4 relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <input
                    type="text"
                    placeholder="Buscar por nombre o email…"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    className="w-full rounded-brand border border-border-input bg-bg-input pl-8 pr-4 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-colors"
                />
            </div>

            <DataTable
                columns={columns}
                data={usuarios}
                loading={loading}
                searchable={false}
                emptyMessage="No hay usuarios registrados."
                actions={(u) => (
                    <>
                        <button
                            onClick={(e) => { e.stopPropagation(); openEdit(u); }}
                            className="p-1.5 rounded-brand hover:bg-bg-elevated interactive text-text-muted hover:text-amber-500"
                            title="Editar"
                        >
                            <Icon name="pencil" size={14} />
                        </button>
                        {u.activo && (
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDeactivate(u); }}
                                className="p-1.5 rounded-brand hover:bg-bg-elevated interactive text-text-muted hover:text-red-500"
                                title="Desactivar"
                            >
                                <Icon name="user-x" size={14} />
                            </button>
                        )}
                    </>
                )}
            />

            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 px-1">
                    <p className="text-[12px] text-text-muted">{pagination.total} usuarios</p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="px-3 py-1.5 rounded-brand border border-border-subtle text-[12px] text-text-muted hover:text-text-primary disabled:opacity-40 transition-colors"
                        >Anterior</button>
                        <span className="px-3 py-1.5 text-[12px] text-text-secondary">{page} / {pagination.totalPages}</span>
                        <button
                            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                            disabled={page >= pagination.totalPages}
                            className="px-3 py-1.5 rounded-brand border border-border-subtle text-[12px] text-text-muted hover:text-text-primary disabled:opacity-40 transition-colors"
                        >Siguiente</button>
                    </div>
                </div>
            )}

            {/* Modal */}
            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editing ? 'Editar usuario' : 'Nuevo usuario'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <InputField
                        label="Nombre completo"
                        id="user-nombre"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Juan Pérez"
                        required
                    />
                    <InputField
                        label="Email"
                        id="user-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="juan@empresa.com"
                        required
                    />
                    <InputField
                        label={editing ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
                        id="user-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={editing ? '••••••••' : 'Contraseña segura'}
                        required={!editing}
                    />
                    {roles.length > 0 && (
                        <SelectField
                            label="Rol"
                            id="user-rol"
                            value={rolId}
                            onChange={(e) => setRolId(e.target.value)}
                            options={roles.map(r => ({ value: r.id, label: r.nombre }))}
                            placeholder="Seleccionar rol"
                        />
                    )}
                    {roles.find(r => r.id === rolId)?.nombre === 'estacion' && (
                        <SelectField
                            label="Estación asignada"
                            id="user-estacion"
                            value={estacionId}
                            onChange={(e) => setEstacionId(e.target.value)}
                            options={[{ value: '', label: '— Sin estación —' }, ...estaciones.map(e => ({ value: e.id, label: e.nombre }))]}
                        />
                    )}
                    {roles.find(r => r.id === rolId)?.nombre === 'distribuidor' && (
                        <SelectField
                            label="Distribuidora asignada"
                            id="user-distribuidor"
                            value={distribuidorId}
                            onChange={(e) => setDistribuidorId(e.target.value)}
                            options={[{ value: '', label: '— Sin distribuidora —' }, ...distribuidores.map(d => ({ value: d.id, label: d.nombre }))]}
                        />
                    )}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" isLoading={submitting}>
                            {editing ? 'Guardar cambios' : 'Crear usuario'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
