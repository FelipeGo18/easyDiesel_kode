import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { StationsMap } from '@/features/public-map/StationsMap';
import { publicoService, type PublicPrecio, type PublicStation, type PublicZona } from '@/services/publico';
import { calculateDistance } from '@/lib/utils';

const mapStyleOptions = [
    { id: 'night', label: 'Noche', styleUrl: 'mapbox://styles/mapbox/dark-v11' },
    { id: 'cinematic', label: 'Cinematico', styleUrl: 'mapbox://styles/mapbox/navigation-night-v1' },
    { id: 'satellite', label: 'Satelital', styleUrl: 'mapbox://styles/mapbox/satellite-streets-v12' },
];

type StationWithDistance = PublicStation & { distancia?: number };

function hasCoordinates(station: PublicStation): station is PublicStation & { latitud: number; longitud: number } {
    return typeof station.latitud === 'number' && typeof station.longitud === 'number';
}

function normalizePlaceLabel(value?: string | null) {
    return (value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function resolveZoneIdFromStation(station: PublicStation | null | undefined, zonas: PublicZona[]) {
    if (!station) {
        return '';
    }

    if (station.zonaId && station.zonaId !== 'GOOGLE_PLACES' && zonas.some((zona) => zona.id === station.zonaId)) {
        return station.zonaId;
    }

    const normalizedCity = normalizePlaceLabel(station.ciudad);
    const normalizedDepartment = normalizePlaceLabel(station.departamento);

    const matchedZone = zonas.find((zona) => {
        const municipalityMatch = zona.municipios?.some((municipio) => normalizePlaceLabel(municipio) === normalizedCity);
        if (!municipalityMatch) {
            return false;
        }

        if (!normalizedDepartment) {
            return true;
        }

        return zona.departamentos?.some((departamento) => normalizePlaceLabel(departamento) === normalizedDepartment);
    });

    return matchedZone?.id || '';
}

export function StationsAtlasPage() {
    const navigate = useNavigate();
    const stationItemRefs = useRef<Record<string, HTMLElement | null>>({});
    const [zonas, setZonas] = useState<PublicZona[]>([]);
    const [zonaSeleccionada, setZonaSeleccionada] = useState('');
    const [combustibleSeleccionado] = useState('ACPM');
    const [servicioSeleccionado] = useState('PARTICULAR');
    const [precios, setPrecios] = useState<PublicPrecio[]>([]);
    const [nearbyMapStations, setNearbyMapStations] = useState<PublicStation[]>([]);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [highlightedStationId, setHighlightedStationId] = useState<string | null>(null);
    const [isTourActive, setIsTourActive] = useState(false);
    const [activeMapStyleId, setActiveMapStyleId] = useState<(typeof mapStyleOptions)[number]['id']>('night');

    useEffect(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation([position.coords.longitude, position.coords.latitude]);
                },
                (error) => console.error('Error obteniendo ubicacion:', error)
            );
        }

        const fetchData = async () => {
            try {
                const [zonasData, preciosData] = await Promise.all([
                    publicoService.getZonas(),
                    publicoService.getPrecios(),
                ]);

                setZonas(zonasData);
                setPrecios(preciosData);

                if (zonasData.length > 0) {
                    setZonaSeleccionada(zonasData[0].id);
                }
            } catch (error) {
                console.error('Error cargando datos del atlas:', error);
            }
        };

        void fetchData();
    }, []);

    const estacionesFiltradas: StationWithDistance[] = nearbyMapStations
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

    const precioActual = precios.find((precio) => (
        precio.zonaId === zonaSeleccionada
        && precio.tipoCombustible === combustibleSeleccionado
        && precio.tipoServicio === servicioSeleccionado
    ));

    const formatCOP = (n: number) => new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
    }).format(n);

    const estacionMasCercana = estacionesFiltradas.find((estacion) => estacion.distancia !== undefined) || null;
    const highlightedStation = estacionesFiltradas.find((estacion) => estacion.id === highlightedStationId) || null;
    const highlightedStationIndex = highlightedStation ? estacionesFiltradas.findIndex((estacion) => estacion.id === highlightedStation.id) : -1;
    const nextTourStation = highlightedStationIndex >= 0 && estacionesFiltradas.length > 1
        ? estacionesFiltradas[(highlightedStationIndex + 1) % estacionesFiltradas.length]
        : null;
    const activeMapStyle = mapStyleOptions.find((style) => style.id === activeMapStyleId) || mapStyleOptions[0];
    const zonaPorEstacionActiva = resolveZoneIdFromStation(highlightedStation, zonas);
    const zonaPorEstacionCercana = resolveZoneIdFromStation(estacionMasCercana, zonas);
    const zonaEfectivaId = zonaPorEstacionActiva || zonaPorEstacionCercana || zonaSeleccionada;
    const zonaPrecioReferencia = zonas.find((zona) => zona.id === zonaSeleccionada) || null;

    useEffect(() => {
        if (!zonas.length) {
            return;
        }

        const nextZoneId = zonaPorEstacionActiva || zonaPorEstacionCercana || zonas[0]?.id || '';
        if (nextZoneId && nextZoneId !== zonaSeleccionada) {
            setZonaSeleccionada(nextZoneId);
        }
    }, [zonaPorEstacionActiva, zonaPorEstacionCercana, zonaSeleccionada, zonas]);

    useEffect(() => {
        if (!estacionesFiltradas.length) {
            setHighlightedStationId(null);
            return;
        }

        setHighlightedStationId((currentStationId) => {
            const hasCurrentStation = currentStationId
                ? estacionesFiltradas.some((station) => station.id === currentStationId)
                : false;

            if (hasCurrentStation) {
                return currentStationId;
            }

            return estacionMasCercana?.id || estacionesFiltradas[0]?.id || null;
        });
    }, [estacionMasCercana?.id, estacionesFiltradas]);

    useEffect(() => {
        if (!highlightedStationId) {
            return;
        }

        const activeItem = stationItemRefs.current[highlightedStationId];
        activeItem?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [highlightedStationId]);

    useEffect(() => {
        if (!isTourActive || estacionesFiltradas.length < 2) {
            return;
        }

        const intervalId = window.setInterval(() => {
            setHighlightedStationId((currentStationId) => {
                const currentIndex = estacionesFiltradas.findIndex((station) => station.id === currentStationId);
                const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % estacionesFiltradas.length : 0;
                return estacionesFiltradas[nextIndex]?.id || null;
            });
        }, 3600);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [isTourActive, estacionesFiltradas]);

    const openDirections = (station: StationWithDistance) => {
        if (!hasCoordinates(station)) {
            return;
        }

        const destination = `${station.latitud},${station.longitud}`;
        const origin = userLocation ? `${userLocation[1]},${userLocation[0]}` : undefined;
        const url = origin
            ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`
            : `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;

        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const selectStationRoute = (stationId: string) => {
        setIsTourActive(false);
        setHighlightedStationId(stationId);
    };

    const toggleTour = () => {
        if (estacionesFiltradas.length < 2) {
            return;
        }

        setIsTourActive((current) => {
            if (current) {
                return false;
            }

            const immediateStation = nextTourStation || estacionesFiltradas[0] || null;
            if (immediateStation) {
                setHighlightedStationId(immediateStation.id);
            }

            return true;
        });
    };

    return (
        <div className="h-[100dvh] overflow-hidden bg-[#050505] text-white">
            <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

            <div className="relative flex h-[100dvh] flex-col overflow-hidden">
                <header className="shrink-0 border-b border-white/8 bg-[#080808]/94 px-4 py-3 backdrop-blur-xl lg:px-6">
                    <div className="mx-auto flex max-w-[1680px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-3">
                            <Button variant="ghost" size="sm" className="border-white/10 bg-white/[0.02] text-white/72 hover:border-white/20 hover:bg-white/[0.05] hover:text-white" onClick={() => navigate('/')}>
                                <Icon name="arrow-right" size={14} className="rotate-180" />
                                Volver al inicio
                            </Button>
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-mono uppercase tracking-[0.24em] text-white/72">
                                <span className="h-2 w-2 rounded-full bg-white/70" />
                                Atlas dedicado
                            </div>
                            <div>
                                <h1 className="font-heading text-[24px] font-bold tracking-tight text-white lg:text-[30px]">Explorador de estaciones cercanas</h1>
                                <p className="mt-1.5 max-w-3xl text-[12px] leading-relaxed text-white/60 lg:text-[13px]">
                                    Pagina dedicada para ver claramente las gasolineras cercanas, enfocar estaciones reales y leer la ruta sin las limitaciones del modal.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:min-w-[680px]">
                            <div className="rounded-[22px] border border-white/8 bg-white/[0.02] px-4 py-2.5 backdrop-blur-md">
                                <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/45">Cobertura</span>
                                <div className="mt-1.5 text-[24px] font-display text-white">{estacionesFiltradas.length}</div>
                            </div>
                            <div className="rounded-[22px] border border-white/8 bg-white/[0.02] px-4 py-2.5 backdrop-blur-md">
                                <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/45">Mas cercana</span>
                                <div className="mt-1.5 text-[18px] font-display text-white">{estacionMasCercana?.distancia !== undefined ? `${estacionMasCercana.distancia.toFixed(1)} km` : 'Sin dato'}</div>
                            </div>
                            <div className="rounded-[22px] border border-white/8 bg-white/[0.02] px-4 py-2.5 backdrop-blur-md">
                                <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/45">Precio guia</span>
                                <div className="mt-1.5 text-[18px] font-display text-sky-300">{precioActual ? formatCOP(Number(precioActual.precioGalon)) : 'Sin precio'}</div>
                                <p className="mt-1 text-[10px] text-white/40">{zonaPrecioReferencia ? `Referencia regulada: ${zonaPrecioReferencia.nombre}` : 'Referencia tarifaria'}</p>
                            </div>
                            <div className="rounded-[22px] border border-white/8 bg-white/[0.02] px-4 py-2.5 backdrop-blur-md">
                                <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/45">Vista</span>
                                <div className="mt-1.5 text-[18px] font-display text-white">{activeMapStyle.label}</div>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="mx-auto flex min-h-0 w-full max-w-[1680px] flex-1 flex-col overflow-hidden px-4 py-3 lg:px-6 lg:py-4">
                    <section className="grid min-h-0 flex-1 grid-cols-1 items-start gap-4 xl:grid-cols-[260px_minmax(0,1fr)_340px] xl:items-stretch">
                        <aside className="h-full overflow-hidden rounded-[28px] border border-white/8 bg-[#090909] p-4 backdrop-blur-md">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/45">Vista</p>
                                    <h2 className="mt-2 text-[18px] font-heading font-bold text-white">Control del mapa</h2>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-mono uppercase tracking-[0.14em] text-white/45">Estilo del mapa</label>
                                    <div className="flex flex-wrap gap-2">
                                        {mapStyleOptions.map((style) => (
                                            <button
                                                key={style.id}
                                                type="button"
                                                onClick={() => setActiveMapStyleId(style.id)}
                                                className={`rounded-full border px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.18em] transition-colors ${activeMapStyleId === style.id ? 'border-white/24 bg-white/[0.08] text-white' : 'border-white/10 bg-white/[0.02] text-white/48 hover:border-white/18 hover:text-white/78'}`}
                                            >
                                                {style.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-[24px] border border-white/8 bg-[#070707] p-3.5">
                                    <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-white/45">Punto recomendado</p>
                                    <h3 className="mt-2 text-[17px] font-heading font-bold text-white">{estacionMasCercana?.nombre || 'Esperando ubicacion'}</h3>
                                    <p className="mt-2 text-[11px] leading-relaxed text-white/60">{estacionMasCercana?.direccion || 'Activa la ubicacion del navegador para priorizar estaciones cercanas.'}</p>
                                    <p className="mt-2 text-[10px] leading-relaxed text-white/42">
                                        {zonaPrecioReferencia
                                            ? `El precio guia usa la zona regulada ${zonaPrecioReferencia.nombre}. No significa que la estacion este en esa ciudad.`
                                            : 'El precio guia es una referencia regulada y no el precio exacto reportado por la estacion.'}
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-mono uppercase tracking-[0.14em] text-white/45">
                                        <span className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1">{zonaPrecioReferencia ? `Zona precio: ${zonaPrecioReferencia.nombre}` : 'Zona precio'}</span>
                                        <span className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1">Combustible: {combustibleSeleccionado === 'ACPM' ? 'ACPM' : 'Corriente'}</span>
                                        <span className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1">Servicio: {servicioSeleccionado}</span>
                                    </div>
                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                        <Button variant={isTourActive ? 'primary' : 'ghost'} size="sm" className={`w-full justify-center ${isTourActive ? 'bg-white text-black border-white hover:bg-white/95 hover:border-white' : 'border-white/10 bg-white/[0.03] text-white/72 hover:border-white/18 hover:bg-white/[0.05] hover:text-white'}`} disabled={estacionesFiltradas.length < 2} onClick={toggleTour}>
                                            <Icon name="navigation" size={14} />
                                            {isTourActive ? 'Pausar tour' : 'Iniciar tour'}
                                        </Button>
                                        <Button variant="ghost" size="sm" className="w-full justify-center border-white/10 bg-white/[0.03] text-white/72 hover:border-white/18 hover:bg-white/[0.05] hover:text-white" onClick={() => {
                                            const stationId = estacionMasCercana?.id || estacionesFiltradas[0]?.id;
                                            if (stationId) {
                                                selectStationRoute(stationId);
                                            }
                                        }}>
                                            <Icon name="map" size={14} />
                                            Ver ruta
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        <section className="flex min-h-0 min-w-0 overflow-hidden rounded-[30px] border border-white/8 bg-[#0a0a0a] p-3 shadow-[0_28px_70px_rgba(0,0,0,0.24)] backdrop-blur-md xl:h-full">
                            <div className="mx-auto flex min-h-0 h-full w-full max-w-[940px] flex-col">
                                <div className="flex min-h-0 h-full flex-col rounded-[26px] border border-white/8 bg-[#050505] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.22)]">
                                    <StationsMap
                                        prices={precios}
                                        selectedFuel={combustibleSeleccionado}
                                        selectedService={servicioSeleccionado}
                                        selectedZoneId={zonaEfectivaId}
                                        onStationsFound={setNearbyMapStations}
                                        mapHeightClassName="min-h-[320px] xl:h-full xl:min-h-0"
                                        className="h-full w-full"
                                        highlightedStationId={highlightedStationId}
                                        immersive={activeMapStyle.id !== 'night'}
                                        mapStyleUrl={activeMapStyle.styleUrl}
                                        showRouteSummary={false}
                                        showStatusText={false}
                                    />
                                </div>
                            </div>
                        </section>

                        <aside className="flex min-h-0 h-full flex-col overflow-hidden rounded-[28px] border border-white/8 bg-[#090909] backdrop-blur-md">
                            <div className="shrink-0 border-b border-white/8 px-4 py-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/45">Cercanas</p>
                                        <h2 className="mt-1 text-[17px] font-heading font-bold text-white">Estaciones detectadas</h2>
                                    </div>
                                    <Badge variant="amber">1 visible</Badge>
                                </div>
                                <p className="mt-2 text-[10px] text-white/45">Una tarjeta visible y scroll interno suave.</p>
                            </div>

                            {highlightedStation ? (
                                <div className="shrink-0 border-b border-white/8 px-4 py-3">
                                    <div className="rounded-[22px] border border-white/8 bg-[#101010] p-3 shadow-[0_20px_40px_rgba(0,0,0,0.18)]">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/76">Estacion activa</p>
                                                <h3 className="mt-1.5 truncate text-[17px] font-heading font-bold text-white">{highlightedStation.nombre}</h3>
                                                <p className="mt-1.5 text-[11px] leading-relaxed text-white/60">{highlightedStation.direccion}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[18px] font-display text-white">{highlightedStation.distancia !== undefined ? `${highlightedStation.distancia.toFixed(1)} km` : 'Sin dato'}</p>
                                                <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.16em] text-white/40">Google Places</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 grid grid-cols-2 gap-2">
                                            <Button variant="primary" size="sm" className="w-full justify-center bg-white text-black border-white hover:bg-white/95 hover:border-white" onClick={() => openDirections(highlightedStation)}>
                                                <Icon name="navigation" size={14} />
                                                Como llegar
                                            </Button>
                                            {nextTourStation ? (
                                                <Button variant="ghost" size="sm" className="w-full justify-center border-white/10 bg-white/[0.02] text-white/72 hover:border-white/18 hover:bg-white/[0.05] hover:text-white" onClick={() => selectStationRoute(nextTourStation.id)}>
                                                    <Icon name="arrow-right" size={14} />
                                                    Siguiente
                                                </Button>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            <div className="min-h-0 flex-1 overflow-y-auto scroll-smooth px-4 py-3 [scrollbar-color:rgba(255,255,255,0.18)_transparent] [scrollbar-width:thin]">
                                <div className="space-y-3">
                                    {estacionesFiltradas.length > 0 ? estacionesFiltradas.map((estacion, index) => (
                                        <article
                                            key={`atlas-${estacion.id}`}
                                            ref={(element) => {
                                                stationItemRefs.current[estacion.id] = element;
                                            }}
                                            className={`group cursor-pointer rounded-[20px] border px-3.5 py-3 transition-all ${highlightedStationId === estacion.id ? 'border-white/14 bg-[#121212] shadow-[0_18px_40px_rgba(0,0,0,0.2)]' : 'border-white/8 bg-[#080808] hover:border-white/14 hover:bg-[#101010]'}`}
                                            onClick={() => selectStationRoute(estacion.id)}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-mono ${highlightedStationId === estacion.id ? 'border-white/18 bg-white/[0.08] text-white' : 'border-white/10 bg-white/[0.03] text-white/72'}`}>
                                                            {(index + 1).toString().padStart(2, '0')}
                                                        </span>
                                                        <h4 className="truncate text-[13px] font-semibold text-white">{estacion.nombre}</h4>
                                                    </div>
                                                    <p className="mt-2 text-[11px] leading-relaxed text-white/60">{estacion.direccion}</p>
                                                </div>
                                                <div className="shrink-0 text-right">
                                                    {estacion.distancia !== undefined ? (
                                                        <p className="text-[17px] font-display text-white">{estacion.distancia.toFixed(1)} km</p>
                                                    ) : (
                                                        <p className="text-[11px] text-white/35">Sin distancia</p>
                                                    )}
                                                    <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.16em] text-white/40">Google Places</p>
                                                </div>
                                            </div>

                                            <div className="mt-3 flex items-center justify-between border-t border-white/8 pt-2.5 text-[10px] font-mono uppercase tracking-[0.16em] text-white/45">
                                                <button
                                                    type="button"
                                                    className={`rounded-full border px-2.5 py-1 text-[9px] transition-colors ${highlightedStationId === estacion.id ? 'border-white/18 bg-white/[0.06] text-white' : 'border-white/10 text-white/72 hover:border-white/18 hover:bg-white/[0.05] hover:text-white'}`}
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        selectStationRoute(estacion.id);
                                                    }}
                                                >
                                                    {highlightedStationId === estacion.id ? 'Ruta activa' : 'Ver ruta'}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="rounded-full border border-white/10 px-2 py-1 text-[9px] text-sky-200 transition-colors hover:border-sky-300/30 hover:text-sky-100"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        openDirections(estacion);
                                                    }}
                                                >
                                                    Como llegar
                                                </button>
                                            </div>
                                        </article>
                                    )) : (
                                        <div className="rounded-[24px] border border-dashed border-white/10 bg-black/20 px-5 py-10 text-center text-white/55">
                                            <Icon name="info" size={24} className="mx-auto mb-3 opacity-60" />
                                            No hay estaciones para mostrar en este momento.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </aside>
                    </section>
                </main>
            </div>
        </div>
    );
}