import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
    Fuel,
    MapPin,
    ArrowRight,
    LogIn,
    LayoutDashboard,
    Search,
    TrendingUp,
    TrendingDown,
    Clock,
    Newspaper,
    User,
    LogOut,
    ChevronDown,
    Navigation,
} from 'lucide-react';

/* ── Mock data: precios vigentes ── */
const zonas = [
    { id: '1', nombre: 'Zona Centro' },
    { id: '2', nombre: 'Zona Norte' },
    { id: '3', nombre: 'Zona Sur' },
    { id: '4', nombre: 'Zona Occidente' },
];

const tiposCombustible = [
    { id: 'ACPM', label: 'ACPM (Diésel)' },
    { id: 'GASOLINA_CORRIENTE', label: 'Gasolina Corriente' },
    { id: 'GASOLINA_EXTRA', label: 'Gasolina Extra' },
];

const tiposServicio = [
    { id: 'PARTICULAR', label: 'Particular' },
    { id: 'PUBLICO', label: 'Público' },
    { id: 'OFICIAL', label: 'Oficial' },
    { id: 'DIPLOMATICO', label: 'Diplomático' },
];

/* ── Mock: tabla de precios por zona ── */
const preciosMock: Record<string, Record<string, { precio: number; subsidio: number; decreto: string }>> = {
    'ACPM': {
        'PARTICULAR': { precio: 9876, subsidio: 2350, decreto: 'Dec. 1428/2025' },
        'PUBLICO': { precio: 7526, subsidio: 4700, decreto: 'Dec. 1428/2025' },
        'OFICIAL': { precio: 9876, subsidio: 2350, decreto: 'Dec. 763/2024' },
        'DIPLOMATICO': { precio: 9876, subsidio: 0, decreto: 'Dec. 763/2024' },
    },
    'GASOLINA_CORRIENTE': {
        'PARTICULAR': { precio: 14538, subsidio: 0, decreto: 'Dec. 1428/2025' },
        'PUBLICO': { precio: 12188, subsidio: 2350, decreto: 'Dec. 1428/2025' },
        'OFICIAL': { precio: 14538, subsidio: 0, decreto: 'Dec. 763/2024' },
        'DIPLOMATICO': { precio: 14538, subsidio: 0, decreto: 'Dec. 763/2024' },
    },
    'GASOLINA_EXTRA': {
        'PARTICULAR': { precio: 17250, subsidio: 0, decreto: 'Dec. 1428/2025' },
        'PUBLICO': { precio: 17250, subsidio: 0, decreto: 'Dec. 1428/2025' },
        'OFICIAL': { precio: 17250, subsidio: 0, decreto: 'Dec. 763/2024' },
        'DIPLOMATICO': { precio: 17250, subsidio: 0, decreto: 'Dec. 763/2024' },
    },
};

/* ── Mock: estaciones cercanas ── */
const estacionesMock = [
    { nombre: 'EDS Terpel Autopista', ciudad: 'Bogotá', combustible: 'ACPM · Corriente · Extra', activa: true },
    { nombre: 'EDS Primax Centro', ciudad: 'Bogotá', combustible: 'ACPM · Corriente', activa: true },
    { nombre: 'EDS Biomax Norte', ciudad: 'Bogotá', combustible: 'Corriente · Extra', activa: true },
    { nombre: 'EDS Petrobras Suba', ciudad: 'Bogotá', combustible: 'ACPM · Corriente · Extra', activa: false },
];

/* ── Mock: noticias ── */
const noticiasMock = [
    {
        id: '1',
        titulo: 'Nuevo precio del ACPM vigente desde marzo 2026',
        resumen: 'El Ministerio de Minas y Energía anunció la actualización del precio del ACPM bajo el Decreto 1428 de 2025.',
        fecha: '03 Mar 2026',
        tag: 'Precios',
    },
    {
        id: '2',
        titulo: 'Subsidio al transporte público se mantiene este trimestre',
        resumen: 'Los vehículos de servicio público seguirán beneficiándose del subsidio diferencial en todas las zonas del país.',
        fecha: '28 Feb 2026',
        tag: 'Subsidios',
    },
    {
        id: '3',
        titulo: 'Gasolina Extra: sin cambios para el mes de marzo',
        resumen: 'El precio de la gasolina extra se mantiene estable según la resolución vigente del Ministerio.',
        fecha: '25 Feb 2026',
        tag: 'Precios',
    },
];

export function HomePage() {
    const navigate = useNavigate();
    const { isAuthenticated, user, logout } = useAuth();
    const [zonaSeleccionada, setZonaSeleccionada] = useState('1');
    const [combustibleSeleccionado, setCombustibleSeleccionado] = useState('ACPM');
    const [servicioSeleccionado, setServicioSeleccionado] = useState('PARTICULAR');
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const precioActual = preciosMock[combustibleSeleccionado]?.[servicioSeleccionado];

    const formatCOP = (n: number) =>
        new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);

    return (
        <div className="min-h-screen bg-bg-base">
            {/* ══════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════ */}
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border-subtle bg-bg-base/80 backdrop-blur-md">
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
                        <a href="#precios" className="text-[13px] text-text-secondary hover:text-text-primary interactive font-sans">Precios</a>
                        <a href="#estaciones" className="text-[13px] text-text-secondary hover:text-text-primary interactive font-sans">Estaciones</a>
                        <a href="#noticias" className="text-[13px] text-text-secondary hover:text-text-primary interactive font-sans">Noticias</a>
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
                                        <img src={user.fotoUrl} alt={user.nombre} className="w-8 h-8 rounded-full border border-border-default" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                                            <User size={16} strokeWidth={1.5} />
                                        </div>
                                    )}
                                    <ChevronDown size={14} className={`text-text-muted transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
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
                                                    const rolNombre = typeof user?.rol === 'object' ? user.rol.nombre : user?.rol;
                                                    const isParticular = rolNombre === 'particular';

                                                    return (
                                                        <>
                                                            {!isParticular && (
                                                                <button
                                                                    onClick={() => { navigate('/dashboard'); setShowProfileMenu(false); }}
                                                                    className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded-sm transition-colors"
                                                                >
                                                                    <LayoutDashboard size={14} strokeWidth={1.5} />
                                                                    Mi panel
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => { logout(); setShowProfileMenu(false); }}
                                                                className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-red-500 hover:bg-red-500/5 rounded-sm transition-colors"
                                                            >
                                                                <LogOut size={14} strokeWidth={1.5} />
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
                                <LogIn size={14} strokeWidth={1.5} />
                                Iniciar sesión
                            </Button>
                        )}
                    </div>
                </div>
            </nav>

            {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
            <section className="relative pt-28 pb-12 px-6 overflow-hidden">
                {/* Grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.02]"
                    style={{
                        backgroundImage: `
              linear-gradient(var(--color-amber-500) 1px, transparent 1px),
              linear-gradient(90deg, var(--color-amber-500) 1px, transparent 1px)
            `,
                        backgroundSize: '60px 60px',
                    }}
                />
                <div
                    className="absolute inset-0"
                    style={{ background: 'radial-gradient(ellipse at 30% 40%, rgba(245,166,35,0.04) 0%, transparent 60%)' }}
                />

                <div className="relative max-w-6xl mx-auto text-center animate-enter">
                    <h1 className="mb-4">
                        <span className="text-text-primary font-heading text-[28px] md:text-[36px] font-bold block tracking-tight">
                            Consulta el precio del combustible
                        </span>
                        <span className="text-text-secondary font-sans text-[16px] md:text-[18px] font-light block mt-2">
                            en tu zona, al instante y sin registro
                        </span>
                    </h1>
                    <p className="text-[14px] text-text-muted font-sans max-w-lg mx-auto mb-6">
                        Precios vigentes según decreto del Ministerio de Minas y Energía.
                        Encuentra estaciones cercanas y planifica tu ruta.
                    </p>

                    <a
                        href="#precios"
                        className="inline-flex items-center gap-2 text-amber-500 text-[12px] font-mono uppercase tracking-wider hover:text-amber-600 interactive"
                    >
                        Consultar ahora
                        <ChevronDown size={14} strokeWidth={1.5} className="animate-bounce" />
                    </a>
                </div>
            </section>

            {/* ══════════════════════════════════════════
          PRICE LOOKUP — Flujo ciudadano (4.3)
      ══════════════════════════════════════════ */}
            <section id="precios" className="py-16 px-6 border-t border-border-subtle">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center gap-2 mb-2">
                        <Search size={18} strokeWidth={1.5} className="text-amber-500" />
                        <h2 className="text-h1 text-text-primary">Consulta de precios</h2>
                    </div>
                    <p className="text-small text-text-secondary mb-8">
                        Selecciona tu zona, tipo de combustible y categoría de vehículo para ver el precio vigente.
                    </p>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* ── Filters panel ── */}
                        <div className="bg-bg-surface border border-border-subtle rounded-brand p-5 space-y-5">
                            <h3 className="text-label text-text-secondary mb-3">Filtros de consulta</h3>

                            {/* Zona */}
                            <div className="space-y-1.5">
                                <label htmlFor="select-zona" className="text-label text-text-muted">Zona de distribución</label>
                                <div className="relative">
                                    <select
                                        id="select-zona"
                                        value={zonaSeleccionada}
                                        onChange={(e) => setZonaSeleccionada(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-bg-elevated border border-border-default rounded-brand text-text-primary text-[13px] font-sans appearance-none cursor-pointer interactive pr-8"
                                    >
                                        {zonas.map(z => <option key={z.id} value={z.id}>{z.nombre}</option>)}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                                </div>
                            </div>

                            {/* Combustible */}
                            <div className="space-y-1.5">
                                <label className="text-label text-text-muted">Tipo de combustible</label>
                                <div className="space-y-1.5">
                                    {tiposCombustible.map(tc => (
                                        <button
                                            key={tc.id}
                                            onClick={() => setCombustibleSeleccionado(tc.id)}
                                            className={`w-full text-left px-3 py-2 rounded-brand text-[13px] font-sans interactive border cursor-pointer ${combustibleSeleccionado === tc.id
                                                ? 'bg-amber-dim border-amber-500/30 text-amber-500'
                                                : 'bg-bg-elevated border-border-subtle text-text-secondary hover:border-border-strong hover:text-text-primary'
                                                }`}
                                        >
                                            {tc.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tipo servicio */}
                            <div className="space-y-1.5">
                                <label className="text-label text-text-muted">Categoría de vehículo</label>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {tiposServicio.map(ts => (
                                        <button
                                            key={ts.id}
                                            onClick={() => setServicioSeleccionado(ts.id)}
                                            className={`px-2.5 py-2 rounded-brand text-[11px] font-mono uppercase tracking-wider interactive border cursor-pointer text-center ${servicioSeleccionado === ts.id
                                                ? 'bg-amber-dim border-amber-500/30 text-amber-500'
                                                : 'bg-bg-elevated border-border-subtle text-text-muted hover:border-border-strong hover:text-text-primary'
                                                }`}
                                        >
                                            {ts.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ── Price result ── */}
                        <div className="lg:col-span-2 space-y-4">
                            {/* Main price card */}
                            <div className="bg-bg-surface border border-border-subtle rounded-brand p-6 animate-enter">
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        <span className="text-label text-text-muted">Precio por galón</span>
                                        <p className="text-[12px] text-text-secondary mt-0.5 font-sans">
                                            {zonas.find(z => z.id === zonaSeleccionada)?.nombre} · {tiposCombustible.find(t => t.id === combustibleSeleccionado)?.label}
                                        </p>
                                    </div>
                                    <Badge variant={precioActual?.subsidio > 0 ? 'green' : 'amber'}>
                                        {precioActual?.subsidio > 0 ? 'Con subsidio' : 'Sin subsidio'}
                                    </Badge>
                                </div>

                                <div className="kpi-value mb-4">
                                    <span className="font-display text-[64px] md:text-[80px] leading-none text-amber-500 tracking-wide">
                                        {precioActual ? formatCOP(precioActual.precio) : '—'}
                                    </span>
                                    <span className="block text-[13px] text-text-muted font-sans mt-2">por galón · COP</span>
                                </div>

                                {/* Details grid */}
                                {precioActual && (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-border-subtle">
                                        <div className="bg-bg-elevated rounded-brand p-3">
                                            <span className="text-label text-text-muted block mb-1">Subsidio</span>
                                            <span className="font-mono text-[14px] text-green-500 font-semibold">
                                                {precioActual.subsidio > 0 ? formatCOP(precioActual.subsidio) : 'No aplica'}
                                            </span>
                                            <span className="block text-[9px] font-mono text-text-muted mt-0.5">/galón</span>
                                        </div>
                                        <div className="bg-bg-elevated rounded-brand p-3">
                                            <span className="text-label text-text-muted block mb-1">Decreto</span>
                                            <span className="font-mono text-[13px] text-text-primary">{precioActual.decreto}</span>
                                            <span className="block text-[9px] font-mono text-text-muted mt-0.5">vigente</span>
                                        </div>
                                        <div className="bg-bg-elevated rounded-brand p-3">
                                            <span className="text-label text-text-muted block mb-1">Servicio</span>
                                            <span className="font-mono text-[13px] text-text-primary">
                                                {tiposServicio.find(t => t.id === servicioSeleccionado)?.label}
                                            </span>
                                            <span className="block text-[9px] font-mono text-text-muted mt-0.5">categoría</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Price comparison row */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {tiposCombustible.map((tc, i) => {
                                    const p = preciosMock[tc.id]?.[servicioSeleccionado];
                                    const isActive = tc.id === combustibleSeleccionado;
                                    return (
                                        <button
                                            key={tc.id}
                                            onClick={() => setCombustibleSeleccionado(tc.id)}
                                            className={`text-left bg-bg-surface border rounded-brand p-4 interactive animate-enter cursor-pointer ${isActive ? 'border-amber-500/40' : 'border-border-subtle hover:border-border-strong'
                                                }`}
                                            style={{ animationDelay: `${i * 60}ms` }}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[11px] font-mono text-text-muted uppercase tracking-wider">
                                                    {tc.id === 'ACPM' ? 'ACPM' : tc.id === 'GASOLINA_CORRIENTE' ? 'Corriente' : 'Extra'}
                                                </span>
                                                {p && p.subsidio > 0 ? (
                                                    <TrendingDown size={12} className="text-green-500" />
                                                ) : (
                                                    <TrendingUp size={12} className="text-text-muted" />
                                                )}
                                            </div>
                                            <span className={`font-display text-[28px] leading-none ${isActive ? 'text-amber-500' : 'text-text-primary'}`}>
                                                {p ? formatCOP(p.precio) : '—'}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════
          STATIONS
      ══════════════════════════════════════════ */}
            <section id="estaciones" className="py-16 px-6 border-t border-border-subtle bg-bg-surface">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <MapPin size={18} strokeWidth={1.5} className="text-amber-500" />
                                <h2 className="text-h1 text-text-primary">Estaciones cercanas</h2>
                            </div>
                            <p className="text-small text-text-secondary">
                                Estaciones de servicio activas en {zonas.find(z => z.id === zonaSeleccionada)?.nombre}
                            </p>
                        </div>
                        <Button variant="ghost" size="sm">
                            <Navigation size={14} strokeWidth={1.5} />
                            Ver en mapa
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {estacionesMock.map((est, i) => (
                            <div
                                key={est.nombre}
                                className="bg-bg-elevated border border-border-subtle rounded-brand p-4 hover:border-border-strong interactive animate-enter"
                                style={{ animationDelay: `${i * 60}ms` }}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Fuel size={16} strokeWidth={1.5} className="text-amber-500 shrink-0" />
                                        <h3 className="text-[14px] font-sans font-medium text-text-primary">{est.nombre}</h3>
                                    </div>
                                    <Badge variant={est.activa ? 'green' : 'red'}>
                                        {est.activa ? 'Activa' : 'Cerrada'}
                                    </Badge>
                                </div>
                                <div className="ml-6 space-y-1">
                                    <p className="text-[12px] font-sans text-text-secondary flex items-center gap-1.5">
                                        <MapPin size={11} strokeWidth={1.5} className="text-text-muted" />
                                        {est.ciudad}
                                    </p>
                                    <p className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
                                        {est.combustible}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════
          NEWS / NOTICIAS
      ══════════════════════════════════════════ */}
            <section id="noticias" className="py-16 px-6 border-t border-border-subtle">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center gap-2 mb-2">
                        <Newspaper size={18} strokeWidth={1.5} className="text-amber-500" />
                        <h2 className="text-h1 text-text-primary">Noticias de combustibles</h2>
                    </div>
                    <p className="text-small text-text-secondary mb-8">
                        Últimas actualizaciones sobre precios, decretos y regulaciones.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {noticiasMock.map((noticia, i) => (
                            <article
                                key={noticia.id}
                                className="bg-bg-surface border border-border-subtle rounded-brand p-5 hover:border-border-strong interactive group animate-enter cursor-pointer"
                                style={{ animationDelay: `${i * 80}ms` }}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <Badge variant="amber">{noticia.tag}</Badge>
                                    <span className="text-[9px] font-mono text-text-muted flex items-center gap-1">
                                        <Clock size={9} strokeWidth={1.5} />
                                        {noticia.fecha}
                                    </span>
                                </div>
                                <h3 className="font-heading font-bold text-[15px] text-text-primary mb-2 leading-snug tracking-tight group-hover:text-amber-500 transition-colors">
                                    {noticia.titulo}
                                </h3>
                                <p className="text-[12px] text-text-secondary leading-relaxed">
                                    {noticia.resumen}
                                </p>
                                <div className="flex items-center mt-4 text-[10px] font-mono text-text-muted group-hover:text-amber-500 transition-colors uppercase tracking-wider">
                                    Leer más
                                    <ArrowRight size={10} className="ml-1 transition-transform group-hover:translate-x-0.5" />
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════
          CTA BANNER — Para operadores
      ══════════════════════════════════════════ */}
            {!isAuthenticated && (
                <section className="py-12 px-6 border-t border-border-subtle bg-bg-surface">
                    <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <h2 className="text-h2 text-text-primary mb-1">¿Operas una estación de servicio?</h2>
                            <p className="text-[13px] text-text-secondary font-sans">
                                Inicia sesión para acceder al panel de gestión, registro de despachos y reportes.
                            </p>
                        </div>
                        <Button onClick={() => navigate('/login')}>
                            Iniciar sesión
                            <ArrowRight size={14} strokeWidth={1.5} />
                        </Button>
                    </div>
                </section>
            )}

            {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
            <footer className="py-8 px-6 border-t border-border-subtle">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                        <Fuel size={16} strokeWidth={1.5} className="text-amber-500 opacity-50" />
                        <span className="text-[11px] font-mono text-text-muted tracking-wider uppercase">
                            easyDiesel
                        </span>
                    </div>
                    <div className="flex items-center gap-6 text-[10px] font-mono text-text-muted uppercase tracking-wider">
                        <span>Precios regulados por el MinMinas</span>
                        <span className="hidden md:inline">·</span>
                        <span>Universidad Piloto de Colombia · 2026</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
