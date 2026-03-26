import { useState, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/useAuth';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';

export const HomeNavbar = forwardRef<HTMLElement, {}>((_, ref) => {
    const navigate = useNavigate();
    const { isAuthenticated, user, logout } = useAuth();
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    return (
        <nav ref={ref} className="fixed top-0 left-0 right-0 z-50 border-b border-border-subtle bg-bg-base/80 backdrop-blur-md">
            <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <div className="w-8 h-8 shrink-0">
                        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                            <defs>
                                <radialGradient id="dg-nav" cx="38%" cy="28%" r="70%">
                                    <stop offset="0%" stopColor="#FFD580" />
                                    <stop offset="50%" stopColor="#F5A623" />
                                    <stop offset="100%" stopColor="#AA6A00" />
                                </radialGradient>
                                <radialGradient id="hbg-nav" cx="50%" cy="38%" r="62%">
                                    <stop offset="0%" stopColor="#1e1100" />
                                    <stop offset="100%" stopColor="#060400" />
                                </radialGradient>
                            </defs>
                            <path d="M50 5 L91 27.5 L91 72.5 L50 95 L9 72.5 L9 27.5 Z" fill="url(#hbg-nav)" />
                            <line x1="9" y1="44" x2="22" y2="44" stroke="#F5A623" strokeWidth="1.8" strokeLinecap="round" opacity="0.65" />
                            <line x1="9" y1="58" x2="22" y2="58" stroke="#F5A623" strokeWidth="1.8" strokeLinecap="round" opacity="0.65" />
                            <line x1="91" y1="44" x2="78" y2="44" stroke="#F5A623" strokeWidth="1.8" strokeLinecap="round" opacity="0.65" />
                            <line x1="91" y1="58" x2="78" y2="58" stroke="#F5A623" strokeWidth="1.8" strokeLinecap="round" opacity="0.65" />
                            <path d="M50 5 L91 27.5 L91 72.5 L50 95 L9 72.5 L9 27.5 Z" stroke="#F5A623" strokeWidth="2.2" fill="none" strokeLinejoin="miter" />
                            <path d="M50 21 C50 21 34 43 34 57 C34 67.5 41.3 76 50 76 C58.7 76 66 67.5 66 57 C66 43 50 21 50 21 Z" fill="url(#dg-nav)" />
                            <path d="M44 38 C42.5 44 42 50 43 56" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.28" />
                        </svg>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-text-secondary text-[12px] font-sans leading-none tracking-wide">easy</span>
                        <span className="text-amber-500 font-display text-[16px] leading-none tracking-[0.08em]">DIESEL</span>
                    </div>
                </div>

                {/* Nav links */}
                <div className="hidden md:flex items-center gap-6">
                    <button
                        onClick={() => navigate('/ruta-economica')}
                        className="text-[13px] text-amber-500 hover:text-amber-400 interactive font-sans font-medium cursor-pointer"
                    >
                        Ruta informativa
                    </button>
                    <a
                        href="#precios"
                        className="text-[13px] text-text-secondary hover:text-text-primary interactive font-sans"
                    >
                        Precios
                    </a>
                    <a
                        href="#estaciones"
                        className="text-[13px] text-text-secondary hover:text-text-primary interactive font-sans"
                    >
                        Estaciones
                    </a>
                    <a
                        href="#noticias"
                        className="text-[13px] text-text-secondary hover:text-text-primary interactive font-sans"
                    >
                        Noticias
                    </a>
                </div>

                {/* Auth actions */}
                <div className="flex items-center gap-3">
                    {isAuthenticated ? (
                        <div className="relative">
                            <button
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="flex items-center gap-2 p-1.5 rounded-full hover:bg-bg-elevated transition-colors border border-transparent hover:border-border-subtle group"
                            >
                                {user?.fotoUrl ? (
                                    <img
                                        src={user.fotoUrl}
                                        alt={user.nombre}
                                        referrerPolicy="no-referrer"
                                        className="w-8 h-8 rounded-full border border-border-default object-cover"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            (e.currentTarget.nextElementSibling as HTMLElement | null)?.style.setProperty('display', 'flex');
                                        }}
                                    />
                                ) : null}
                                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20" style={{ display: user?.fotoUrl ? 'none' : 'flex' }}>
                                    <Icon name="user" size={16} strokeWidth={1.5} />
                                </div>
                                <Icon name="chevron-down" size={14} className={`text-text-muted transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
                            </button>

                            {showProfileMenu && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
                                    <div className="absolute right-0 mt-2 w-56 bg-bg-base border border-border-subtle rounded-brand shadow-xl z-20 overflow-hidden animate-enter">
                                        <div className="px-4 py-3 border-b border-border-subtle bg-bg-elevated/30">
                                            <p className="text-[13px] font-medium text-text-primary truncate">{user?.nombre}</p>
                                            <p className="text-[11px] text-text-muted truncate">{user?.email}</p>
                                            <div className="mt-1">
                                                <Badge variant="amber" className="text-[9px] uppercase tracking-wider">
                                                    {typeof user?.rol === 'object' ? user.rol.nombre : user?.rol}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="p-1">
                                            {(() => {
                                                return (
                                                    <>
                                                        <button
                                                            onClick={() => { navigate('/panel'); setShowProfileMenu(false); }}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded-sm transition-colors"
                                                        >
                                                            <Icon name="dashboard" size={14} />
                                                            Mi panel
                                                        </button>
                                                        <button
                                                            onClick={() => { logout(); setShowProfileMenu(false); }}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-red-500 hover:bg-red-500/5 rounded-sm transition-colors"
                                                        >
                                                            <Icon name="logout" size={14} />
                                                            Cerrar sesión
                                                        </button>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                            <Icon name="login" size={14} />
                            Iniciar sesión
                        </Button>
                    )}
                </div>
            </div>
        </nav>
    );
});

HomeNavbar.displayName = 'HomeNavbar';
