import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/useAuth';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { publicoService, type PublicPrecio, type PublicStation, type PublicZona } from '@/services/publico';
import { StationsMap } from '@/features/public-map/StationsMap';
import { calculateDistance, cn } from '@/lib/utils';
import { HeroSection } from '@/components/HeroSection';
import { Preloader } from '@/components/Preloader';
import { Marquee } from '@/components/Marquee';
import { FuelTube } from '@/components/FuelTube';
import { CursorGlow } from '@/components/CursorGlow';
import { useScrollReveal } from '@/hooks/useScrollReveal';

/* ── Mock data: tipos de combustibles ── */

const tiposCombustible = [
    { id: 'ACPM', label: 'ACPM (Diésel)' },
    { id: 'GASOLINA_CORRIENTE', label: 'Gasolina Corriente' },
];

const tiposServicio = [
    { id: 'PARTICULAR', label: 'Particular' },
    { id: 'PUBLICO', label: 'Público' },
    { id: 'OFICIAL', label: 'Oficial' },
    { id: 'DIPLOMATICO', label: 'Diplomático' },
];

// Se ha eliminado preciosMock para usar datos reales del servidor

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
];

type StationWithDistance = PublicStation & { distancia?: number };

function deriveZonesFromPrices(precios: PublicPrecio[]): PublicZona[] {
    const zonesById = new Map<string, PublicZona>();

    precios.forEach((precio) => {
        if (!precio.zonaId || zonesById.has(precio.zonaId)) {
            return;
        }

        zonesById.set(precio.zonaId, {
            id: precio.zonaId,
            nombre: precio.zona?.nombre ?? 'Zona regulada',
            tipoZona: precio.zona?.tipoZona ?? 'INTERCONECTADA',
            departamentos: [],
            municipios: [],
        });
    });

    return Array.from(zonesById.values());
}

function hasCoordinates(station: PublicStation): station is PublicStation & { latitud: number; longitud: number } {
    return typeof station.latitud === 'number' && typeof station.longitud === 'number';
}

export function HomePage() {
    const navigate = useNavigate();
    const { isAuthenticated, user, logout } = useAuth();
    const [zonas, setZonas] = useState<PublicZona[]>([]);
    const [zonaSeleccionada, setZonaSeleccionada] = useState('');
    const [combustibleSeleccionado, setCombustibleSeleccionado] = useState('ACPM');
    const [servicioSeleccionado, setServicioSeleccionado] = useState('PARTICULAR');
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [precios, setPrecios] = useState<PublicPrecio[]>([]);
    const [nearbyMapStations, setNearbyMapStations] = useState<PublicStation[]>([]);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [highlightedStationId, setHighlightedStationId] = useState<string | null>(null);
    const [loadingPublicData, setLoadingPublicData] = useState(true);
    const [publicDataError, setPublicDataError] = useState<string | null>(null);
    const [showAllStations, setShowAllStations] = useState(false);
    const [preloaderDone, setPreloaderDone] = useState(false);

    const handlePreloaderDone = useCallback(() => setPreloaderDone(true), []);

    /* ── Section refs for immersive scroll ── */
    const navRef      = useRef<HTMLElement>(null);
    const pricesRef   = useRef<HTMLElement>(null);
    const routeRef    = useRef<HTMLElement>(null);
    const stationsRef = useRef<HTMLElement>(null);
    const newsRef     = useRef<HTMLElement>(null);
    const ctaRef      = useRef<HTMLElement>(null);
    const footerRef   = useRef<HTMLElement>(null);

    useScrollReveal(
        { navbar: navRef, prices: pricesRef, route: routeRef, stations: stationsRef, news: newsRef, cta: ctaRef, footer: footerRef },
        preloaderDone,
    );

    useEffect(() => {
        // Obtener ubicación del usuario solo para centrar el mapa inicialmente
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation([position.coords.longitude, position.coords.latitude]);
                },
                (error) => console.error('Error obteniendo ubicación:', error)
            );
        }

        const fetchData = async () => {
            setLoadingPublicData(true);
            setPublicDataError(null);

            try {
                const [zonasResult, preciosResult] = await Promise.allSettled([
                    publicoService.getZonas(),
                    publicoService.getPrecios(),
                ]);

                const zonasData = zonasResult.status === 'fulfilled' ? zonasResult.value : [];
                const preciosData = preciosResult.status === 'fulfilled' ? preciosResult.value : [];
                const fallbackZones = zonasData.length > 0 ? zonasData : deriveZonesFromPrices(preciosData);

                setZonas(fallbackZones);
                setPrecios(preciosData);

                if (fallbackZones.length > 0) {
                    setZonaSeleccionada((current) => current || fallbackZones[0].id);
                }

                if (!fallbackZones.length || !preciosData.length) {
                    setPublicDataError('No se pudieron cargar completamente los datos públicos de precios.');
                }
            } catch (error) {
                console.error('Error cargando datos públicos:', error);
                setPublicDataError('No fue posible cargar zonas y precios en este momento.');
            } finally {
                setLoadingPublicData(false);
            }
        };

        fetchData();
    }, []);

    const estacionesFiltradas = useMemo(() => {
        return nearbyMapStations
            .map<StationWithDistance>((estacion) => {
                if (userLocation && hasCoordinates(estacion)) {
                    return {
                        ...estacion,
                        distancia: calculateDistance(userLocation[1], userLocation[0], estacion.latitud, estacion.longitud),
                    };
                }

                return { ...estacion };
            })
            .sort((a, b) => (a.distancia || 0) - (b.distancia || 0));
    }, [nearbyMapStations, userLocation]);

    const precioActual = precios.find(p => {
        return p.zonaId === zonaSeleccionada && p.tipoCombustible === combustibleSeleccionado && p.tipoServicio === servicioSeleccionado;
    });

    const formatCOP = (n: number) =>
        new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);

    const combustiblesDisponibles = [...new Set(estacionesFiltradas.flatMap((estacion) => estacion.combustibles))];


    // Auto-collapse the station list when a new nearby search completes
    useEffect(() => { setShowAllStations(false); }, [nearbyMapStations]);

    return (
        <div className="min-h-screen bg-bg-base">
            {/* ══════════════════════════════════════════
          PRELOADER CINEMATOGRÁFICO
      ══════════════════════════════════════════ */}
            {!preloaderDone && <Preloader onComplete={handlePreloaderDone} />}

            {/* Global immersive overlays */}
            <FuelTube />
            <CursorGlow />

            {/* ══════════════════════════════════════════
          HERO INTRO
      ══════════════════════════════════════════ */}
            <HeroSection />

            {/* ══════════════════════════════════════════
          MARQUEE INFINITO
      ══════════════════════════════════════════ */}
            <Marquee />

            {/* ══════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════ */}
            <nav ref={navRef} className="fixed top-0 left-0 right-0 z-50 border-b border-border-subtle bg-bg-base/80 backdrop-blur-md">
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
                                                    const rolNombre = typeof user?.rol === 'object' ? user.rol.nombre : user?.rol;
                                                    const isParticular = rolNombre === 'particular';

                                                    return (
                                                        <>
                                                            {!isParticular && (
                                                                <button
                                                                    onClick={() => { navigate('/dashboard'); setShowProfileMenu(false); }}
                                                                    className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded-sm transition-colors"
                                                                >
                                                                    <Icon name="dashboard" size={14} />
                                                                    Mi panel
                                                                </button>
                                                            )}
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

            {/* ══════════════════════════════════════════
                  PRICE LOOKUP — Horizontal scroll pinned
              ══════════════════════════════════════════ */}
            <section
                ref={pricesRef}
                id="precios"
                className="relative z-10 bg-bg-base scroll-section overflow-hidden"
            >
                {/* Step progress rail — top edge */}
                <div className="prices-step-rail pointer-events-none absolute top-0 left-0 right-0 z-20 h-px bg-border-subtle">
                    <div className="prices-step-fill h-full bg-amber-500/60" style={{ width: '25%' }} />
                </div>

                <div className="prices-hscroll flex">

                    {/* ══ Panel 1 — Configuración ══ */}
                    <div className="hscroll-panel shrink-0 w-screen min-h-screen flex flex-col justify-center relative overflow-hidden">
                        {/* Atmospheric background */}
                        <div className="pointer-events-none absolute inset-0">
                            <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-amber-500/3 blur-[120px]" />
                            <div className="absolute inset-0" style={{
                                backgroundImage: 'linear-gradient(rgba(245,166,35,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(245,166,35,0.03) 1px, transparent 1px)',
                                backgroundSize: '48px 48px',
                                mask: 'radial-gradient(ellipse 70% 80% at 30% 50%, black 30%, transparent 75%)',
                                WebkitMask: 'radial-gradient(ellipse 70% 80% at 30% 50%, black 30%, transparent 75%)',
                            }} />
                        </div>

                        <div className="relative z-10 max-w-6xl mx-auto w-full px-8 md:px-16 py-24 grid md:grid-cols-2 gap-16 items-center">
                            {/* Left: editorial copy */}
                            <div>
                                <span className="font-mono text-[10px] text-amber-500/60 tracking-[0.25em] uppercase block mb-6">01 / 04 — Configuración</span>
                                <h2 className="font-display text-[64px] md:text-[80px] leading-none text-text-primary mb-4 tracking-wide">
                                    PRECIOS<br />
                                    <span className="text-amber-500">REGULADOS</span>
                                </h2>
                                <p className="text-[14px] text-text-secondary font-sans leading-relaxed max-w-xs">
                                    Selecciona tu zona geográfica, el tipo de combustible y la categoría de tu vehículo para consultar el precio oficial vigente.
                                </p>
                                {publicDataError && (
                                    <div className="mt-6 flex items-start gap-3 rounded-brand border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                                        <Icon name="alert" size={14} className="text-amber-500 mt-0.5 shrink-0" />
                                        <p className="text-[12px] text-amber-300/80 font-sans leading-relaxed">{publicDataError}</p>
                                    </div>
                                )}
                            </div>

                            {/* Right: filter card */}
                            <div className="bg-bg-surface/60 backdrop-blur-sm border border-border-subtle rounded-[8px] p-6 space-y-6"
                                style={{ boxShadow: '0 0 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)' }}>

                                {/* Zona */}
                                <div>
                                    <label htmlFor="select-zona" className="font-mono text-[9px] text-text-muted uppercase tracking-[0.2em] block mb-2">
                                        Zona de distribución
                                    </label>
                                    <div className="relative">
                                        <select
                                            id="select-zona"
                                            value={zonaSeleccionada}
                                            onChange={(e) => setZonaSeleccionada(e.target.value)}
                                            disabled={!zonas.length}
                                            className="w-full px-4 py-3 bg-bg-elevated border border-border-default rounded-brand text-text-primary text-[13px] font-sans appearance-none cursor-pointer interactive pr-10 focus:border-amber-500/40 focus:outline-none transition-colors"
                                        >
                                            {!zonas.length ? <option value="">Sin zonas disponibles</option> : null}
                                            {zonas.map(z => <option key={z.id} value={z.id}>{z.nombre}</option>)}
                                        </select>
                                        <Icon name="chevron-down" size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                                    </div>
                                </div>

                                {/* Combustible */}
                                <div>
                                    <span className="font-mono text-[9px] text-text-muted uppercase tracking-[0.2em] block mb-2">Tipo de combustible</span>
                                    <div className="flex gap-2">
                                        {tiposCombustible.map(tc => (
                                            <button
                                                key={tc.id}
                                                onClick={() => setCombustibleSeleccionado(tc.id)}
                                                className={`flex-1 py-2.5 px-3 rounded-brand text-[11px] font-mono uppercase tracking-wider interactive border cursor-pointer transition-all duration-200 ${
                                                    combustibleSeleccionado === tc.id
                                                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-500'
                                                        : 'bg-bg-elevated border-border-subtle text-text-muted hover:border-border-strong hover:text-text-secondary'
                                                }`}
                                            >
                                                {tc.id === 'ACPM' ? 'ACPM' : 'Gasolina'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Servicio */}
                                <div>
                                    <span className="font-mono text-[9px] text-text-muted uppercase tracking-[0.2em] block mb-2">Categoría de vehículo</span>
                                    <div className="grid grid-cols-2 gap-2">
                                        {tiposServicio.map(ts => (
                                            <button
                                                key={ts.id}
                                                onClick={() => setServicioSeleccionado(ts.id)}
                                                className={`py-2.5 px-3 rounded-brand text-[10px] font-mono uppercase tracking-wider interactive border cursor-pointer text-center transition-all duration-200 ${
                                                    servicioSeleccionado === ts.id
                                                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-500'
                                                        : 'bg-bg-elevated border-border-subtle text-text-muted hover:border-border-strong hover:text-text-secondary'
                                                }`}
                                            >
                                                {ts.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Hint */}
                                <div className="flex items-center gap-2 pt-1 border-t border-border-subtle">
                                    <div className="w-1 h-1 rounded-full bg-amber-500/50" />
                                    <span className="text-[10px] font-mono text-text-muted">Haz scroll para ver el resultado →</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ══ Panel 2 — Gauge + Precio ══ */}
                    <div className="hscroll-panel shrink-0 w-screen min-h-screen flex flex-col justify-center relative overflow-hidden">
                        {/* Radial amber glow behind gauge */}
                        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
                            style={{ background: 'radial-gradient(circle, rgba(245,166,35,0.06) 0%, rgba(245,166,35,0.02) 40%, transparent 70%)' }} />

                        <div className="relative z-10 max-w-4xl mx-auto w-full px-8 md:px-16 py-24 flex flex-col items-center gap-8">
                            <span className="font-mono text-[10px] text-amber-500/60 tracking-[0.25em] uppercase">02 / 04 — Precio vigente</span>

                            {/* Context line */}
                            <div className="flex items-center gap-3">
                                <span className="text-[12px] text-text-secondary font-sans">
                                    {zonas.find(z => z.id === zonaSeleccionada)?.nombre ?? '—'}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-border-strong" />
                                <span className="text-[12px] text-text-secondary font-sans">
                                    {tiposCombustible.find(t => t.id === combustibleSeleccionado)?.label ?? '—'}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-border-strong" />
                                <Badge variant={Number(precioActual?.subsidioGalon) > 0 ? 'green' : 'amber'}>
                                    {Number(precioActual?.subsidioGalon) > 0 ? 'Con subsidio' : 'Sin subsidio'}
                                </Badge>
                            </div>

                            {/* SVG Gauge — large */}
                            <div className="relative w-80 h-44">
                                <svg viewBox="0 0 200 110" className="w-full h-full drop-shadow-[0_0_40px_rgba(245,166,35,0.1)]">
                                    <defs>
                                        <linearGradient id="gauge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#2ECC71" />
                                            <stop offset="50%" stopColor="#F5A623" />
                                            <stop offset="100%" stopColor="#E74C3C" />
                                        </linearGradient>
                                        <filter id="gauge-glow">
                                            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
                                            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                                        </filter>
                                    </defs>
                                    {/* Track */}
                                    <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#1a1a1a" strokeWidth="12" strokeLinecap="round" />
                                    {/* Ticks */}
                                    {[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180].map((angle, i) => {
                                        const rad = ((angle - 180) * Math.PI / 180);
                                        const r1 = 88, r2 = 80;
                                        const cx = 100, cy = 100;
                                        return (
                                            <line key={i}
                                                x1={cx + r1 * Math.cos(rad)} y1={cy + r1 * Math.sin(rad)}
                                                x2={cx + r2 * Math.cos(rad)} y2={cy + r2 * Math.sin(rad)}
                                                stroke="#2a2a2a" strokeWidth="1.5" strokeLinecap="round" />
                                        );
                                    })}
                                    {/* Active arc */}
                                    <path className="gauge-arc" d="M 20 100 A 80 80 0 0 1 180 100"
                                        fill="none" stroke="url(#gauge-grad)" strokeWidth="12" strokeLinecap="round"
                                        strokeDasharray="251.3" strokeDashoffset="251.3" filter="url(#gauge-glow)" />
                                    {/* Needle */}
                                    <line className="gauge-needle" x1="100" y1="100" x2="100" y2="26"
                                        stroke="#F5A623" strokeWidth="2" strokeLinecap="round"
                                        style={{ transformOrigin: '100px 100px', transform: 'rotate(-90deg)' }} />
                                    <circle cx="100" cy="100" r="5" fill="#F5A623" />
                                    <circle cx="100" cy="100" r="2.5" fill="#080808" />
                                    {/* Labels */}
                                    <text x="12" y="110" fill="#333" fontSize="7" fontFamily="JetBrains Mono,monospace">$0</text>
                                    <text x="158" y="110" fill="#333" fontSize="7" fontFamily="JetBrains Mono,monospace">MAX</text>
                                </svg>
                            </div>

                            {/* Price hero number */}
                            <div className="text-center -mt-2">
                                <span className="font-display text-[72px] md:text-[100px] lg:text-[120px] leading-none text-amber-500 tracking-wide"
                                    style={{ textShadow: '0 0 80px rgba(245,166,35,0.3)' }}>
                                    {loadingPublicData ? '···' : precioActual ? formatCOP(Number(precioActual.precioGalon)) : '—'}
                                </span>
                                <span className="block text-[12px] text-text-muted font-mono tracking-[0.15em] mt-3 uppercase">
                                    por galón · pesos colombianos
                                </span>
                            </div>

                            {/* Subsidy bar */}
                            {precioActual && Number(precioActual.subsidioGalon) > 0 && (
                                <div className="w-full max-w-sm">
                                    <div className="flex justify-between font-mono text-[9px] text-text-muted mb-1.5">
                                        <span>Subsidio aplicado</span>
                                        <span className="text-green-500">{formatCOP(Number(precioActual.subsidioGalon))} / gal</span>
                                    </div>
                                    <div className="h-[3px] w-full bg-bg-elevated rounded-full overflow-hidden">
                                        <div className="fuel-subsidy-bar h-full bg-gradient-to-r from-green-500/80 to-green-500/30 rounded-full" style={{ width: '0%' }} />
                                    </div>
                                </div>
                            )}
                            {!loadingPublicData && !precioActual && (
                                <p className="text-[12px] text-amber-300/70 font-mono">
                                    Sin precio vigente para esta combinación
                                </p>
                            )}
                        </div>
                    </div>

                    {/* ══ Panel 3 — Detalle decreto y subsidio ══ */}
                    <div className="hscroll-panel shrink-0 w-screen min-h-screen flex flex-col justify-center relative overflow-hidden">
                        <div className="pointer-events-none absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-green-500/3 blur-[100px]" />

                        <div className="relative z-10 max-w-4xl mx-auto w-full px-8 md:px-16 py-24">
                            <span className="font-mono text-[10px] text-amber-500/60 tracking-[0.25em] uppercase block mb-8">03 / 04 — Detalle regulatorio</span>

                            {precioActual ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border-subtle rounded-[8px] overflow-hidden border border-border-subtle"
                                    style={{ boxShadow: '0 0 80px rgba(0,0,0,0.5)' }}>

                                    {/* Subsidio — hero stat */}
                                    <div className="md:col-span-3 bg-bg-surface px-8 py-10 flex items-end justify-between gap-4"
                                        style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                                        <div>
                                            <span className="font-mono text-[9px] text-text-muted uppercase tracking-[0.2em] block mb-3">Subsidio por galón</span>
                                            <span className={`font-display text-[56px] md:text-[72px] leading-none ${Number(precioActual.subsidioGalon) > 0 ? 'text-green-500' : 'text-text-muted'}`}
                                                style={Number(precioActual.subsidioGalon) > 0 ? { textShadow: '0 0 40px rgba(46,204,113,0.25)' } : {}}>
                                                {Number(precioActual.subsidioGalon) > 0
                                                    ? formatCOP(Number(precioActual.subsidioGalon))
                                                    : 'NO APLICA'}
                                            </span>
                                        </div>
                                        {Number(precioActual.subsidioGalon) > 0 && (
                                            <div className="shrink-0 w-12 h-12 rounded-full border border-green-500/30 bg-green-500/10 flex items-center justify-center">
                                                <Icon name="trending-down" size={20} className="text-green-500" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Decreto */}
                                    <div className="bg-bg-surface px-6 py-7">
                                        <span className="font-mono text-[9px] text-text-muted uppercase tracking-[0.2em] block mb-2">Decreto</span>
                                        <span className="font-mono text-[22px] text-text-primary font-semibold block">{precioActual.decreto?.numero ?? 'N/A'}</span>
                                        <span className="font-mono text-[9px] text-text-muted mt-1 block">reg. vigente</span>
                                    </div>

                                    {/* Servicio */}
                                    <div className="bg-bg-surface px-6 py-7">
                                        <span className="font-mono text-[9px] text-text-muted uppercase tracking-[0.2em] block mb-2">Categoría</span>
                                        <span className="font-mono text-[22px] text-amber-500 font-semibold block leading-tight">
                                            {tiposServicio.find(t => t.id === servicioSeleccionado)?.label ?? '—'}
                                        </span>
                                        <span className="font-mono text-[9px] text-text-muted mt-1 block">tipo servicio</span>
                                    </div>

                                    {/* Zona */}
                                    <div className="bg-bg-surface px-6 py-7">
                                        <span className="font-mono text-[9px] text-text-muted uppercase tracking-[0.2em] block mb-2">Zona</span>
                                        <span className="font-sans text-[15px] text-text-primary font-medium block leading-tight">
                                            {zonas.find(z => z.id === zonaSeleccionada)?.nombre ?? '—'}
                                        </span>
                                        <span className="font-mono text-[9px] text-text-muted mt-1 block">distribución</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="border border-border-subtle rounded-[8px] bg-bg-surface px-8 py-16 text-center">
                                    <span className="font-mono text-[10px] text-text-muted uppercase tracking-[0.2em]">Configura los filtros en el panel anterior</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ══ Panel 4 — Comparativa ACPM vs Gasolina ══ */}
                    <div className="hscroll-panel shrink-0 w-screen min-h-screen flex flex-col justify-center relative overflow-hidden">
                        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-amber-500/3 blur-[120px]" />

                        <div className="relative z-10 max-w-5xl mx-auto w-full px-8 md:px-16 py-24">
                            <span className="font-mono text-[10px] text-amber-500/60 tracking-[0.25em] uppercase block mb-8">04 / 04 — Comparativa</span>

                            <div className="mb-6">
                                <h3 className="font-display text-[40px] md:text-[52px] text-text-primary leading-none">ACPM <span className="text-text-muted">vs</span> GASOLINA</h3>
                                <p className="text-[12px] text-text-muted font-sans mt-1">
                                    {zonas.find(z => z.id === zonaSeleccionada)?.nombre ?? '—'} · {tiposServicio.find(t => t.id === servicioSeleccionado)?.label ?? '—'}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {tiposCombustible.map((tc) => {
                                    const p = precios.find(pr => pr.zonaId === zonaSeleccionada && pr.tipoCombustible === tc.id && pr.tipoServicio === servicioSeleccionado);
                                    const isActive = tc.id === combustibleSeleccionado;
                                    const hasSubsidy = p && Number(p.subsidioGalon) > 0;
                                    return (
                                        <button
                                            key={tc.id}
                                            onClick={() => setCombustibleSeleccionado(tc.id)}
                                            className={`group relative text-left rounded-[8px] p-8 interactive cursor-pointer border transition-all duration-300 overflow-hidden ${
                                                isActive
                                                    ? 'border-amber-500/30 bg-bg-surface'
                                                    : 'border-border-subtle bg-bg-surface/50 hover:border-border-strong hover:bg-bg-surface'
                                            }`}
                                            style={isActive ? { boxShadow: '0 0 60px rgba(245,166,35,0.08), inset 0 1px 0 rgba(245,166,35,0.05)' } : {}}
                                        >
                                            {/* Active indicator dot */}
                                            {isActive && (
                                                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-amber-500"
                                                    style={{ boxShadow: '0 0 8px rgba(245,166,35,0.8)' }} />
                                            )}

                                            <span className="font-mono text-[9px] text-text-muted uppercase tracking-[0.2em] block mb-5">
                                                {tc.id === 'ACPM' ? 'ACPM · Diésel' : 'Gasolina Corriente'}
                                            </span>

                                            <span className={`font-display text-[52px] md:text-[64px] leading-none block transition-colors duration-300 ${
                                                isActive ? 'text-amber-500' : 'text-text-primary group-hover:text-text-primary'
                                            }`} style={isActive ? { textShadow: '0 0 40px rgba(245,166,35,0.25)' } : {}}>
                                                {p ? formatCOP(Number(p.precioGalon)) : '—'}
                                            </span>

                                            <span className="font-mono text-[9px] text-text-muted block mt-3">por galón</span>

                                            {hasSubsidy && (
                                                <div className="mt-4 flex items-center gap-2">
                                                    <Icon name="trending-down" size={11} className="text-green-500" />
                                                    <span className="font-mono text-[9px] text-green-500">
                                                        {formatCOP(Number(p!.subsidioGalon))} subsidio
                                                    </span>
                                                </div>
                                            )}

                                            {/* Bottom accent line for active */}
                                            <div className={`absolute bottom-0 left-0 h-px transition-all duration-500 ${
                                                isActive ? 'w-full bg-gradient-to-r from-amber-500/60 via-amber-500/30 to-transparent' : 'w-0'
                                            }`} />
                                        </button>
                                    );
                                })}
                            </div>

                            {/* CTA to full price table */}
                            <div className="mt-8 flex items-center gap-4">
                                <button
                                    onClick={() => navigate('/ruta-economica')}
                                    className="flex items-center gap-2 text-[11px] font-mono text-amber-500 hover:text-amber-400 transition-colors interactive cursor-pointer"
                                >
                                    Ver tabla completa por zona
                                    <Icon name="arrow-right" size={12} />
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

                    {/* ══════════════════════════════════════════
                  RUTA CON ESTACIONES — Redesigned feature
              ══════════════════════════════════════════ */}
                    <section ref={routeRef} className="relative z-10 overflow-hidden border-t border-border-subtle bg-bg-base py-16 px-6 scroll-section">
                        {/* Ambient glows */}
                        <div className="pointer-events-none absolute -top-40 right-1/3 h-80 w-80 rounded-full bg-amber-500/4 blur-3xl scroll-glow" />
                        <div className="pointer-events-none absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-amber-500/3 blur-2xl scroll-glow" />

                        <div className="relative max-w-6xl mx-auto">
                            {/* Section header */}
                            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
                                <div>
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <Icon name="navigation" size={18} className="text-amber-500" />
                                        <h2 className="text-h1 text-text-primary">Ruta con estaciones en el trayecto</h2>
                                        <Badge variant="amber" className="text-[8px] ml-1">NUEVO</Badge>
                                    </div>
                                    <p className="text-small text-text-secondary max-w-xl">
                                        Traza tu viaje entre dos puntos y descubre gasolineras distribuidas a lo largo del recorrido, con precios y tiempos de desvío.
                                    </p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => navigate('/ruta-economica')}>
                                    <Icon name="navigation" size={14} />
                                    Abrir mapa
                                </Button>
                            </div>

                            {/* Feature card */}
                            <div
                                onClick={() => navigate('/ruta-economica')}
                                className="group relative cursor-pointer overflow-hidden rounded-brand border border-amber-500/20 bg-bg-surface transition-all duration-300 hover:border-amber-500/40 hover:shadow-[0_0_40px_rgba(245,166,35,0.06)]"
                            >
                                {/* Top accent line */}
                                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

                                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr]">
                                    {/* ── Left: feature list ── */}
                                    <div className="flex flex-col p-7 border-b lg:border-b-0 lg:border-r border-border-subtle route-left">
                                        <div className="flex flex-col gap-5 flex-1">
                                            <div className="flex items-start gap-3.5">
                                                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-brand border border-amber-500/20 bg-amber-500/10">
                                                    <Icon name="map" size={15} className="text-amber-500" />
                                                </div>
                                                <div>
                                                    <p className="mb-0.5 text-[13px] font-semibold text-text-primary">Ruta origen → destino</p>
                                                    <p className="text-[12px] leading-relaxed text-text-secondary">Ingresa dos puntos en Colombia y calcula el trayecto en modo conducción con Mapbox Directions.</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3.5">
                                                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-brand border border-amber-500/20 bg-amber-500/10">
                                                    <Icon name="tank" size={15} className="text-amber-500" />
                                                </div>
                                                <div>
                                                    <p className="mb-0.5 text-[13px] font-semibold text-text-primary">Estaciones cada ~10 km</p>
                                                    <p className="text-[12px] leading-relaxed text-text-secondary">Detecta la gasolinera más cercana por cada tramo, con un desvío máximo de 3.5 km desde la ruta.</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3.5">
                                                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-brand border border-amber-500/20 bg-amber-500/10">
                                                    <Icon name="search" size={15} className="text-amber-500" />
                                                </div>
                                                <div>
                                                    <p className="mb-0.5 text-[13px] font-semibold text-text-primary">Precios y tiempo de desvío</p>
                                                    <p className="text-[12px] leading-relaxed text-text-secondary">Consulta el precio por galón según la zona regulada y el desvío real en minutos para cada parada.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); navigate('/ruta-economica'); }}
                                            className="mt-7 flex w-fit items-center gap-2 rounded-brand bg-amber-500 px-5 py-2.5 text-[13px] font-bold text-black transition-all hover:bg-amber-400 active:scale-95"
                                        >
                                            <Icon name="navigation" size={14} />
                                            Trazar mi ruta
                                            <Icon name="arrow-right" size={13} />
                                        </button>
                                    </div>

                                    {/* ── Right: visual route preview ── */}
                                    <div className="flex flex-col gap-5 p-7 route-right">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[9px] font-mono uppercase tracking-[0.14em] text-text-muted">Vista del recorrido</p>
                                            <span className="rounded border border-amber-500/20 bg-amber-500/6 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-amber-400">Interactivo</span>
                                        </div>

                                        {/* Route connector diagram */}
                                        <div className="flex items-stretch gap-3">
                                            <div className="flex flex-col items-center pt-3 relative">
                                                <div className="h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-emerald-500/25 ring-offset-1 ring-offset-bg-surface relative z-10" />
                                                {/* SVG stroke-draw line */}
                                                <svg className="my-1 flex-1 w-[2px] overflow-visible" preserveAspectRatio="none">
                                                    <line
                                                        className="route-stroke-draw"
                                                        x1="1" y1="0" x2="1" y2="100%"
                                                        stroke="url(#route-line-grad)"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                    />
                                                    <defs>
                                                        <linearGradient id="route-line-grad" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#2ECC71" stopOpacity="0.6" />
                                                            <stop offset="50%" stopColor="#F5A623" stopOpacity="0.4" />
                                                            <stop offset="100%" stopColor="#E74C3C" stopOpacity="0.6" />
                                                        </linearGradient>
                                                    </defs>
                                                </svg>
                                                <div className="h-3 w-3 rounded-full bg-red-500 ring-2 ring-red-500/25 ring-offset-1 ring-offset-bg-surface relative z-10" />
                                            </div>
                                            <div className="flex flex-1 flex-col gap-2.5">
                                                <div className="rounded-brand border border-border-subtle bg-bg-elevated px-3 py-2.5">
                                                    <p className="text-[9px] font-mono uppercase tracking-wider text-text-muted">Origen</p>
                                                    <p className="text-[13px] font-medium text-text-primary">Chapinero, Bogotá</p>
                                                </div>
                                                <div className="flex items-center gap-2.5 px-1 py-1">
                                                    {[10, 20, 30, 40].map((km) => (
                                                        <div key={km} className="flex flex-col items-center gap-1">
                                                            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 transition-colors group-hover:bg-amber-500/18 route-dot">
                                                                <Icon name="tank" size={10} className="text-amber-400" />
                                                            </div>
                                                            <span className="text-[8px] font-mono text-text-muted">{km} km</span>
                                                        </div>
                                                    ))}
                                                    <div className="flex items-end gap-0.5 pb-3">
                                                        <span className="h-1 w-1 rounded-full bg-text-muted/40" />
                                                        <span className="h-1 w-1 rounded-full bg-text-muted/30" />
                                                        <span className="h-1 w-1 rounded-full bg-text-muted/20" />
                                                    </div>
                                                </div>
                                                <div className="rounded-brand border border-border-subtle bg-bg-elevated px-3 py-2.5">
                                                    <p className="text-[9px] font-mono uppercase tracking-wider text-text-muted">Destino</p>
                                                    <p className="text-[13px] font-medium text-text-primary">Ubaté, Cundinamarca</p>
                                                </div>
                                            </div>
                                        </div>


                                    </div>
                                </div>

                                {/* Bottom accent */}
                                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
                            </div>
                        </div>
                    </section>

                    {/* ══════════════════════════════════════════
                  STATIONS
              ══════════════════════════════════════════ */}
                    <section
                        ref={stationsRef}
                        id="estaciones"
                        className="relative z-10 py-16 px-6 border-t border-border-subtle bg-bg-surface scroll-section"
                    >
                        <div className="max-w-6xl mx-auto">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Icon name="map" size={18} className="text-amber-500" />
                                        <h2 className="text-h1 text-text-primary">Estaciones cercanas</h2>
                                    </div>
                                    <p className="text-small text-text-secondary">
                                        Resultados cercanos a tu ubicación usando Google Maps Places
                                    </p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => navigate('/atlas-estaciones')}>
                                    <Icon name="navigation" size={14} />
                                    Ver en mapa
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4 mb-4">
                                <div id="stations-map">
                                    <StationsMap
                                        prices={precios}
                                        selectedFuel={combustibleSeleccionado}
                                        selectedService={servicioSeleccionado}
                                        onStationsFound={setNearbyMapStations}
                                        highlightedStationId={highlightedStationId}
                                    />
                                </div>

                                <div className="rounded-brand border border-border-subtle bg-bg-elevated p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-label text-text-muted">Resumen de cobertura</span>
                                        <Badge variant="amber">{estacionesFiltradas.length} estaciones</Badge>
                                    </div>
                                    <div className="space-y-2 text-[12px] text-text-secondary">
                                        <p>Zona seleccionada: <span className="text-text-primary">Búsqueda por proximidad</span></p>
                                        <p>Con coordenadas: <span className="text-text-primary">{estacionesFiltradas.filter(hasCoordinates).length}</span></p>
                                        <p>Combustibles: <span className="text-text-primary">{combustiblesDisponibles.join(' · ') || 'Sin datos'}</span></p>
                                    </div>
                                </div>
                            </div>

                            {/* ── List subheader ── */}
                            {estacionesFiltradas.length > 0 && (
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <span className="text-[11px] font-mono text-text-muted">
                                        {estacionesFiltradas.length} estación{estacionesFiltradas.length !== 1 ? 'es' : ''} ordenada{estacionesFiltradas.length !== 1 ? 's' : ''} por distancia
                                    </span>
                                    {userLocation && (
                                        <span className="flex items-center gap-1 text-[10px] font-mono text-text-muted">
                                            <Icon name="navigation" size={9} className="text-amber-500/70" />
                                            Cerca a tu ubicación
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* ── Station grid (collapsible + scrollable) ── */}
                            <div className="relative">
                                <div
                                    className={cn(
                                        "grid grid-cols-1 sm:grid-cols-2 gap-3",
                                        showAllStations && "max-h-[560px] overflow-y-auto pr-1 pb-4"
                                    )}
                                >
                                    {estacionesFiltradas.length > 0 ? (
                                        (showAllStations ? estacionesFiltradas : estacionesFiltradas.slice(0, 6)).map((est) => (
                                            <div
                                                key={est.id}
                                                onClick={() => setHighlightedStationId(est.id)}
                                                className={cn(
                                                    "bg-bg-elevated border rounded-brand p-4 interactive cursor-pointer transition-all scroll-child",
                                                    highlightedStationId === est.id
                                                        ? "border-amber-500/50 bg-amber-500/2 shadow-[0_8px_20px_rgba(245,166,35,0.08)]"
                                                        : "border-border-subtle hover:border-border-strong"
                                                )}
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <Icon name="tank" size={16} className="text-amber-500 shrink-0" />
                                                        <h3 className="text-[14px] font-sans font-medium text-text-primary">{est.nombre}</h3>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1">
                                                        <Badge variant="green">Activa</Badge>
                                                        {est.distancia !== undefined && (
                                                            <span className="text-[10px] font-mono text-amber-500 font-bold">
                                                                a {est.distancia.toFixed(1)} km
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="ml-6 space-y-1">
                                                    <p className="text-[12px] font-sans text-text-secondary flex items-center gap-1.5">
                                                        <Icon name="map" size={11} className="text-text-muted" />
                                                        {est.ciudad}, {est.departamento}
                                                    </p>
                                                    <p className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
                                                        {est.combustibles.join(' · ') || 'Sin tanques activos'}
                                                    </p>
                                                    <p className="text-[10px] text-text-muted font-sans">{est.direccion}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-full py-12 text-center bg-bg-elevated rounded-brand border border-dashed border-border-subtle">
                                            <Icon name="info" size={24} className="text-text-muted mx-auto mb-3" />
                                            <p className="text-text-secondary text-sm">
                                                No encontramos gasolineras cercanas con Google Maps para tu ubicación actual.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Bottom gradient fade — visible when collapsed with hidden items, or when scrollable */}
                                {estacionesFiltradas.length > 6 && (
                                    <div
                                        className={cn(
                                            "pointer-events-none absolute bottom-0 left-0 right-0 bg-gradient-to-t from-bg-surface to-transparent transition-all duration-300",
                                            showAllStations ? "h-10" : "h-20"
                                        )}
                                    />
                                )}
                            </div>

                            {/* ── Expand / collapse toggle ── */}
                            {estacionesFiltradas.length > 6 && (
                                <div className="mt-4 flex justify-center">
                                    <button
                                        type="button"
                                        onClick={() => setShowAllStations((prev) => !prev)}
                                        className="flex items-center gap-2 rounded border border-border-subtle bg-bg-elevated px-5 py-2 text-[12px] font-mono text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary cursor-pointer"
                                    >
                                        {showAllStations ? (
                                            <>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
                                                Mostrar menos
                                            </>
                                        ) : (
                                            <>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                                                Ver las {estacionesFiltradas.length - 6} restantes &middot; {estacionesFiltradas.length} en total
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* ══════════════════════════════════════════
                  NEWS / NOTICIAS
              ══════════════════════════════════════════ */}
                    <section
                        ref={newsRef}
                        id="noticias"
                        className="py-16 px-6 border-t border-border-subtle scroll-section"
                    >
                        <div className="max-w-6xl mx-auto">
                            <div className="flex items-center gap-2 mb-2">
                                <Icon name="newspaper" size={18} className="text-amber-500" />
                                <h2 className="text-h1 text-text-primary">Noticias de combustibles</h2>
                            </div>
                            <p className="text-small text-text-secondary mb-8">
                                Últimas actualizaciones sobre precios, decretos y regulaciones.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {noticiasMock.map((noticia) => (
                                    <article
                                        key={noticia.id}
                                        className="bg-bg-surface border border-border-subtle rounded-brand p-5 hover:border-border-strong interactive group cursor-pointer scroll-child"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <Badge variant="amber">{noticia.tag}</Badge>
                                            <span className="text-[9px] font-mono text-text-muted flex items-center gap-1">
                                                <Icon name="clock" size={9} />
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
                                            <Icon name="arrow-right" size={10} className="ml-1 transition-transform group-hover:translate-x-0.5" />
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
                        <section ref={ctaRef} className="py-12 px-6 border-t border-border-subtle bg-bg-surface scroll-section">
                            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                                <div>
                                    <h2 className="text-h2 text-text-primary mb-1">¿Operas una estación de servicio?</h2>
                                    <p className="text-[13px] text-text-secondary font-sans">
                                        Inicia sesión para acceder al panel de gestión, registro de despachos y reportes.
                                    </p>
                                </div>
                                <Button onClick={() => navigate('/login')}>
                                    Iniciar sesión
                                    <Icon name="arrow-right" size={14} />
                                </Button>
                            </div>
                        </section>
                    )}

                    {/* ══════════════════════════════════════════
                  FOOTER
              ══════════════════════════════════════════ */}
                    <footer ref={footerRef} className="py-12 px-6 border-t border-border-subtle scroll-section overflow-hidden">
                        <div className="max-w-6xl mx-auto flex flex-col items-center gap-6">
                            {/* Logo reconstruction */}
                            <div className="footer-logo" style={{ perspective: '600px' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10">
                                        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                                            <defs>
                                                <radialGradient id="ft-dg" cx="38%" cy="28%" r="70%">
                                                    <stop offset="0%" stopColor="#FFD580" />
                                                    <stop offset="50%" stopColor="#F5A623" />
                                                    <stop offset="100%" stopColor="#AA6A00" />
                                                </radialGradient>
                                            </defs>
                                            <path d="M50 5 L91 27.5 L91 72.5 L50 95 L9 72.5 L9 27.5 Z" stroke="#F5A623" strokeWidth="2" fill="none" />
                                            <path d="M50 21 C50 21 34 43 34 57 C34 67.5 41.3 76 50 76 C58.7 76 66 67.5 66 57 C66 43 50 21 50 21 Z" fill="url(#ft-dg)" />
                                        </svg>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-text-muted text-[12px] font-sans">easy</span>
                                        <span className="text-amber-500 font-display text-[20px] leading-none tracking-[0.08em]">DIESEL</span>
                                    </div>
                                </div>
                            </div>

                            {/* Credits — cinema style */}
                            <div className="footer-credits flex flex-col items-center gap-2 text-center">
                                <span className="text-[10px] font-mono text-text-muted tracking-[0.2em] uppercase">
                                    Precios regulados por el MinMinas
                                </span>
                                <span className="text-[10px] font-mono text-text-muted tracking-[0.15em] uppercase">
                                    Universidad Piloto de Colombia · 2026
                                </span>
                                <div className="mt-2 w-12 h-px bg-amber-500/20" />
                            </div>
                        </div>
                    </footer>
        </div>
    );
}
