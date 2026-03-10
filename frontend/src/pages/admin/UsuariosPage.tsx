import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Icon } from '@/components/ui/Icon';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { InputField, SelectField } from '@/components/ui/FormFields';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/useToast';
import { usuariosService, type Usuario, type Rol } from '@/services/admin';
import { getErrorMessage } from '@/lib/http';

export function UsuariosPage() {
    const toast = useToast();
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [roles, setRoles] = useState<Rol[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Usuario | null>(null);

    // Form
    const [email, setEmail] = useState('');
    const [nombre, setNombre] = useState('');
    const [password, setPassword] = useState('');
    const [rolId, setRolId] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const usersData = await usuariosService.getAll();
            setUsuarios(Array.isArray(usersData) ? usersData : []);

            // Extract unique roles from users if no separate roles endpoint
            const uniqueRoles = new Map<string, Rol>();
            (Array.isArray(usersData) ? usersData : []).forEach((u: Usuario) => {
                if (u.rol?.id) uniqueRoles.set(u.rol.id, u.rol as Rol);
            });
            setRoles(Array.from(uniqueRoles.values()));
        } catch (error: unknown) {
            toast.error(`Error al cargar usuarios: ${getErrorMessage(error)}`);
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const openCreate = () => {
        setEditing(null);
        setEmail(''); setNombre(''); setPassword('');
        setRolId(roles[0]?.id || '');
        setModalOpen(true);
    };

    const openEdit = (u: Usuario) => {
        setEditing(u);
        setEmail(u.email);
        setNombre(u.nombre);
        setPassword('');
        setRolId(u.rol?.id || '');
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
        try {
            if (editing) {
                const payload: Record<string, unknown> = { nombre, email };
                if (password) payload.password = password;
                if (rolId) payload.rolId = rolId;
                await usuariosService.update(editing.id, payload);
                toast.success('Usuario actualizado');
            } else {
                await usuariosService.create({ email, nombre, password: password || undefined, rolId });
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
                        <img src={u.fotoUrl} alt="" className="w-7 h-7 rounded-full border border-border-default" />
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

            <DataTable
                columns={columns}
                data={usuarios}
                loading={loading}
                searchPlaceholder="Buscar por nombre o email..."
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
