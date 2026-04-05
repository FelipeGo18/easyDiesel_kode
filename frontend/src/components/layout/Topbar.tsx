import { useState } from 'react';
import { useAuth } from '@/context/useAuth';
import { useAccess } from '@/hooks/useAccess';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
    User as UserIcon, 
    Settings, 
    LogOut, 
    Home, 
    Users,
    ChevronLeft
} from 'lucide-react';
import { protectedRoutes, navigationRoutes } from '@/features/routing/appRoutes';

const SIDEBAR_HIDDEN_ROLES = ['estacion', 'distribuidor', 'distribuidor_regulado', 'regulador', 'auditor', 'particular'];

export function Topbar() {
    const { user, logout } = useAuth();
    const { roleName, hasAnyPermission } = useAccess();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

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

    const stationName = user?.estacion?.nombre;
    const showInlineNav = SIDEBAR_HIDDEN_ROLES.includes(roleName ?? '');

    // Build inline nav items for roles without sidebar
    const rol = user?.rol;
    const userRoleName: string = typeof rol === 'string' ? rol : rol?.nombre ?? '';
    const inlineNavItems = showInlineNav
        ? navigationRoutes.filter((route) => {
            if (route.excludeRoles?.includes(userRoleName)) return false;
            return hasAnyPermission(...(route.requiredPermissions || []));
        })
        : [];

    // Resolve page title from the current route
    const currentRoute = protectedRoutes.find(r => r.path === location.pathname);
    const pageTitle = location.pathname === '/panel'
        ? (roleName === 'estacion'
            ? (stationName || 'Panel de estación')
            : roleName === 'admin'
                ? 'Panel administrativo'
                : 'Panel principal')
        : currentRoute?.label || 'Panel principal';

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="h-14 flex items-center justify-between px-3 sm:px-4 md:px-6 border-b border-border-subtle bg-bg-surface shrink-0">
            {/* Left — Page title + inline nav for sidebar-hidden roles */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                {showInlineNav && location.pathname !== '/panel' && (
                    <button
                        onClick={() => navigate('/panel')}
                        className="flex items-center justify-center w-8 h-8 rounded-lg bg-bg-elevated border border-border-subtle text-text-muted hover:text-text-primary hover:border-white/10 transition-all shrink-0"
                        title="Volver al panel"
                    >
                        <ChevronLeft size={16} />
                    </button>
                )}
                <h1 className="font-display text-base sm:text-xl md:text-2xl lg:text-[26px] xl:text-[28px] text-text-primary truncate">{pageTitle}</h1>
                {showInlineNav && (
                    <nav className="hidden md:flex items-center gap-1 ml-4">
                        {inlineNavItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                                    location.pathname === item.path
                                        ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                                        : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'
                                }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                )}
            </div>

            {/* Right */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-5">
                {/* System status — visible md+ */}
                <div className="hidden md:flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="status-live absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                    <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
                        En línea
                    </span>
                </div>

                {/* Separator — visible md+ */}
                <span className="hidden md:block w-px h-5 bg-border-subtle" />

                {/* Date/Time — time always, date sm+ */}
                <div className="flex flex-col items-end">
                    <span className="text-[11px] font-mono text-text-secondary tracking-wider">
                        {time}
                    </span>
                    <span className="hidden sm:block text-[9px] font-mono text-text-muted uppercase tracking-wider">
                        {formatted}
                    </span>
                </div>

                {/* Separator — visible sm+ */}
                <span className="hidden sm:block w-px h-5 bg-border-subtle" />

                {/* User avatar - clickable */}
                {user && (
                    <div className="relative">
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
                        >
                            <div className="w-8 h-8 rounded-brand bg-amber-dim border border-amber-500/20 flex items-center justify-center overflow-hidden relative shrink-0">
                                {user.fotoUrl && (
                                    <img
                                        src={user.fotoUrl}
                                        alt={user.nombre}
                                        referrerPolicy="no-referrer"
                                        className="w-full h-full rounded-brand object-cover absolute inset-0"
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                )}
                                <span className="text-amber-500 text-[12px] font-mono font-semibold uppercase">
                                    {user.nombre?.charAt(0) || 'U'}
                                </span>
                            </div>
                        </button>

                        {/* Dropdown Menu */}
                        {menuOpen && (
                            <>
                                {/* Backdrop to close menu */}
                                <div 
                                    className="fixed inset-0 z-40"
                                    onClick={() => setMenuOpen(false)}
                                />
                                <div className="absolute right-0 top-full mt-2 w-48 bg-bg-surface border border-border-subtle rounded-brand shadow-lg z-50 py-1">
                                    <div className="px-3 py-2 border-b border-border-subtle">
                                        <p className="text-[12px] text-text-primary font-sans truncate">{user.nombre}</p>
                                        <p className="text-[9px] font-mono text-amber-500/60 uppercase tracking-wider truncate">{typeof user.rol === 'object' ? user.rol.nombre : user.rol}</p>
                                    </div>
                                    <Link
                                        to="/"
                                        onClick={() => setMenuOpen(false)}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-text-secondary hover:bg-bg-elevated transition-colors text-left"
                                    >
                                        <Home size={14} />
                                        Ir al Inicio
                                    </Link>
                                    <Link
                                        to="/perfil"
                                        onClick={() => setMenuOpen(false)}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-text-secondary hover:bg-bg-elevated transition-colors text-left"
                                    >
                                        <UserIcon size={14} />
                                        Mi Perfil
                                    </Link>
                                    <Link
                                        to="/configuracion"
                                        onClick={() => setMenuOpen(false)}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-text-secondary hover:bg-bg-elevated transition-colors text-left"
                                    >
                                        <Settings size={14} />
                                        Configuración
                                    </Link>
                                    <div className="border-t border-border-subtle mt-1 pt-1">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-text-secondary hover:bg-bg-elevated transition-colors text-left"
                                        >
                                            <Users size={14} />
                                            Cambiar Cuenta
                                        </button>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-red-400 hover:bg-red-500/10 transition-colors text-left"
                                        >
                                            <LogOut size={14} />
                                            Cerrar Sesión
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
}
