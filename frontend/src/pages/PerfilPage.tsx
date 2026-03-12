import { useState, type FormEvent } from 'react';
import { useAuth } from '@/context/useAuth';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { getErrorMessage } from '@/lib/http';

const rolLabels: Record<string, string> = {
    admin: 'Administrador',
    estacion: 'Operador de Estación',
    distribuidor: 'Distribuidor',
    distribuidor_regulado: 'Gran Consumidor (Regulado)',
    regulador: 'Regulador',
    auditor: 'Auditor',
    particular: 'Particular',
};

export function PerfilPage() {
    const { user, updateProfile } = useAuth();

    const [nombre, setNombre] = useState(user?.nombre ?? '');
    const [email, setEmail] = useState(user?.email ?? '');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    if (!user) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password && password !== passwordConfirm) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        const data: { nombre?: string; email?: string; password?: string } = {};
        if (nombre.trim() && nombre.trim() !== user.nombre) data.nombre = nombre.trim();
        if (email.trim() && email.trim() !== user.email) data.email = email.trim();
        if (password) data.password = password;

        if (Object.keys(data).length === 0) {
            setError('No hay cambios para guardar.');
            return;
        }

        setSubmitting(true);
        try {
            await updateProfile(data);
            setSuccess('Perfil actualizado exitosamente.');
            setPassword('');
            setPasswordConfirm('');
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Error al actualizar el perfil. Intenta de nuevo.'));
        } finally {
            setSubmitting(false);
        }
    };

    const rolLabel = rolLabels[user.rol as string] ?? user.rol;

    return (
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-h1 text-text-primary">Mi Perfil</h1>
                <p className="text-small text-text-secondary mt-1">Gestiona tu información personal y contraseña.</p>
            </div>

            {/* Info card */}
            <div className="rounded-brand border border-border-default bg-bg-elevated p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <Icon name="user" size={22} className="text-amber-500" />
                </div>
                <div className="min-w-0">
                    <p className="text-[15px] font-medium text-text-primary truncate">{user.nombre}</p>
                    <p className="text-[13px] text-text-secondary truncate">{user.email}</p>
                    <span className="inline-block mt-1.5 text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-[3px] bg-amber-500/10 text-amber-400 border border-amber-500/15">
                        {rolLabel}
                    </span>
                </div>
            </div>

            {/* Estación / Distribuidor info */}
            {(user as any).estacion && (
                <div className="rounded-brand border border-border-subtle bg-bg-surface px-4 py-3 flex items-center gap-3">
                    <Icon name="station" size={16} className="text-text-muted shrink-0" />
                    <div>
                        <p className="text-[11px] font-mono uppercase tracking-wider text-text-muted">Estación asignada</p>
                        <p className="text-[13px] text-text-primary mt-0.5">{(user as any).estacion.nombre}</p>
                    </div>
                </div>
            )}
            {(user as any).distribuidor && (
                <div className="rounded-brand border border-border-subtle bg-bg-surface px-4 py-3 flex items-center gap-3">
                    <Icon name="tank" size={16} className="text-text-muted shrink-0" />
                    <div>
                        <p className="text-[11px] font-mono uppercase tracking-wider text-text-muted">Distribuidor asignado</p>
                        <p className="text-[13px] text-text-primary mt-0.5">{(user as any).distribuidor.nombre}</p>
                    </div>
                </div>
            )}

            {/* Edit form */}
            <form onSubmit={handleSubmit} className="rounded-brand border border-border-default bg-bg-elevated p-5 space-y-5">
                <h2 className="text-[14px] font-medium text-text-primary">Editar información</h2>

                <div className="space-y-1.5">
                    <label className="text-label text-text-secondary">Nombre completo</label>
                    <div className="relative">
                        <Icon name="user" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={15} />
                        <input
                            type="text"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            className="w-full pl-10 pr-3.5 py-2.5 bg-bg-base border border-border-default rounded-brand text-text-primary text-[14px] placeholder:text-text-muted interactive"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-label text-text-secondary">Email</label>
                    <div className="relative">
                        <Icon name="mail" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={15} />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 pr-3.5 py-2.5 bg-bg-base border border-border-default rounded-brand text-text-primary text-[14px] placeholder:text-text-muted interactive"
                        />
                    </div>
                </div>

                <div className="pt-2 border-t border-border-subtle">
                    <p className="text-[12px] text-text-muted mb-4">Deja en blanco para mantener la contraseña actual.</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="text-label text-text-secondary">Nueva contraseña</label>
                            <div className="relative">
                                <Icon name="lock" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={15} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    minLength={8}
                                    className="w-full pl-10 pr-3.5 py-2.5 bg-bg-base border border-border-default rounded-brand text-text-primary text-[14px] placeholder:text-text-muted interactive"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-label text-text-secondary">Confirmar contraseña</label>
                            <div className="relative">
                                <Icon name="lock" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={15} />
                                <input
                                    type="password"
                                    value={passwordConfirm}
                                    onChange={(e) => setPasswordConfirm(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-3.5 py-2.5 bg-bg-base border border-border-default rounded-brand text-text-primary text-[14px] placeholder:text-text-muted interactive"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="px-3 py-2 bg-red-dim border border-red-500/30 rounded-brand">
                        <p className="text-[12px] font-mono text-red-500">{error}</p>
                    </div>
                )}

                {success && (
                    <div className="px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-brand">
                        <p className="text-[12px] font-mono text-green-400">{success}</p>
                    </div>
                )}

                <div className="flex justify-end">
                    <Button type="submit" isLoading={submitting}>
                        Guardar cambios
                    </Button>
                </div>
            </form>
        </div>
    );
}
