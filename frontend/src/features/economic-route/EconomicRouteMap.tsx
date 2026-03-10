import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import logoSrc from '@/assets/easydiesel_isotipo.svg';
import { publicoService, type PublicPrecio, type PublicStation, type PublicZona } from '@/services/publico';
import {
    cumulativeDistances,
    formatDistance,
    formatDuration,
    getCoordinateAtDistance,
    getRouteSamplePoints,
    type StationCandidate,
    type StationOnRoute,
    selectBestPerSegment,
} from '@/utils/fuelRouteCalculator';

const DEFAULT_CENTER: [number, number] = [-74.0721, 4.711];
const MAIN_ROUTE_SOURCE_ID = 'economic-route-main-source';
const MAIN_ROUTE_GLOW_LAYER_ID = 'economic-route-main-glow';
const MAIN_ROUTE_LAYER_ID = 'economic-route-main-line';
const DETOUR_ROUTE_SOURCE_ID = 'economic-route-detour-source';
const DETOUR_ROUTE_GLOW_LAYER_ID = 'economic-route-detour-glow';
const DETOUR_ROUTE_LAYER_ID = 'economic-route-detour-line';

const FUEL_OPTIONS = [
    { value: 'ACPM', label: 'ACPM' },
    { value: 'GASOLINA_CORRIENTE', label: 'Corriente' },
    { value: 'GASOLINA_EXTRA', label: 'Extra' },
] as const;

const SERVICE_OPTIONS = [
    { value: 'PARTICULAR', label: 'Particular' },
    { value: 'PUBLICO', label: 'Publico' },
    { value: 'CARGA', label: 'Carga' },
    { value: 'OFICIAL', label: 'Oficial' },
] as const;

interface GeocodingFeature {
    place_name: string;
    center: [number, number];
}

interface MapboxGeocodingResponse {
    features?: GeocodingFeature[];
}

interface Suggestion {
    label: string;
    coords: [number, number];
}

interface MapboxDirectionsRoute {
    distance: number;
    duration: number;
    geometry: {
        type: 'LineString';
        coordinates: [number, number][];
    };
}

interface MapboxDirectionsResponse {
    routes?: MapboxDirectionsRoute[];
}

interface ResolvedLocation {
    label: string;
    coords: [number, number];
}

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

function resolveZoneIdFromStation(station: PublicStation | StationOnRoute | null | undefined, zonas: PublicZona[]) {
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

function formatCurrency(value: number) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
    }).format(value);
}

function getPriceForStation(
    station: PublicStation | StationOnRoute,
    precios: PublicPrecio[],
    zonas: PublicZona[],
    fuelType: string,
    serviceType: string,
) {
    const resolvedZoneId = resolveZoneIdFromStation(station, zonas);
    const zoneCandidates = [station.zonaId, resolvedZoneId].filter((value): value is string => Boolean(value && value !== 'GOOGLE_PLACES'));

    for (const zoneId of zoneCandidates) {
        const matchingPrice = precios.find((precio) => (
            precio.zonaId === zoneId
            && precio.tipoCombustible === fuelType
            && precio.tipoServicio === serviceType
        ));

        if (matchingPrice) {
            return {
                price: matchingPrice,
                zone: zonas.find((zona) => zona.id === zoneId) || null,
            };
        }
    }

    const fallbackPrice = precios.find((precio) => precio.tipoCombustible === fuelType && precio.tipoServicio === serviceType) || null;
    return {
        price: fallbackPrice,
        zone: fallbackPrice ? zonas.find((zona) => zona.id === fallbackPrice.zonaId) || null : null,
    };
}

function buildPopupContent(
    station: StationOnRoute,
    pricing: ReturnType<typeof getPriceForStation>,
    onViewDetour: () => void,
) {
    const wrapper = document.createElement('div');
    wrapper.className = 'economic-route-popup-card';

    const title = document.createElement('div');
    title.className = 'economic-route-popup-title';
    title.textContent = station.nombre;

    const meta = document.createElement('div');
    meta.className = 'economic-route-popup-meta';
    meta.textContent = `${station.ciudad}${station.departamento ? `, ${station.departamento}` : ''}`;

    const address = document.createElement('div');
    address.className = 'economic-route-popup-row';
    address.innerHTML = `<span>Direccion</span><strong>${station.direccion}</strong>`;

    const price = document.createElement('div');
    price.className = 'economic-route-popup-row';
    price.innerHTML = `<span>Precio ref.</span><strong>${pricing.price ? formatCurrency(Number(pricing.price.precioGalon)) : 'Sin referencia'}</strong>`;

    const zone = document.createElement('div');
    zone.className = 'economic-route-popup-row';
    zone.innerHTML = `<span>Zona</span><strong>${pricing.zone?.nombre || station.zonaNombre || 'Sin zona resuelta'}</strong>`;

    const detour = document.createElement('div');
    detour.className = 'economic-route-popup-row';
    detour.innerHTML = `<span>Desvio</span><strong>${formatDistance(station.detourKm)}</strong>`;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'economic-route-popup-button';
    button.textContent = 'Marcar acceso';
    button.addEventListener('click', onViewDetour);

    wrapper.append(title, meta, address, price, zone, detour, button);
    return wrapper;
}

async function fetchJson<T>(url: string) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
    }
    return response.json() as Promise<T>;
}

export function EconomicRouteMap() {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const popupRef = useRef<mapboxgl.Popup | null>(null);
    const markerRefs = useRef<mapboxgl.Marker[]>([]);
    const originMarkerRef = useRef<mapboxgl.Marker | null>(null);
    const destMarkerRef = useRef<mapboxgl.Marker | null>(null);
    const [mapReady, setMapReady] = useState(false);
    const [loadingCatalog, setLoadingCatalog] = useState(true);
    const [isTracingRoute, setIsTracingRoute] = useState(false);
    const [loadingDetour, setLoadingDetour] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [catalogStations, setCatalogStations] = useState<PublicStation[]>([]);
    const [zonas, setZonas] = useState<PublicZona[]>([]);
    const [precios, setPrecios] = useState<PublicPrecio[]>([]);
    const [originQuery, setOriginQuery] = useState('');
    const [destinationQuery, setDestinationQuery] = useState('');
    const [selectedFuel, setSelectedFuel] = useState<(typeof FUEL_OPTIONS)[number]['value']>('ACPM');
    const [selectedService, setSelectedService] = useState<(typeof SERVICE_OPTIONS)[number]['value']>('PARTICULAR');
    const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
    const [routeDistanceKm, setRouteDistanceKm] = useState(0);
    const [routeDurationMinutes, setRouteDurationMinutes] = useState(0);
    const [routeSpacingKm, setRouteSpacingKm] = useState(10);
    const [coveredSegments, setCoveredSegments] = useState(0);
    const [totalSegments, setTotalSegments] = useState(0);
    const [resolvedOrigin, setResolvedOrigin] = useState<ResolvedLocation | null>(null);
    const [resolvedDestination, setResolvedDestination] = useState<ResolvedLocation | null>(null);
    const [routeStations, setRouteStations] = useState<StationOnRoute[]>([]);
    const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
    const [detourDistanceKm, setDetourDistanceKm] = useState<number | null>(null);
    const [detourDurationMinutes, setDetourDurationMinutes] = useState<number | null>(null);
    const [originSuggestions, setOriginSuggestions] = useState<Suggestion[]>([]);
    const [destSuggestions, setDestSuggestions] = useState<Suggestion[]>([]);
    const [showOriginDropdown, setShowOriginDropdown] = useState(false);
    const [showDestDropdown, setShowDestDropdown] = useState(false);
    const [locatingUser, setLocatingUser] = useState(false);
    const originDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const destDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const mapToken = import.meta.env.VITE_MAPBOX_TOKEN;

    const showPreviewMarker = useCallback((coords: [number, number], type: 'origin' | 'dest') => {
        const map = mapRef.current;
        if (!map) return;

        const ref = type === 'origin' ? originMarkerRef : destMarkerRef;
        ref.current?.remove();

        const el = document.createElement('div');
        const color = type === 'origin' ? '#3b82f6' : '#ef4444';
        el.style.cssText = `width:18px;height:18px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 0 12px ${color}88,0 2px 8px rgba(0,0,0,.4);cursor:pointer;`;

        ref.current = new mapboxgl.Marker({ element: el, anchor: 'center' })
            .setLngLat(coords)
            .addTo(map);

        map.flyTo({ center: coords, zoom: 14.5, speed: 1.2, essential: true });
    }, []);

    const geocodeSuggestions = useCallback(async (query: string): Promise<Suggestion[]> => {
        if (!mapToken || query.trim().length < 3) return [];
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?autocomplete=true&limit=5&language=es&country=co&access_token=${mapToken}`;
        try {
            const data = await fetchJson<MapboxGeocodingResponse>(url);
            return (data.features ?? []).map((f) => ({ label: f.place_name, coords: f.center }));
        } catch {
            return [];
        }
    }, [mapToken]);

    const handleOriginChange = (value: string) => {
        setOriginQuery(value);
        if (originDebounceRef.current) clearTimeout(originDebounceRef.current);
        originDebounceRef.current = setTimeout(async () => {
            const results = await geocodeSuggestions(value);
            setOriginSuggestions(results);
            setShowOriginDropdown(results.length > 0);
        }, 300);
    };

    const handleDestChange = (value: string) => {
        setDestinationQuery(value);
        if (destDebounceRef.current) clearTimeout(destDebounceRef.current);
        destDebounceRef.current = setTimeout(async () => {
            const results = await geocodeSuggestions(value);
            setDestSuggestions(results);
            setShowDestDropdown(results.length > 0);
        }, 300);
    };

    const selectOriginSuggestion = (s: Suggestion) => {
        setOriginQuery(s.label);
        setShowOriginDropdown(false);
        setOriginSuggestions([]);
        showPreviewMarker(s.coords, 'origin');
    };

    const selectDestSuggestion = (s: Suggestion) => {
        setDestinationQuery(s.label);
        setShowDestDropdown(false);
        setDestSuggestions([]);
        showPreviewMarker(s.coords, 'dest');
    };

    const useMyLocation = async () => {
        if (!('geolocation' in navigator)) {
            setError('Tu navegador no soporta geolocalización.');
            return;
        }
        setLocatingUser(true);
        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) =>
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 }),
            );
            const { longitude, latitude } = position.coords;
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?limit=1&language=es&access_token=${mapToken}`;
            const data = await fetchJson<MapboxGeocodingResponse>(url);
            const label = data.features?.[0]?.place_name ?? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
            setOriginQuery(label);
            setShowOriginDropdown(false);
            showPreviewMarker([longitude, latitude], 'origin');
        } catch {
            setError('No se pudo obtener tu ubicación. Verifica los permisos del navegador.');
        } finally {
            setLocatingUser(false);
        }
    };

    const selectedStation = useMemo(
        () => routeStations.find((station) => station.id === selectedStationId) || null,
        [routeStations, selectedStationId],
    );

    useEffect(() => {
        let cancelled = false;

        const loadCatalog = async () => {
            try {
                setLoadingCatalog(true);
                const [zonasData, preciosData, estacionesData] = await Promise.all([
                    publicoService.getZonas(),
                    publicoService.getPrecios(),
                    publicoService.getEstaciones({ soloConCoordenadas: true }),
                ]);

                if (cancelled) {
                    return;
                }

                setZonas(zonasData);
                setPrecios(preciosData);
                setCatalogStations(estacionesData.filter(hasCoordinates));
            } catch (catalogError) {
                if (!cancelled) {
                    console.error(catalogError);
                    setError('No se pudo cargar el catalogo publico de estaciones y precios.');
                }
            } finally {
                if (!cancelled) {
                    setLoadingCatalog(false);
                }
            }
        };

        void loadCatalog();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current || !mapToken) {
            return;
        }

        mapboxgl.accessToken = mapToken;
        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/navigation-night-v1',
            center: DEFAULT_CENTER,
            zoom: 5.4,
            pitch: 34,
            bearing: -12,
            antialias: true,
        });

        map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right');
        map.on('load', () => setMapReady(true));
        mapRef.current = map;

        return () => {
            popupRef.current?.remove();
            markerRefs.current.forEach((marker) => marker.remove());
            markerRefs.current = [];
            originMarkerRef.current?.remove();
            destMarkerRef.current?.remove();
            map.remove();
            mapRef.current = null;
        };
    }, [mapToken]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady || !map.getStyle()) {
            return;
        }

        const mainData = {
            type: 'Feature' as const,
            properties: {},
            geometry: {
                type: 'LineString' as const,
                coordinates: routeCoords,
            },
        };

        if (map.getSource(MAIN_ROUTE_SOURCE_ID)) {
            (map.getSource(MAIN_ROUTE_SOURCE_ID) as mapboxgl.GeoJSONSource).setData(mainData);
        } else {
            map.addSource(MAIN_ROUTE_SOURCE_ID, { type: 'geojson', data: mainData });
            map.addLayer({
                id: MAIN_ROUTE_GLOW_LAYER_ID,
                type: 'line',
                source: MAIN_ROUTE_SOURCE_ID,
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: {
                    'line-color': '#f59e0b',
                    'line-opacity': 0.18,
                    'line-width': 14,
                    'line-blur': 1,
                },
            });
            map.addLayer({
                id: MAIN_ROUTE_LAYER_ID,
                type: 'line',
                source: MAIN_ROUTE_SOURCE_ID,
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: {
                    'line-color': '#f59e0b',
                    'line-width': 5,
                    'line-opacity': 0.96,
                },
            });
        }

        const bounds = new mapboxgl.LngLatBounds();
        routeCoords.forEach((coord) => bounds.extend(coord));
        routeStations.forEach((station) => bounds.extend(station.lngLat));
        if (!bounds.isEmpty()) {
            map.fitBounds(bounds, { padding: { top: 80, right: 80, bottom: 80, left: 80 }, duration: 1100, maxZoom: 12.8 });
        }
    }, [mapReady, routeCoords, routeStations]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady) {
            return;
        }

        markerRefs.current.forEach((marker) => marker.remove());
        markerRefs.current = [];

        routeStations.forEach((station) => {
            const markerElement = document.createElement('button');
            markerElement.type = 'button';
            markerElement.className = cn('economic-route-marker', station.id === selectedStationId && 'is-selected');
            markerElement.innerHTML = `<span>${station.segmentIndex + 1}</span>`;
            markerElement.addEventListener('click', () => {
                setSelectedStationId(station.id);
            });

            const marker = new mapboxgl.Marker({ element: markerElement, anchor: 'bottom' })
                .setLngLat(station.lngLat)
                .addTo(map);

            markerRefs.current.push(marker);
        });
    }, [mapReady, routeStations, selectedStationId]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady || !selectedStation) {
            popupRef.current?.remove();
            return;
        }

        const pricing = getPriceForStation(selectedStation, precios, zonas, selectedFuel, selectedService);
        popupRef.current?.remove();
        popupRef.current = new mapboxgl.Popup({ offset: 16, closeButton: false, className: 'economic-route-popup' })
            .setLngLat(selectedStation.lngLat)
            .setDOMContent(buildPopupContent(selectedStation, pricing, () => setSelectedStationId(selectedStation.id)))
            .addTo(map);

        map.flyTo({
            center: selectedStation.lngLat,
            zoom: 12.9,
            speed: 0.8,
            curve: 1.15,
            essential: true,
        });
    }, [mapReady, precios, selectedFuel, selectedService, selectedStation, zonas]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady || !map.getStyle()) {
            return;
        }

        const emptyData = {
            type: 'Feature' as const,
            properties: {},
            geometry: {
                type: 'LineString' as const,
                coordinates: [] as [number, number][],
            },
        };

        if (!map.getSource(DETOUR_ROUTE_SOURCE_ID)) {
            map.addSource(DETOUR_ROUTE_SOURCE_ID, { type: 'geojson', data: emptyData });
            map.addLayer({
                id: DETOUR_ROUTE_GLOW_LAYER_ID,
                type: 'line',
                source: DETOUR_ROUTE_SOURCE_ID,
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: {
                    'line-color': '#22d3ee',
                    'line-opacity': 0.24,
                    'line-width': 12,
                    'line-blur': 1,
                },
            });
            map.addLayer({
                id: DETOUR_ROUTE_LAYER_ID,
                type: 'line',
                source: DETOUR_ROUTE_SOURCE_ID,
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: {
                    'line-color': '#22d3ee',
                    'line-width': 4,
                    'line-opacity': 0.95,
                    'line-dasharray': [1.5, 1.2],
                },
            });
        }
    }, [mapReady]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady || !selectedStation || !routeCoords.length || !mapToken) {
            if (map?.getSource(DETOUR_ROUTE_SOURCE_ID)) {
                (map.getSource(DETOUR_ROUTE_SOURCE_ID) as mapboxgl.GeoJSONSource).setData({
                    type: 'Feature',
                    properties: {},
                    geometry: { type: 'LineString', coordinates: [] },
                });
            }
            setDetourDistanceKm(null);
            setDetourDurationMinutes(null);
            return;
        }

        let cancelled = false;

        const loadDetour = async () => {
            try {
                setLoadingDetour(true);
                const cumulativeKm = cumulativeDistances(routeCoords);
                const anchorPoint = getCoordinateAtDistance(routeCoords, cumulativeKm, selectedStation.alongKm);
                const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${anchorPoint[0]},${anchorPoint[1]};${selectedStation.lngLat[0]},${selectedStation.lngLat[1]}?alternatives=false&geometries=geojson&overview=full&steps=false&access_token=${mapToken}`;
                const data = await fetchJson<MapboxDirectionsResponse>(url);
                const detourRoute = data.routes?.[0];

                if (!detourRoute || cancelled || !map.getSource(DETOUR_ROUTE_SOURCE_ID)) {
                    return;
                }

                (map.getSource(DETOUR_ROUTE_SOURCE_ID) as mapboxgl.GeoJSONSource).setData({
                    type: 'Feature',
                    properties: {},
                    geometry: detourRoute.geometry,
                });
                setDetourDistanceKm(detourRoute.distance / 1000);
                setDetourDurationMinutes(detourRoute.duration / 60);
            } catch (detourError) {
                if (!cancelled) {
                    console.error(detourError);
                    setDetourDistanceKm(null);
                    setDetourDurationMinutes(null);
                }
            } finally {
                if (!cancelled) {
                    setLoadingDetour(false);
                }
            }
        };

        void loadDetour();

        return () => {
            cancelled = true;
        };
    }, [mapReady, mapToken, routeCoords, selectedStation]);

    const routeStationsWithPricing = useMemo(() => routeStations.map((station) => ({
        station,
        pricing: getPriceForStation(station, precios, zonas, selectedFuel, selectedService),
    })), [precios, routeStations, selectedFuel, selectedService, zonas]);

    const traceRoute = async (event?: FormEvent<HTMLFormElement>) => {
        event?.preventDefault();

        if (!mapToken) {
            setError('Configura VITE_MAPBOX_TOKEN para usar la ruta informativa.');
            return;
        }

        if (!originQuery.trim() || !destinationQuery.trim()) {
            setError('Debes ingresar origen y destino para trazar la ruta.');
            return;
        }

        setIsTracingRoute(true);
        setError(null);

        try {
            const geocode = async (query: string) => {
                const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?autocomplete=true&limit=1&language=es&country=co&access_token=${mapToken}`;
                const data = await fetchJson<MapboxGeocodingResponse>(url);
                const feature = data.features?.[0];
                if (!feature) {
                    throw new Error(`No se pudo resolver "${query}"`);
                }
                return {
                    label: feature.place_name,
                    coords: feature.center,
                } satisfies ResolvedLocation;
            };

            const [origin, destination] = await Promise.all([
                geocode(originQuery),
                geocode(destinationQuery),
            ]);

            const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.coords[0]},${origin.coords[1]};${destination.coords[0]},${destination.coords[1]}?alternatives=false&geometries=geojson&overview=full&steps=false&access_token=${mapToken}`;
            const directions = await fetchJson<MapboxDirectionsResponse>(directionsUrl);
            const route = directions.routes?.[0];

            if (!route) {
                throw new Error('No se pudo calcular la ruta principal.');
            }

            // Sample points every 10 km along the route
            const samplePoints = getRouteSamplePoints(route.geometry.coordinates, 10);

            // Query Google Places API for gas stations within 3 km of each sample point
            const nearbyResults = await Promise.allSettled(
                samplePoints.map((point) =>
                    publicoService.getEstacionesCercanas({
                        latitud: point[1],
                        longitud: point[0],
                        radioMetros: 3000,
                        limite: 20,
                    }),
                ),
            );

            // Deduplicate nearby results by station ID
            const seenIds = new Set<string>();
            const allStations: PublicStation[] = [];

            for (const result of nearbyResults) {
                if (result.status === 'fulfilled') {
                    for (const station of result.value) {
                        if (!seenIds.has(station.id)) {
                            seenIds.add(station.id);
                            allStations.push(station);
                        }
                    }
                }
            }

            // Merge DB catalog stations that aren't already present
            for (const station of catalogStations.filter(hasCoordinates)) {
                if (!seenIds.has(station.id)) {
                    seenIds.add(station.id);
                    allStations.push(station);
                }
            }

            const candidates: StationCandidate[] = allStations.filter(hasCoordinates).map((station) => ({
                id: station.id,
                nombre: station.nombre,
                direccion: station.direccion,
                ciudad: station.ciudad,
                departamento: station.departamento,
                zonaId: station.zonaId,
                zonaNombre: station.zona?.nombre,
                codigoSicom: station.codigoSicom,
                lngLat: [station.longitud, station.latitud],
            }));

            // Pick the best (closest) station per 10 km segment
            const sampledStations = selectBestPerSegment(route.geometry.coordinates, candidates, { spacingKm: 10, maxDetourKm: 3.5 });

            let finalRouteCoords = route.geometry.coordinates;
            let finalDistance = route.distance;
            let finalDuration = route.duration;

            // Build a multi-waypoint route that passes through the selected stations
            if (sampledStations.stations.length > 0) {
                const waypoints = sampledStations.stations.map((s) => `${s.lngLat[0]},${s.lngLat[1]}`);
                const allPoints = [
                    `${origin.coords[0]},${origin.coords[1]}`,
                    ...waypoints,
                    `${destination.coords[0]},${destination.coords[1]}`,
                ].join(';');
                const waypointUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${allPoints}?alternatives=false&geometries=geojson&overview=full&steps=false&access_token=${mapToken}`;
                const waypointDirections = await fetchJson<MapboxDirectionsResponse>(waypointUrl);
                const waypointRoute = waypointDirections.routes?.[0];

                if (waypointRoute) {
                    finalRouteCoords = waypointRoute.geometry.coordinates;
                    finalDistance = waypointRoute.distance;
                    finalDuration = waypointRoute.duration;
                }
            }

            // Remove preview markers once route is drawn
            originMarkerRef.current?.remove();
            originMarkerRef.current = null;
            destMarkerRef.current?.remove();
            destMarkerRef.current = null;

            setResolvedOrigin(origin);
            setResolvedDestination(destination);
            setRouteCoords(finalRouteCoords);
            setRouteDistanceKm(finalDistance / 1000);
            setRouteDurationMinutes(finalDuration / 60);
            setRouteSpacingKm(sampledStations.spacingKm);
            setCoveredSegments(sampledStations.coveredSegments);
            setTotalSegments(sampledStations.totalSegments);
            setRouteStations(sampledStations.stations);
            setSelectedStationId(sampledStations.stations[0]?.id || null);
        } catch (routeError) {
            console.error(routeError);
            setRouteCoords([]);
            setRouteStations([]);
            setSelectedStationId(null);
            setError(routeError instanceof Error ? routeError.message : 'No se pudo trazar la ruta.');
        } finally {
            setIsTracingRoute(false);
        }
    };

    // Auto-trace removed: inputs start empty, user must fill and submit

    return (
        <div className="relative flex h-full">
            {/* ── Map fills entire workspace ── */}
            <div className="relative min-w-0 flex-1">
                {!mapToken ? (
                    <div className="flex h-full items-center justify-center bg-[#080a0e] px-6 text-center text-sm text-white/50">
                        Configura <code className="mx-1 rounded bg-white/8 px-1.5 py-0.5 font-mono text-[11px] text-amber-300">VITE_MAPBOX_TOKEN</code> para habilitar el mapa.
                    </div>
                ) : (
                    <div ref={mapContainerRef} className="h-full w-full" />
                )}

                {/* ── Floating form bar (top) ── */}
                <form
                    onSubmit={traceRoute}
                    className="absolute left-3 right-3 top-3 z-10 flex flex-wrap items-end gap-2 rounded-lg border border-white/8 bg-[#0a0c10]/90 p-2.5 shadow-2xl backdrop-blur-xl sm:left-4 sm:right-4 sm:top-4 sm:gap-3 sm:p-3 lg:flex-nowrap"
                >
                    <div className="flex min-w-0 flex-1 gap-2">
                        {/* Origin with autocomplete + GPS */}
                        <div className="relative min-w-0 flex-1">
                            <span className="mb-1 block text-[9px] font-mono uppercase tracking-[0.14em] text-white/40">Origen</span>
                            <div className="flex gap-1">
                                <input
                                    value={originQuery}
                                    onChange={(e) => handleOriginChange(e.target.value)}
                                    onFocus={() => originSuggestions.length > 0 && setShowOriginDropdown(true)}
                                    onBlur={() => setTimeout(() => setShowOriginDropdown(false), 200)}
                                    placeholder="Ej. Chapinero, Bogotá"
                                    className="w-full rounded border border-white/8 bg-white/[0.05] px-3 py-2 text-[13px] text-white outline-none transition-colors placeholder:text-white/25 focus:border-amber-500/40 focus:bg-white/[0.07]"
                                />
                                <button
                                    type="button"
                                    onClick={useMyLocation}
                                    disabled={locatingUser}
                                    title="Usar mi ubicación"
                                    className="flex-none rounded border border-white/8 bg-white/[0.05] px-2 py-2 text-white/50 transition-colors hover:bg-white/[0.1] hover:text-white disabled:opacity-40 cursor-pointer"
                                >
                                    {locatingUser ? (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin"><circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12"/></svg>
                                    ) : (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M2 12h4"/><path d="M18 12h4"/></svg>
                                    )}
                                </button>
                            </div>
                            {showOriginDropdown && originSuggestions.length > 0 && (
                                <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded border border-white/10 bg-[#0c0e12] shadow-xl">
                                    {originSuggestions.map((s, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onMouseDown={() => selectOriginSuggestion(s)}
                                            className="w-full px-3 py-2 text-left text-[12px] text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white cursor-pointer"
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Destination with autocomplete */}
                        <div className="relative min-w-0 flex-1">
                            <span className="mb-1 block text-[9px] font-mono uppercase tracking-[0.14em] text-white/40">Destino</span>
                            <input
                                value={destinationQuery}
                                onChange={(e) => handleDestChange(e.target.value)}
                                onFocus={() => destSuggestions.length > 0 && setShowDestDropdown(true)}
                                onBlur={() => setTimeout(() => setShowDestDropdown(false), 200)}
                                placeholder="Ej. Ubaté, Cundinamarca"
                                className="w-full rounded border border-white/8 bg-white/[0.05] px-3 py-2 text-[13px] text-white outline-none transition-colors placeholder:text-white/25 focus:border-amber-500/40 focus:bg-white/[0.07]"
                            />
                            {showDestDropdown && destSuggestions.length > 0 && (
                                <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded border border-white/10 bg-[#0c0e12] shadow-xl">
                                    {destSuggestions.map((s, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onMouseDown={() => selectDestSuggestion(s)}
                                            className="w-full px-3 py-2 text-left text-[12px] text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white cursor-pointer"
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-end gap-2">
                        <label className="hidden sm:block">
                            <span className="mb-1 block text-[9px] font-mono uppercase tracking-[0.14em] text-white/40">Combustible</span>
                            <select
                                value={selectedFuel}
                                onChange={(event) => setSelectedFuel(event.target.value as (typeof FUEL_OPTIONS)[number]['value'])}
                                className="rounded border border-white/8 bg-white/[0.05] px-3 py-2 text-[12px] text-white outline-none"
                            >
                                {FUEL_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </label>
                        <label className="hidden md:block">
                            <span className="mb-1 block text-[9px] font-mono uppercase tracking-[0.14em] text-white/40">Servicio</span>
                            <select
                                value={selectedService}
                                onChange={(event) => setSelectedService(event.target.value as (typeof SERVICE_OPTIONS)[number]['value'])}
                                className="rounded border border-white/8 bg-white/[0.05] px-3 py-2 text-[12px] text-white outline-none"
                            >
                                {SERVICE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </label>
                        <Button type="submit" size="md" isLoading={isTracingRoute || loadingCatalog}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                            <span className="hidden sm:inline">Trazar</span>
                        </Button>
                    </div>
                </form>

                {/* ── Legend chip (bottom-left) ── */}
                <div className="pointer-events-none absolute bottom-4 left-4 z-10 flex items-center gap-4 rounded border border-white/6 bg-[#0a0c10]/80 px-3 py-2 backdrop-blur-md">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/50">
                        <span className="h-2.5 w-5 rounded-sm bg-amber-400" /> Ruta base
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/50">
                        <span className="h-0.5 w-5 rounded-sm bg-cyan-400 border-y border-dashed border-cyan-400" /> Acceso a estación
                    </div>
                </div>

                {/* ── Stats strip (bottom-center) ── */}
                {routeCoords.length > 0 && (
                    <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-px overflow-hidden rounded border border-white/8 bg-[#0a0c10]/85 text-center backdrop-blur-xl">
                        <div className="px-4 py-2">
                            <div className="text-[9px] font-mono uppercase tracking-wider text-white/35">Distancia</div>
                            <div className="mt-0.5 text-[15px] font-semibold tabular-nums text-white">{formatDistance(routeDistanceKm)}</div>
                        </div>
                        <div className="h-8 w-px bg-white/8" />
                        <div className="px-4 py-2">
                            <div className="text-[9px] font-mono uppercase tracking-wider text-white/35">Tiempo</div>
                            <div className="mt-0.5 text-[15px] font-semibold tabular-nums text-white">{formatDuration(routeDurationMinutes)}</div>
                        </div>
                        <div className="h-8 w-px bg-white/8" />
                        <div className="px-4 py-2">
                            <div className="text-[9px] font-mono uppercase tracking-wider text-white/35">Intervalo</div>
                            <div className="mt-0.5 text-[15px] font-semibold tabular-nums text-white">~{routeSpacingKm} km</div>
                        </div>
                        <div className="h-8 w-px bg-white/8" />
                        <div className="px-4 py-2">
                            <div className="text-[9px] font-mono uppercase tracking-wider text-white/35">Estaciones</div>
                            <div className="mt-0.5 text-[15px] font-semibold tabular-nums text-amber-400">{routeStations.length}</div>
                        </div>
                    </div>
                )}

                {/* ── Error toast ── */}
                {error && (
                    <div className="absolute left-4 right-4 top-20 z-20 rounded border border-red-500/20 bg-red-950/80 px-4 py-2.5 text-[12px] text-red-200 backdrop-blur-md sm:left-auto sm:right-4 sm:max-w-md">
                        {error}
                    </div>
                )}
            </div>

            {/* ── Right panel / sidebar ── */}
            <aside className="hidden w-[340px] flex-none flex-col border-l border-white/6 bg-[#080a0e] lg:flex">
                {/* Panel header */}
                <div className="flex items-center justify-between border-b border-white/6 px-4 py-3">
                    <div className="flex items-center gap-2.5">
                        <img src={logoSrc} alt="easyDiesel" className="h-5 w-5" />
                        <span className="text-[12px] font-heading font-bold text-white tracking-tight">
                            Estaciones en ruta
                        </span>
                    </div>
                    <Badge variant="amber">{routeStations.length}</Badge>
                </div>

                {/* Resolved endpoints */}
                {(resolvedOrigin || resolvedDestination) && (
                    <div className="border-b border-white/6 px-4 py-3 space-y-2">
                        {resolvedOrigin && (
                            <div className="flex items-start gap-2">
                                <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-emerald-500/16 text-[8px] text-emerald-400">A</span>
                                <span className="text-[11px] leading-4 text-white/60 line-clamp-2">{resolvedOrigin.label}</span>
                            </div>
                        )}
                        {resolvedDestination && (
                            <div className="flex items-start gap-2">
                                <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-red-500/16 text-[8px] text-red-400">B</span>
                                <span className="text-[11px] leading-4 text-white/60 line-clamp-2">{resolvedDestination.label}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Selected station detail */}
                {selectedStation && (
                    <div className="border-b border-white/6 bg-cyan-500/[0.04] px-4 py-3">
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.5)]" />
                            <span className="text-[9px] font-mono uppercase tracking-wider text-cyan-300/70">Acceso secundario activo</span>
                        </div>
                        <div className="mt-2 text-[14px] font-semibold text-white leading-tight">{selectedStation.nombre}</div>
                        <div className="mt-1 text-[11px] text-white/45">{selectedStation.direccion}</div>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                            <div className="rounded bg-white/[0.04] border border-white/6 px-2.5 py-2">
                                <div className="text-[8px] font-mono uppercase tracking-wider text-white/35">Desvío</div>
                                <div className="mt-0.5 text-[13px] font-semibold tabular-nums text-white">
                                    {detourDistanceKm ? formatDistance(detourDistanceKm) : loadingDetour ? '...' : formatDistance(selectedStation.detourKm)}
                                </div>
                            </div>
                            <div className="rounded bg-white/[0.04] border border-white/6 px-2.5 py-2">
                                <div className="text-[8px] font-mono uppercase tracking-wider text-white/35">Tiempo</div>
                                <div className="mt-0.5 text-[13px] font-semibold tabular-nums text-white">
                                    {detourDurationMinutes ? formatDuration(detourDurationMinutes) : loadingDetour ? '...' : '--'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Station list */}
                <div className="flex-1 overflow-y-auto">
                    {routeStationsWithPricing.length === 0 && (
                        <div className="flex h-full items-center justify-center px-6 text-center text-[12px] text-white/35">
                            Traza una ruta para ver las estaciones distribuidas por tramo.
                        </div>
                    )}

                    {routeStationsWithPricing.map(({ station, pricing }) => {
                        const isSelected = station.id === selectedStationId;

                        return (
                            <button
                                key={station.id}
                                type="button"
                                onClick={() => setSelectedStationId(station.id)}
                                className={cn(
                                    'w-full border-b border-white/4 px-4 py-3 text-left transition-colors',
                                    isSelected
                                        ? 'bg-cyan-500/[0.08] border-l-2 border-l-cyan-400'
                                        : 'hover:bg-white/[0.03]',
                                )}
                            >
                                <div className="flex items-center gap-2.5">
                                    <span
                                        className={cn(
                                            'flex h-6 w-6 flex-none items-center justify-center rounded-full text-[10px] font-mono font-bold',
                                            isSelected
                                                ? 'bg-cyan-400/20 text-cyan-300 ring-1 ring-cyan-400/40'
                                                : 'bg-amber-500/14 text-amber-300 ring-1 ring-amber-500/20',
                                        )}
                                    >
                                        {station.segmentIndex + 1}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-[13px] font-medium text-white">{station.nombre}</div>
                                        <div className="truncate text-[11px] text-white/40">
                                            {station.ciudad}{station.departamento ? `, ${station.departamento}` : ''}
                                        </div>
                                    </div>
                                    <div className="flex-none text-right">
                                        <div className="text-[12px] font-semibold tabular-nums text-white">
                                            {pricing.price ? formatCurrency(Number(pricing.price.precioGalon)) : '--'}
                                        </div>
                                        <div className="text-[10px] tabular-nums text-white/30">{formatDistance(station.detourKm)}</div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Coverage footer */}
                {totalSegments > 0 && (
                    <div className="flex-none border-t border-white/6 px-4 py-2.5">
                        <div className="flex items-center justify-between text-[10px] font-mono text-white/35">
                            <span>Cobertura</span>
                            <span className="tabular-nums">{coveredSegments}/{totalSegments} tramos</span>
                        </div>
                        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/6">
                            <div
                                className="h-full rounded-full bg-amber-500/70 transition-all duration-500"
                                style={{ width: `${totalSegments > 0 ? (coveredSegments / totalSegments) * 100 : 0}%` }}
                            />
                        </div>
                    </div>
                )}
            </aside>
        </div>
    );
}
