import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import {
    Users,
    Fuel,
    MapPin,
    FileText,
    BarChart2,
    Shield,
    LayoutDashboard,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Home,
} from 'lucide-react';

interface NavItem {
    label: string;
    path: string;
    icon: typeof Home;
    moduleId: string;
}

const navItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, moduleId: 'M8' },
    { label: 'Zonas', path: '/zonas', icon: MapPin, moduleId: 'M4' },
    { label: 'Precios', path: '/precios', icon: Fuel, moduleId: 'M4' },
    { label: 'Normativa', path: '/normativa', icon: FileText, moduleId: 'M5' },
    { label: 'Usuarios', path: '/usuarios', icon: Users, moduleId: 'M2' },
    { label: 'Estación', path: '/estacion', icon: Fuel, moduleId: 'M3' },
    { label: 'Reportes', path: '/reportes', icon: BarChart2, moduleId: 'M6' },
    { label: 'Auditoría', path: '/auditoria', icon: Shield, moduleId: 'M7' },
];

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const { user, logout } = useAuth();
    const location = useLocation();

    return (
        <aside
            className={cn(
                'h-screen flex flex-col',
                'bg-bg-surface border-r border-border-subtle',
                'transition-all duration-200 ease-out',
                collapsed ? 'w-[68px]' : 'w-[240px]'
            )}
        >
            {/* ── Logo ── */}
            <div className="flex items-center h-16 px-4 border-b border-border-subtle shrink-0">
                {/* Isotipo inline SVG */}
                <div className="w-8 h-8 shrink-0">
                    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                        <defs>
                            <radialGradient id="dg-side" cx="38%" cy="28%" r="70%">
                                <stop offset="0%" stopColor="#FFD580" />
                                <stop offset="50%" stopColor="#F5A623" />
                                <stop offset="100%" stopColor="#AA6A00" />
                            </radialGradient>
                            <radialGradient id="hbg-side" cx="50%" cy="38%" r="62%">
                                <stop offset="0%" stopColor="#1e1100" />
                                <stop offset="100%" stopColor="#060400" />
                            </radialGradient>
                        </defs>
                        <path d="M50 5 L91 27.5 L91 72.5 L50 95 L9 72.5 L9 27.5 Z" fill="url(#hbg-side)" />
                        <line x1="9" y1="44" x2="22" y2="44" stroke="#F5A623" strokeWidth="1.8" strokeLinecap="round" opacity="0.65" />
                        <line x1="9" y1="58" x2="22" y2="58" stroke="#F5A623" strokeWidth="1.8" strokeLinecap="round" opacity="0.65" />
                        <line x1="91" y1="44" x2="78" y2="44" stroke="#F5A623" strokeWidth="1.8" strokeLinecap="round" opacity="0.65" />
                        <line x1="91" y1="58" x2="78" y2="58" stroke="#F5A623" strokeWidth="1.8" strokeLinecap="round" opacity="0.65" />
                        <path d="M50 5 L91 27.5 L91 72.5 L50 95 L9 72.5 L9 27.5 Z" stroke="#F5A623" strokeWidth="2.2" fill="none" strokeLinejoin="miter" />
                        <path d="M50 21 C50 21 34 43 34 57 C34 67.5 41.3 76 50 76 C58.7 76 66 67.5 66 57 C66 43 50 21 50 21 Z" fill="url(#dg-side)" />
                        <path d="M44 38 C42.5 44 42 50 43 56" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.28" />
                    </svg>
                </div>

                {!collapsed && (
                    <div className="ml-3 flex flex-col overflow-hidden">
                        <span className="text-text-secondary text-[13px] font-sans font-normal leading-none tracking-wide">
                            easy
                        </span>
                        <span className="text-amber-500 font-display text-[18px] leading-none tracking-[0.08em]">
                            DIESEL
                        </span>
                    </div>
                )}
            </div>

            {/* ── Navigation ── */}
            <nav className="flex-1 overflow-y-auto py-3 px-2">
                <div className="space-y-0.5">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path ||
                            (item.path !== '/' && location.pathname.startsWith(item.path));

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    'relative flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-brand)]',
                                    'interactive group',
                                    isActive
                                        ? 'bg-bg-hover text-text-primary'
                                        : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                                )}
                            >
                                {/* Active indicator */}
                                {isActive && (
                                    <span className="absolute left-0 top-1/4 bottom-1/4 w-[2px] bg-amber-500 rounded-r-sm" />
                                )}

                                <Icon
                                    size={16}
                                    strokeWidth={1.5}
                                    className={cn(
                                        'shrink-0',
                                        isActive ? 'text-amber-500' : 'text-text-muted group-hover:text-text-secondary'
                                    )}
                                />

                                {!collapsed && (
                                    <>
                                        <span className="text-[13px] font-sans font-normal truncate">
                                            {item.label}
                                        </span>
                                        <span
                                            className={cn(
                                                'ml-auto text-[9px] font-mono tracking-wider',
                                                isActive ? 'text-amber-500/60' : 'text-text-muted'
                                            )}
                                        >
                                            {item.moduleId}
                                        </span>
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                </div>

                {/* Link to public home */}
                <div className="mt-3 pt-3 border-t border-border-subtle">
                    <NavLink
                        to="/"
                        className={cn(
                            'flex items-center gap-2.5 px-3 py-2.5 rounded-brand',
                            'text-text-muted hover:text-text-primary hover:bg-bg-elevated interactive',
                            collapsed && 'justify-center px-0'
                        )}
                    >
                        <Home size={16} strokeWidth={1.5} className="shrink-0" />
                        {!collapsed && (
                            <span className="text-[13px] font-sans font-normal truncate">
                                Página principal
                            </span>
                        )}
                    </NavLink>
                </div>
            </nav>

            {/* ── User / Footer ── */}
            <div className="border-t border-border-subtle p-3 shrink-0 space-y-2">
                {/* User info */}
                {user && !collapsed && (
                    <div className="flex items-center gap-2.5 px-2 py-1.5">
                        <div className="w-7 h-7 rounded-[var(--radius-brand)] bg-amber-dim border border-amber-500/20 flex items-center justify-center shrink-0">
                            <span className="text-amber-500 text-[10px] font-mono font-semibold uppercase">
                                {user.nombre?.charAt(0) || 'U'}
                            </span>
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-[12px] text-text-primary truncate">{user.nombre}</span>
                            <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">{typeof user.rol === 'object' ? user.rol.nombre : user.rol}</span>
                        </div>
                    </div>
                )}

                {/* Logout */}
                <button
                    onClick={logout}
                    className={cn(
                        'flex items-center gap-3 w-full px-3 py-2 rounded-[var(--radius-brand)]',
                        'text-text-muted hover:text-red-500 hover:bg-red-dim interactive',
                        collapsed && 'justify-center'
                    )}
                >
                    <LogOut size={16} strokeWidth={1.5} />
                    {!collapsed && (
                        <span className="text-[12px] font-mono uppercase tracking-wider">Salir</span>
                    )}
                </button>
            </div>

            {/* ── Collapse toggle ── */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="flex items-center justify-center h-10 border-t border-border-subtle text-text-muted hover:text-text-secondary interactive"
            >
                {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
        </aside>
    );
}
