import { forwardRef, useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StationsMap } from '@/features/public-map/StationsMap';
import { calculateDistance, cn } from '@/lib/utils';
import type { PublicPrecio, PublicStation } from '@/services/publico';

interface HomeStationsProps {
    precios: PublicPrecio[];
    combustibleSeleccionado: string;
    servicioSeleccionado: string;
}

type StationWithDistance = PublicStation & { distancia?: number };

function hasCoordinates(station: PublicStation): station is PublicStation & { latitud: number; longitud: number } {
    return typeof station.latitud === 'number' && typeof station.longitud === 'number';
}

export const HomeStations = forwardRef<HTMLElement, HomeStationsProps>(({
    precios,
    combustibleSeleccionado,
    servicioSeleccionado
}, ref) => {
    const navigate = useNavigate();
    const [nearbyMapStations, setNearbyMapStations] = useState<PublicStation[]>([]);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [highlightedStationId, setHighlightedStationId] = useState<string | null>(null);
    const [showAllStations, setShowAllStations] = useState(false);

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
    }, []);

    // Auto-collapse the station list when a new nearby search completes
    useEffect(() => { setShowAllStations(false); }, [nearbyMapStations]);

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

    const combustiblesDisponibles = [...new Set(estacionesFiltradas.flatMap((estacion) => estacion.combustibles))];

    return (
        <section
            ref={ref}
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

                    <div className="rounded-[4px] border border-border-subtle bg-bg-elevated p-4">
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
                                        "bg-bg-elevated border rounded-[4px] p-4 interactive cursor-pointer transition-all scroll-child",
                                        highlightedStationId === est.id
                                            ? "border-amber-500 bg-transparent text-white"
                                            : "border-border-subtle hover:border-[#444]"
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
    );
});

HomeStations.displayName = 'HomeStations';
