import { useAuth } from '@/context/useAuth';

export function Topbar() {
    const { user } = useAuth();

    const now = new Date();
    const formatted = now.toLocaleDateString('es-CO', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
    const time = now.toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });

    return (
        <header className="h-14 flex items-center justify-between px-6 border-b border-border-subtle bg-bg-surface shrink-0">
            {/* Left — Page title can be passed via context later */}
            <div className="flex items-center gap-3">
                <h1 className="text-h2 text-text-primary">Dashboard</h1>
            </div>

            {/* Right */}
            <div className="flex items-center gap-5">
                {/* System status */}
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="status-live absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                    <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
                        En línea
                    </span>
                </div>

                {/* Separator */}
                <span className="w-px h-5 bg-border-subtle" />

                {/* Date/Time */}
                <div className="flex flex-col items-end">
                    <span className="text-[11px] font-mono text-text-secondary tracking-wider">
                        {time}
                    </span>
                    <span className="text-[9px] font-mono text-text-muted uppercase tracking-wider">
                        {formatted}
                    </span>
                </div>

                {/* Separator */}
                <span className="w-px h-5 bg-border-subtle" />

                {/* User avatar */}
                {user && (
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-[var(--radius-brand)] bg-amber-dim border border-amber-500/20 flex items-center justify-center">
                            {user.fotoUrl ? (
                                <img
                                    src={user.fotoUrl}
                                    alt={user.nombre}
                                    className="w-full h-full rounded-[var(--radius-brand)] object-cover"
                                />
                            ) : (
                                <span className="text-amber-500 text-[11px] font-mono font-semibold uppercase">
                                    {user.nombre?.charAt(0) || 'U'}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[12px] text-text-primary font-sans">{user.nombre}</span>
                            <span className="text-[9px] font-mono text-amber-500/60 uppercase tracking-wider">{typeof user.rol === 'object' ? user.rol.nombre : user.rol}</span>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
