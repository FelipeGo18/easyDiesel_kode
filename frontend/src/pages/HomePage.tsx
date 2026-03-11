import { useState, useEffect, useMemo, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/useAuth';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { publicoService, type PublicPrecio, type PublicStation, type PublicZona } from '@/services/publico';
import { StationsMap } from '@/features/public-map/StationsMap';
import { HeroSection } from '@/components/HeroSection';
import { calculateDistance, cn } from '@/lib/utils';

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
    const [introCompleted, setIntroCompleted] = useState(false);
    const [returnToHero, setReturnToHero] = useState(false);
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
    const blockedLinkClassName = 'pointer-events-none opacity-35';

    useLayoutEffect(() => {
        if (!introCompleted) {
            return;
        }

        // Wait for React to naturally commit the DOM removal of HeroSection,
        // and let GSAP's pin-spacer height calculation collapse so the page goes back to a normal size.
        // We use a small setTimeout chained with requestAnimationFrame to ensure we 
        // win the scroll race condition against the browser's native scroll-restoration.
        const resetScroll = () => {
            requestAnimationFrame(() => {
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            });
        };

        setTimeout(resetScroll, 50);

        // ── Scroll up detection to return to Hero ──
        const handleWheel = (e: WheelEvent) => {
            if (window.scrollY <= 0 && e.deltaY < 0) {
                setReturnToHero(true);
                setIntroCompleted(false);
            }
        };

        let touchStartY = 0;
        const handleTouchStart = (e: TouchEvent) => {
            touchStartY = e.touches[0].clientY;
        };

        const handleTouchMove = (e: TouchEvent) => {
            const touchEndY = e.touches[0].clientY;
            // If pulling down (touchEndY > touchStartY) at the top of the page
            if (window.scrollY <= 0 && touchEndY > touchStartY + 30) {
                setReturnToHero(true);
                setIntroCompleted(false);
            }
        };

        // Delay attaching the listener slightly so we don't catch the artificial `resetScroll`
        const timeoutId = setTimeout(() => {
            window.addEventListener('wheel', handleWheel, { passive: true });
            window.addEventListener('touchstart', handleTouchStart, { passive: true });
            window.addEventListener('touchmove', handleTouchMove, { passive: true });
        }, 150);

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('wheel', handleWheel);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
        };
    }, [introCompleted]);

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
                        <button
                            onClick={() => navigate('/ruta-economica')}
                            className="text-[13px] text-amber-500 hover:text-amber-400 interactive font-sans font-medium cursor-pointer"
                        >
                            Ruta informativa
                        </button>
                        <a
                            href={introCompleted ? '#precios' : undefined}
                            aria-disabled={!introCompleted}
                            className={cn('text-[13px] text-text-secondary hover:text-text-primary interactive font-sans', !introCompleted && blockedLinkClassName)}
                        >
                            Precios
                        </a>
                        <a
                            href={introCompleted ? '#estaciones' : undefined}
                            aria-disabled={!introCompleted}
                            className={cn('text-[13px] text-text-secondary hover:text-text-primary interactive font-sans', !introCompleted && blockedLinkClassName)}
                        >
                            Estaciones
                        </a>
                        <a
                            href={introCompleted ? '#noticias' : undefined}
                            aria-disabled={!introCompleted}
                            className={cn('text-[13px] text-text-secondary hover:text-text-primary interactive font-sans', !introCompleted && blockedLinkClassName)}
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
                                        <img src={user.fotoUrl} alt={user.nombre} className="w-8 h-8 rounded-full border border-border-default" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                                            <Icon name="user" size={16} strokeWidth={1.5} />
                                        </div>
                                    )}
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
          HERO — GSAP + ScrollTrigger + Lenis
      ══════════════════════════════════════════ */}
            {!introCompleted ? (
                <HeroSection
                    startAtEnd={returnToHero}
                    onIntroStateChange={(completed) => {
                        if (completed) {
                            setReturnToHero(false);
                        }
                        setIntroCompleted(completed);
                    }}
                />
            ) : null}

            {introCompleted ? (
                <>
                    {/* ══════════════════════════════════════════
                  ECONOMIC ROUTE CTA
              ══════════════════════════════════════════ */}
                    <section className="relative z-10 py-12 px-6 bg-bg-base animate-enter">
                        <div className="max-w-6xl mx-auto">
                            <div
                                onClick={() => navigate('/ruta-economica')}
                                className="group relative overflow-hidden rounded-brand border border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-bg-surface to-amber-500/5 p-6 cursor-pointer hover:border-amber-500/40 transition-all duration-300"
                            >
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-brand bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 group-hover:bg-amber-500/15 transition-colors">
                                            <Icon name="navigation" size={20} className="text-amber-500" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h2 className="text-[18px] font-heading font-bold text-text-primary tracking-tight">
                                                    Ruta con estaciones en el trayecto
                                                </h2>
                                                <Badge variant="amber" className="text-[8px]">NUEVO</Badge>
                                            </div>
                                            <p className="text-[13px] text-text-secondary font-sans max-w-lg">
                                                Traza un recorrido entre origen y destino y visualiza estaciones cercanas distribuidas a lo largo del camino.
                                                Es una vista informativa para ubicar referencias útiles durante el viaje.
                                            </p>
                                        </div>
                                    </div>
                                    <Button className="shrink-0 group-hover:translate-x-0.5 transition-transform">
                                        Ver ruta
                                        <Icon name="arrow-right" size={14} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ══════════════════════════════════════════
                  PRICE LOOKUP — Flujo ciudadano (4.3)
              ══════════════════════════════════════════ */}
                    <section
                        id="precios"
                        className="relative z-10 py-16 px-6 border-t border-border-subtle bg-bg-base animate-enter"
                    >
                        <div className="max-w-6xl mx-auto">
                            <div className="flex items-center gap-2 mb-2">
                                <Icon name="search" size={18} className="text-amber-500" />
                                <h2 className="text-h1 text-text-primary">Consulta de precios</h2>
                            </div>
                            <p className="text-small text-text-secondary mb-8">
                                Selecciona tu zona, tipo de combustible y categoría de vehículo para ver el precio vigente.
                            </p>

                            {publicDataError ? (
                                <div className="mb-6 rounded-brand border border-amber-500/30 bg-amber-500/8 px-4 py-3 text-sm text-amber-300">
                                    {publicDataError}
                                </div>
                            ) : null}

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="bg-bg-surface border border-border-subtle rounded-brand p-5 space-y-5">
                                    <h3 className="text-label text-text-secondary mb-3">Filtros de consulta</h3>

                                    <div className="space-y-1.5">
                                        <label htmlFor="select-zona" className="text-label text-text-muted">Zona de distribución</label>
                                        <div className="relative">
                                            <select
                                                id="select-zona"
                                                value={zonaSeleccionada}
                                                onChange={(e) => setZonaSeleccionada(e.target.value)}
                                                disabled={!zonas.length}
                                                className="w-full px-3 py-2.5 bg-bg-elevated border border-border-default rounded-brand text-text-primary text-[13px] font-sans appearance-none cursor-pointer interactive pr-8"
                                            >
                                                {!zonas.length ? <option value="">Sin zonas disponibles</option> : null}
                                                {zonas.map(z => <option key={z.id} value={z.id}>{z.nombre}</option>)}
                                            </select>
                                            <Icon name="chevron-down" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                                        </div>
                                    </div>

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

                                <div className="lg:col-span-2 space-y-4">
                                    <div className="bg-bg-surface border border-border-subtle rounded-brand p-6 animate-enter">
                                        <div className="flex items-start justify-between mb-6">
                                            <div>
                                                <span className="text-label text-text-muted">Precio por galón</span>
                                                <p className="text-[12px] text-text-secondary mt-0.5 font-sans">
                                                    {zonas.find(z => z.id === zonaSeleccionada)?.nombre} · {tiposCombustible.find(t => t.id === combustibleSeleccionado)?.label}
                                                </p>
                                            </div>
                                            <Badge variant={Number(precioActual?.subsidioGalon) > 0 ? 'green' : 'amber'}>
                                                {Number(precioActual?.subsidioGalon) > 0 ? 'Con subsidio' : 'Sin subsidio'}
                                            </Badge>
                                        </div>

                                        <div className="kpi-value mb-4">
                                            <span className="font-display text-[64px] md:text-[80px] leading-none text-amber-500 tracking-wide">
                                                {loadingPublicData ? '...' : precioActual ? formatCOP(Number(precioActual.precioGalon)) : '—'}
                                            </span>
                                            <span className="block text-[13px] text-text-muted font-sans mt-2">por galón · COP</span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {tiposCombustible.map((tc, i) => {
                                                const p = precios.find(p => p.zonaId === zonaSeleccionada && p.tipoCombustible === tc.id && p.tipoServicio === servicioSeleccionado);
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
                                                                {tc.id === 'ACPM' ? 'ACPM' : 'Corriente'}
                                                            </span>
                                                            {p && Number(p.subsidioGalon) > 0 ? (
                                                                <Icon name="trending-down" size={12} className="text-green-500" />
                                                            ) : (
                                                                <Icon name="trending-up" size={12} className="text-text-muted" />
                                                            )}
                                                        </div>
                                                        <span className={`font-display text-[28px] leading-none ${isActive ? 'text-amber-500' : 'text-text-primary'}`}>
                                                            {p ? formatCOP(Number(p.precioGalon)) : '—'}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ══════════════════════════════════════════
                  STATIONS
              ══════════════════════════════════════════ */}
                    <section
                        id="estaciones"
                        className="relative z-10 py-16 px-6 border-t border-border-subtle bg-bg-surface animate-enter"
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

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {estacionesFiltradas.length > 0 ? estacionesFiltradas.map((est, i) => (
                                    <div
                                        key={est.id}
                                        onClick={() => setHighlightedStationId(est.id)}
                                        className={cn(
                                            "bg-bg-elevated border rounded-brand p-4 interactive animate-enter cursor-pointer transition-all",
                                            highlightedStationId === est.id
                                                ? "border-amber-500/50 bg-amber-500/2 shadow-[0_8px_20px_rgba(245,166,35,0.08)]"
                                                : "border-border-subtle hover:border-border-strong"
                                        )}
                                        style={{ animationDelay: `${i * 60}ms` }}
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
                                )) : (
                                    <div className="col-span-full py-12 text-center bg-bg-elevated rounded-brand border border-dashed border-border-subtle">
                                        <Icon name="info" size={24} className="text-text-muted mx-auto mb-3" />
                                        <p className="text-text-secondary text-sm">
                                            No encontramos gasolineras cercanas con Google Maps para tu ubicación actual.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* ══════════════════════════════════════════
                  NEWS / NOTICIAS
              ══════════════════════════════════════════ */}
                    <section
                        id="noticias"
                        className="py-16 px-6 border-t border-border-subtle animate-enter"
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
                                {noticiasMock.map((noticia, i) => (
                                    <article
                                        key={noticia.id}
                                        className="bg-bg-surface border border-border-subtle rounded-brand p-5 hover:border-border-strong interactive group animate-enter cursor-pointer"
                                        style={{ animationDelay: `${i * 80}ms` }}
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
                        <section className="py-12 px-6 border-t border-border-subtle bg-bg-surface animate-enter">
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
                    <footer className="py-8 px-6 border-t border-border-subtle animate-enter">
                        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2.5">
                                <Icon name="tank" size={16} className="text-amber-500 opacity-50" />
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
                </>
            ) : null}
        </div>
    );
}
