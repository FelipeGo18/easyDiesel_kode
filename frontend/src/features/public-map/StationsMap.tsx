import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { publicoService, type PublicStation, type PublicPrecio } from '@/services/publico';
import { cn } from '@/lib/utils';

const DEFAULT_CENTER: [number, number] = [-74.0721, 4.711];
const ROUTE_SOURCE_ID = 'stations-route-source';
const ROUTE_GLOW_LAYER_ID = 'stations-route-glow';
const ROUTE_LINE_LAYER_ID = 'stations-route-line';
const STATIONS_SOURCE_ID = 'stations-points-source';
const STATIONS_PULSE_LAYER_ID = 'stations-points-pulse';
const STATIONS_LAYER_ID = 'stations-points-layer';
const STATIONS_STROKE_LAYER_ID = 'stations-points-stroke';
const HIGHLIGHTED_STATION_IMAGE_ID = 'highlighted-station-image';
const HIGHLIGHTED_STATION_LAYER_ID = 'highlighted-station-layer';

interface MapboxDirectionsResponse {
    routes?: Array<{
        distance: number;
        duration: number;
        geometry: {
            coordinates: [number, number][];
            type: 'LineString';
        };
    }>;
}

interface RouteSummary {
    distanceKm: number;
    durationMinutes: number;
}

function ensureHighlightedStationImage(map: mapboxgl.Map) {
    if (map.hasImage(HIGHLIGHTED_STATION_IMAGE_ID)) {
        return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
        const image = new Image(48, 48);
        image.onload = () => {
            if (!map.hasImage(HIGHLIGHTED_STATION_IMAGE_ID)) {
                map.addImage(HIGHLIGHTED_STATION_IMAGE_ID, image, { pixelRatio: 2 });
            }
            resolve();
        };
        image.onerror = () => reject(new Error('No fue posible cargar station.svg para el punto seleccionado.'));
        image.src = '/icons/station.svg';
    });
}

function hasCoordinates(station: PublicStation): station is PublicStation & { latitud: number; longitud: number } {
    return typeof station.latitud === 'number' && typeof station.longitud === 'number';
}

function getStationPrice(
    station: PublicStation | undefined,
    prices: PublicPrecio[],
    selectedFuel: string,
    selectedService: string,
    selectedZoneId?: string | null
) {
    const zoneCandidates = [station?.zonaId, station?.zona?.id, selectedZoneId].filter(
        (value): value is string => Boolean(value && value !== 'GOOGLE_PLACES')
    );

    for (const zoneId of zoneCandidates) {
        const matchingPrice = prices.find((price) => (
            price.zonaId === zoneId
            && price.tipoCombustible === selectedFuel
            && price.tipoServicio === selectedService
        ));

        if (matchingPrice) {
            return matchingPrice;
        }
    }

    return prices.find((price) => price.tipoCombustible === selectedFuel && price.tipoServicio === selectedService);
}

function createPopupContent(
    station: PublicStation,
    selectedFuel: string,
    priceFormatted: string,
    onClose: () => void
) {
    const wrapper = document.createElement('div');
    wrapper.style.fontFamily = "'Inter', sans-serif";
    wrapper.style.color = '#101010';
    wrapper.style.minWidth = '220px';
    wrapper.style.padding = '4px';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.alignItems = 'flex-start';
    header.style.justifyContent = 'space-between';
    header.style.gap = '10px';
    header.style.marginBottom = '8px';

    const titleRow = document.createElement('div');
    titleRow.style.display = 'flex';
    titleRow.style.alignItems = 'center';
    titleRow.style.gap = '8px';

    const dot = document.createElement('div');
    dot.style.width = '10px';
    dot.style.height = '10px';
    dot.style.borderRadius = '999px';
    dot.style.background = station.codigoSicom === 'GOOGLE_PLACES' ? '#F5A623' : '#94a3b8';

    const title = document.createElement('strong');
    title.textContent = station.nombre;
    title.style.fontSize = '14px';
    title.style.letterSpacing = '-0.01em';

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', 'Cerrar');
    closeButton.style.display = 'inline-flex';
    closeButton.style.alignItems = 'center';
    closeButton.style.justifyContent = 'center';
    closeButton.style.width = '26px';
    closeButton.style.height = '26px';
    closeButton.style.borderRadius = '999px';
    closeButton.style.border = '1px solid rgba(15, 23, 42, 0.08)';
    closeButton.style.background = '#f8fafc';
    closeButton.style.cursor = 'pointer';
    closeButton.style.flexShrink = '0';

    const closeIcon = document.createElement('img');
    closeIcon.src = '/icons/close.svg';
    closeIcon.alt = '';
    closeIcon.width = 12;
    closeIcon.height = 12;
    closeIcon.style.display = 'block';

    closeButton.appendChild(closeIcon);
    closeButton.addEventListener('click', onClose);

    titleRow.append(dot, title);
    header.append(titleRow, closeButton);

    const body = document.createElement('div');
    body.style.fontSize = '11px';
    body.style.color = '#555';
    body.style.display = 'flex';
    body.style.flexDirection = 'column';
    body.style.gap = '6px';

    const addressRow = document.createElement('div');
    addressRow.style.display = 'flex';
    addressRow.style.alignItems = 'flex-start';
    addressRow.style.gap = '6px';
    addressRow.innerHTML = `<span style="opacity:0.7">📍</span><span>${station.direccion}</span>`;

    const priceRow = document.createElement('div');
    priceRow.style.display = 'flex';
    priceRow.style.alignItems = 'center';
    priceRow.style.gap = '6px';
    priceRow.innerHTML = `<span style="opacity:0.7">⛽</span><span>${priceFormatted} · ${selectedFuel}</span>`;

    body.append(addressRow, priceRow);
    wrapper.append(header, body);

    return wrapper;
}

function buildStationsFeatureCollection(
    stations: PublicStation[],
    prices: PublicPrecio[],
    selectedFuel: string,
    selectedService: string,
    selectedZoneId?: string | null,
    highlightedStationId?: string | null
) {
    return {
        type: 'FeatureCollection' as const,
        features: stations.filter(hasCoordinates).map((station) => {
            const priceInfo = getStationPrice(station, prices, selectedFuel, selectedService, selectedZoneId);
            const priceFormatted = priceInfo
                ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(priceInfo.precioGalon)
                : 'Sin precio';

            return {
                type: 'Feature' as const,
                geometry: {
                    type: 'Point' as const,
                    coordinates: [station.longitud as number, station.latitud as number] as [number, number],
                },
                properties: {
                    id: station.id,
                    nombre: station.nombre,
                    direccion: station.direccion,
                    codigoSicom: station.codigoSicom,
                    selectedFuel,
                    priceFormatted,
                    isHighlighted: station.id === highlightedStationId,
                    pointColor: station.codigoSicom === 'GOOGLE_PLACES' ? '#f59e0b' : '#94a3b8',
                    pulseColor: station.codigoSicom === 'GOOGLE_PLACES' ? 'rgba(245, 158, 11, 0.22)' : 'rgba(148, 163, 184, 0.22)',
                },
            };
        }),
    };
}

function dedupeStations(stations: PublicStation[]) {
    const uniqueStations = new Map<string, PublicStation>();

    stations.forEach((station) => {
        const key = station.id || `${station.nombre}-${station.latitud}-${station.longitud}`;
        if (!uniqueStations.has(key)) {
            uniqueStations.set(key, station);
        }
    });

    return Array.from(uniqueStations.values());
}

interface StationsMapProps {
    prices?: PublicPrecio[];
    selectedFuel?: string;
    selectedService?: string;
    selectedZoneId?: string | null;
    onStationsFound?: (stations: PublicStation[]) => void;
    mapHeightClassName?: string;
    className?: string;
    highlightedStationId?: string | null;
    immersive?: boolean;
    mapStyleUrl?: string;
    showRouteSummary?: boolean;
    showStatusText?: boolean;
}

export function StationsMap({ 
    prices = [], 
    selectedFuel = 'ACPM', 
    selectedService = 'PARTICULAR',
    selectedZoneId,
    onStationsFound,
    mapHeightClassName = 'h-[400px]',
    className,
    highlightedStationId,
    immersive = false,
    mapStyleUrl = 'mapbox://styles/mapbox/dark-v11',
    showRouteSummary = true,
    showStatusText = true,
}: StationsMapProps) {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
    const popupRef = useRef<mapboxgl.Popup | null>(null);
    const routeAnimationRef = useRef<number | null>(null);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [nearbyStations, setNearbyStations] = useState<PublicStation[]>([]);
    const [loadingNearbyStations, setLoadingNearbyStations] = useState(false);
    const [nearbyError, setNearbyError] = useState<string | null>(null);
    const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);
    const [mapReady, setMapReady] = useState(false);
    const [styleLoadVersion, setStyleLoadVersion] = useState(0);

    // Refs para evitar recrear el mapa cuando cambian los datos
    const nearbyStationsRef = useRef(nearbyStations);
    const pricesRef = useRef(prices);
    const selectedFuelRef = useRef(selectedFuel);
    const selectedServiceRef = useRef(selectedService);

    useEffect(() => { nearbyStationsRef.current = nearbyStations; }, [nearbyStations]);
    useEffect(() => { pricesRef.current = prices; }, [prices]);
    useEffect(() => { selectedFuelRef.current = selectedFuel; }, [selectedFuel]);
    useEffect(() => { selectedServiceRef.current = selectedService; }, [selectedService]);

    const clearAnimatedRoute = () => {
        const map = mapRef.current;
        if (!map) {
            return;
        }

        if (routeAnimationRef.current) {
            window.clearInterval(routeAnimationRef.current);
            routeAnimationRef.current = null;
        }

        if (map.getLayer(ROUTE_LINE_LAYER_ID)) {
            map.removeLayer(ROUTE_LINE_LAYER_ID);
        }

        if (map.getLayer(ROUTE_GLOW_LAYER_ID)) {
            map.removeLayer(ROUTE_GLOW_LAYER_ID);
        }

        if (map.getSource(ROUTE_SOURCE_ID)) {
            map.removeSource(ROUTE_SOURCE_ID);
        }
    };

    // Obtener ubicación del usuario
    useEffect(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
                    setUserLocation(coords);
                },
                (error) => {
                    console.error('Error obteniendo ubicación:', error);
                    setNearbyError('Activa la ubicación del navegador para buscar gasolineras cercanas.');
                }
            );
        }
    }, []);

    const fetchNearbyStations = async (coords: [number, number]) => {
        setLoadingNearbyStations(true);
        setNearbyError(null);

        try {
            const stations = await publicoService.getEstacionesCercanas({
                latitud: coords[1],
                longitud: coords[0],
                radioMetros: 8000,
                limite: 20,
            });

            const mapped = dedupeStations(stations);
            setNearbyStations(mapped);

            if (!mapped.length) {
                setNearbyError('Google Maps no devolvió gasolineras cercanas para tu ubicación actual.');
                return;
            }

            setNearbyError(null);
        } catch (err) {
            console.error('Error al buscar estaciones cercanas:', err);
            setNearbyStations([]);
            setNearbyError('No fue posible consultar gasolineras cercanas en Google Maps.');
        } finally {
            setLoadingNearbyStations(false);
        }
    };

    useEffect(() => {
        if (!userLocation) {
            setNearbyStations([]);
            return;
        }

        void fetchNearbyStations(userLocation);
    }, [userLocation]);

    useEffect(() => {
        if (!onStationsFound) {
            return;
        }

        onStationsFound(nearbyStations);
    }, [nearbyStations, onStationsFound]);

    useEffect(() => {
        const token = import.meta.env.VITE_MAPBOX_TOKEN;

        if (!token || !mapContainerRef.current) {
            return;
        }

        // Inicializar el mapa solo una vez
        if (mapRef.current) return;

        setMapReady(false);

        mapboxgl.accessToken = token;
        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: mapStyleUrl,
            center: userLocation || DEFAULT_CENTER,
            zoom: userLocation ? 13.6 : 5,
            pitch: immersive ? 58 : 0,
            bearing: immersive ? -24 : 0,
            antialias: true,
        });

        mapRef.current = map;

        const onStyleLoad = async () => {
            if (!map) return;
            
            try {
                await ensureHighlightedStationImage(map);
            } catch (error) {
                console.error(error);
            }

            // Configurar edificios 3D y niebla si es inmersivo
            if (immersive) {
                map.setFog({
                    color: 'rgba(6, 10, 15, 0.75)',
                    'high-color': 'rgba(14, 27, 38, 0.65)',
                    'horizon-blend': 0.08,
                    'space-color': 'rgba(2, 6, 10, 1)',
                    'star-intensity': 0.15,
                });

                const labelLayerId = map.getStyle().layers?.find((layer) => layer.type === 'symbol' && layer.layout?.['text-field'])?.id;

                if (map.getSource('composite') && !map.getLayer('3d-buildings')) {
                    map.addLayer(
                        {
                            id: '3d-buildings',
                            source: 'composite',
                            'source-layer': 'building',
                            filter: ['==', 'extrude', 'true'],
                            type: 'fill-extrusion',
                            minzoom: 12,
                            paint: {
                                'fill-extrusion-color': [
                                    'interpolate',
                                    ['linear'],
                                    ['get', 'height'],
                                    0, '#101820',
                                    40, '#162633',
                                    120, '#244150'
                                ],
                                'fill-extrusion-height': [
                                    'interpolate',
                                    ['linear'],
                                    ['zoom'],
                                    12, 0,
                                    15, ['get', 'height']
                                ],
                                'fill-extrusion-base': [
                                    'interpolate',
                                    ['linear'],
                                    ['zoom'],
                                    12, 0,
                                    15, ['get', 'min_height']
                                ],
                                'fill-extrusion-opacity': 0.5,
                            },
                        },
                        labelLayerId
                    );
                }
            }

            setMapReady(true);
            setStyleLoadVersion((current) => current + 1);
        };

        map.on('load', onStyleLoad);
        map.on('style.load', onStyleLoad);

        const handleStationClick = (event: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
            const feature = event.features?.[0];
            if (!map || !feature || feature.geometry.type !== 'Point') return;

            const [longitude, latitude] = feature.geometry.coordinates as [number, number];
            const station = nearbyStationsRef.current.find((item) => item.id === feature.properties?.id);
            if (!station) return;

            const priceInfo = getStationPrice(station, pricesRef.current, selectedFuelRef.current, selectedServiceRef.current, selectedZoneId);
            const priceFormatted = priceInfo
                ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(priceInfo.precioGalon)
                : 'Sin precio';

            popupRef.current?.remove();
            popupRef.current = new mapboxgl.Popup({ offset: 14, closeButton: false })
                .setLngLat([longitude, latitude])
                .setDOMContent(createPopupContent(
                    station,
                    selectedFuelRef.current,
                    String(feature.properties?.priceFormatted ?? priceFormatted),
                    () => popupRef.current?.remove()
                ))
                .addTo(map);
        };

        map.on('click', STATIONS_LAYER_ID, handleStationClick);
        map.on('click', HIGHLIGHTED_STATION_LAYER_ID, handleStationClick);

        const handlePointerEnter = () => { map.getCanvas().style.cursor = 'pointer'; };
        const handlePointerLeave = () => { map.getCanvas().style.cursor = ''; };

        map.on('mouseenter', STATIONS_LAYER_ID, handlePointerEnter);
        map.on('mouseenter', HIGHLIGHTED_STATION_LAYER_ID, handlePointerEnter);
        map.on('mouseleave', STATIONS_LAYER_ID, handlePointerLeave);
        map.on('mouseleave', HIGHLIGHTED_STATION_LAYER_ID, handlePointerLeave);

        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
        
        const geolocate = new mapboxgl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: false,
            showUserHeading: true,
            showUserLocation: false,
        });
        map.addControl(geolocate);

        geolocate.on('geolocate', (event) => {
            setUserLocation([event.coords.longitude, event.coords.latitude]);
        });

        return () => {
            userMarkerRef.current?.remove();
            popupRef.current?.remove();
            clearAnimatedRoute();
            map.remove();
            mapRef.current = null;
            setMapReady(false);
        };
    }, []);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady) return;
        map.setStyle(mapStyleUrl);
    }, [mapStyleUrl]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady) return;
        map.easeTo({
            pitch: immersive ? 58 : 0,
            bearing: immersive ? -24 : 0,
            duration: 1000
        });
    }, [immersive]);

    useEffect(() => {
        const map = mapRef.current;
        const container = mapContainerRef.current;

        if (!map || !container || typeof ResizeObserver === 'undefined') {
            return;
        }

        const resizeObserver = new ResizeObserver(() => {
            map.resize();
        });

        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
        };
    }, [mapReady]);

    // Efecto para actualizar marcadores cuando cambian las estaciones o los filtros de precio
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady) return;

        if (userMarkerRef.current) {
            userMarkerRef.current.remove();
            userMarkerRef.current = null;
        }

        const stationsWithCoordinates = nearbyStations.filter(hasCoordinates);
        const stationsFeatureCollection = buildStationsFeatureCollection(nearbyStations, prices, selectedFuel, selectedService, selectedZoneId, highlightedStationId);

        if (!stationsWithCoordinates.length && !userLocation) return;

        const bounds = new mapboxgl.LngLatBounds();

        // Marcador de usuario
        if (userLocation) {
            bounds.extend(userLocation);

            const userMarkerElement = document.createElement('div');
            userMarkerElement.className = 'user-location-marker';
            userMarkerElement.innerHTML = '<div class="user-location-marker__pulse"></div><div class="user-location-marker__core"></div>';
            userMarkerRef.current = new mapboxgl.Marker({
                element: userMarkerElement,
                anchor: 'center',
                pitchAlignment: 'map',
                rotationAlignment: 'map',
            })
                .setLngLat(userLocation)
                .addTo(map);
        }

        if (map.getSource(STATIONS_SOURCE_ID)) {
            (map.getSource(STATIONS_SOURCE_ID) as mapboxgl.GeoJSONSource).setData(stationsFeatureCollection);
        } else {
            const labelLayerId = map.getStyle().layers?.find((layer) => layer.type === 'symbol' && layer.layout?.['text-field'])?.id;

            map.addSource(STATIONS_SOURCE_ID, {
                type: 'geojson',
                data: stationsFeatureCollection,
            });

            map.addLayer({
                id: STATIONS_PULSE_LAYER_ID,
                type: 'circle',
                source: STATIONS_SOURCE_ID,
                filter: ['==', ['get', 'isHighlighted'], true],
                paint: {
                    'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 11, 14, 14, 17, 17],
                    'circle-color': ['get', 'pointColor'],
                    'circle-opacity': 0.16,
                    'circle-pitch-alignment': 'map',
                    'circle-stroke-width': 0,
                },
            }, labelLayerId);

            map.addLayer({
                id: STATIONS_LAYER_ID,
                type: 'circle',
                source: STATIONS_SOURCE_ID,
                filter: ['==', ['get', 'isHighlighted'], false],
                paint: {
                    'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 5, 14, 7, 17, 8],
                    'circle-color': ['get', 'pointColor'],
                    'circle-opacity': 1,
                    'circle-pitch-alignment': 'map',
                },
            }, labelLayerId);

            map.addLayer({
                id: STATIONS_STROKE_LAYER_ID,
                type: 'circle',
                source: STATIONS_SOURCE_ID,
                filter: ['==', ['get', 'isHighlighted'], false],
                paint: {
                    'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 6.5, 14, 8.5, 17, 9.5],
                    'circle-color': 'rgba(255,255,255,0)',
                    'circle-stroke-color': '#ffffff',
                    'circle-stroke-width': 1.8,
                    'circle-pitch-alignment': 'map',
                },
            }, labelLayerId);

            if (map.hasImage(HIGHLIGHTED_STATION_IMAGE_ID)) {
                map.addLayer({
                    id: HIGHLIGHTED_STATION_LAYER_ID,
                    type: 'symbol',
                    source: STATIONS_SOURCE_ID,
                    filter: ['==', ['get', 'isHighlighted'], true],
                    layout: {
                        'icon-image': HIGHLIGHTED_STATION_IMAGE_ID,
                        'icon-size': 1.08,
                        'icon-anchor': 'center',
                        'icon-allow-overlap': true,
                        'icon-ignore-placement': true,
                        'icon-pitch-alignment': 'map',
                        'icon-rotation-alignment': 'map',
                        'icon-offset': [3, 3],
                    },
                }, labelLayerId);
            }
        }

        stationsWithCoordinates.forEach((station) => {
            bounds.extend([station.longitud as number, station.latitud as number]);
        });

        if (stationsWithCoordinates.length > 0 || userLocation) {
            map.fitBounds(bounds, {
                padding: immersive ? { top: 80, bottom: 80, left: 80, right: 80 } : 60,
                maxZoom: immersive ? 16.2 : 15,
                duration: 1200,
                pitch: immersive ? 58 : 0,
                bearing: immersive ? -24 : 0,
            });
        }
    }, [nearbyStations, prices, selectedFuel, selectedService, selectedZoneId, userLocation, highlightedStationId, immersive, mapReady, styleLoadVersion]);

    useEffect(() => {
        if (!highlightedStationId) {
            clearAnimatedRoute();
            setRouteSummary(null);
            return;
        }

        const map = mapRef.current;
        const highlightedStation = nearbyStations.find(
            (station): station is PublicStation & { latitud: number; longitud: number } =>
                station.id === highlightedStationId && hasCoordinates(station)
        );

        if (!map || !mapReady || !highlightedStation) {
            return;
        }

        map.flyTo({
            center: [highlightedStation.longitud, highlightedStation.latitud],
            zoom: immersive ? 15.8 : 14.6,
            pitch: immersive ? 62 : 0,
            bearing: immersive ? -36 : 0,
            speed: 0.8,
            curve: 1.3,
            essential: true,
        });

        const priceInfo = getStationPrice(highlightedStation, prices, selectedFuel, selectedService, selectedZoneId);
        const priceFormatted = priceInfo
            ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(priceInfo.precioGalon)
            : 'Sin precio';

        popupRef.current?.remove();
        popupRef.current = new mapboxgl.Popup({ offset: 14, closeButton: false })
            .setLngLat([highlightedStation.longitud, highlightedStation.latitud])
            .setDOMContent(createPopupContent(
                highlightedStation,
                selectedFuel,
                priceFormatted,
                () => popupRef.current?.remove()
            ))
            .addTo(map);
    }, [highlightedStationId, nearbyStations, immersive, mapReady, prices, selectedFuel, selectedService, selectedZoneId]);

    useEffect(() => {
        const map = mapRef.current;
        const token = import.meta.env.VITE_MAPBOX_TOKEN;

        if (!map || !mapReady || !token || !userLocation || !highlightedStationId) {
            clearAnimatedRoute();
            setRouteSummary(null);
            return;
        }

        const highlightedStation = nearbyStations.find(
            (station): station is PublicStation & { latitud: number; longitud: number } =>
                station.id === highlightedStationId && hasCoordinates(station)
        );

        if (!highlightedStation) {
            clearAnimatedRoute();
            setRouteSummary(null);
            return;
        }

        let cancelled = false;

        const loadRoute = async () => {
            try {
                const response = await fetch(
                    `https://api.mapbox.com/directions/v5/mapbox/driving/${userLocation[0]},${userLocation[1]};${highlightedStation.longitud},${highlightedStation.latitud}?alternatives=false&geometries=geojson&overview=full&steps=false&access_token=${token}`
                );

                if (!response.ok) {
                    throw new Error(`Mapbox directions error: ${response.status}`);
                }

                const data = await response.json() as MapboxDirectionsResponse;
                const route = data.routes?.[0];

                if (!route || cancelled) {
                    return;
                }

                const routeFeature = {
                    type: 'Feature' as const,
                    properties: {},
                    geometry: route.geometry,
                };

                clearAnimatedRoute();

                map.addSource(ROUTE_SOURCE_ID, {
                    type: 'geojson',
                    data: routeFeature,
                });

                map.addLayer({
                    id: ROUTE_GLOW_LAYER_ID,
                    type: 'line',
                    source: ROUTE_SOURCE_ID,
                    layout: {
                        'line-join': 'round',
                        'line-cap': 'round',
                    },
                    paint: {
                        'line-color': '#38bdf8',
                        'line-width': immersive ? 16 : 10,
                        'line-opacity': 0.18,
                        'line-blur': immersive ? 1.2 : 0.8,
                    },
                });

                map.addLayer({
                    id: ROUTE_LINE_LAYER_ID,
                    type: 'line',
                    source: ROUTE_SOURCE_ID,
                    layout: {
                        'line-join': 'round',
                        'line-cap': 'round',
                    },
                    paint: {
                        'line-color': '#f59e0b',
                        'line-width': immersive ? 5.5 : 4,
                        'line-opacity': 0.95,
                        'line-dasharray': [0, 2, 3, 2],
                    },
                });

                const dashPatterns: number[][] = [
                    [0, 2, 3, 2],
                    [0.5, 2, 2.5, 2],
                    [1, 2, 2, 2],
                    [1.5, 2, 1.5, 2],
                    [2, 2, 1, 2],
                    [2.5, 2, 0.5, 2],
                ];

                let dashIndex = 0;
                routeAnimationRef.current = window.setInterval(() => {
                    const activeMap = mapRef.current;
                    if (!activeMap || !activeMap.getLayer(ROUTE_LINE_LAYER_ID)) {
                        return;
                    }

                    dashIndex = (dashIndex + 1) % dashPatterns.length;
                    activeMap.setPaintProperty(ROUTE_LINE_LAYER_ID, 'line-dasharray', dashPatterns[dashIndex]);
                }, 180);

                setRouteSummary({
                    distanceKm: route.distance / 1000,
                    durationMinutes: route.duration / 60,
                });
            } catch (error) {
                console.error('Error cargando la ruta en Mapbox:', error);
                clearAnimatedRoute();
                setRouteSummary(null);
            }
        };

        void loadRoute();

        return () => {
            cancelled = true;
        };
    }, [highlightedStationId, nearbyStations, userLocation, immersive, mapReady]);

    if (!import.meta.env.VITE_MAPBOX_TOKEN) {
        return (
            <div className="rounded-brand border border-dashed border-amber-500/30 bg-bg-elevated p-6 text-sm text-text-secondary">
                Configura `VITE_MAPBOX_TOKEN` para habilitar el mapa interactivo de estaciones cercanas.
            </div>
        );
    }

    return (
        <div className={cn('flex min-h-0 flex-col gap-3', className)}>
            <style>{`
                .user-location-marker {
                    position: relative;
                    width: 22px;
                    height: 22px;
                }

                .user-location-marker__pulse {
                    position: absolute;
                    inset: -8px;
                    border-radius: 999px;
                    background: rgba(56, 189, 248, 0.16);
                    animation: user-location-pulse 1.9s ease-out infinite;
                }

                .user-location-marker__core {
                    position: absolute;
                    inset: 0;
                    border-radius: 999px;
                    background: #38bdf8;
                    border: 3px solid rgba(255, 255, 255, 0.95);
                    box-shadow: 0 0 0 6px rgba(56, 189, 248, 0.18), 0 10px 20px rgba(8, 47, 73, 0.35);
                }

                @keyframes user-location-pulse {
                    0% { transform: scale(0.8); opacity: 0.75; }
                    70% { transform: scale(1.5); opacity: 0; }
                    100% { transform: scale(1.5); opacity: 0; }
                }
            `}</style>
            <div
                ref={mapContainerRef}
                className={cn(
                    'w-full rounded-brand border border-border-subtle overflow-hidden shadow-inner',
                    immersive && 'shadow-[0_30px_80px_rgba(0,0,0,0.45)]',
                    mapHeightClassName
                )}
            />
            {showRouteSummary && routeSummary ? (
                <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-[18px] border border-border-subtle bg-bg-elevated/70 px-4 py-3 backdrop-blur-sm">
                        <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-text-muted">Ruta estimada</p>
                        <p className="mt-2 text-[18px] font-display text-amber-400">{routeSummary.distanceKm.toFixed(1)} km</p>
                    </div>
                    <div className="rounded-[18px] border border-border-subtle bg-bg-elevated/70 px-4 py-3 backdrop-blur-sm">
                        <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-text-muted">Tiempo aprox.</p>
                        <p className="mt-2 text-[18px] font-display text-sky-300">{Math.max(1, Math.round(routeSummary.durationMinutes))} min</p>
                    </div>
                </div>
            ) : null}
            {showStatusText && loadingNearbyStations ? (
                <p className="text-xs text-text-muted">Buscando gasolineras cerca de tu ubicación...</p>
            ) : null}
            {showStatusText && nearbyError ? (
                <p className="text-xs text-amber-500">{nearbyError}</p>
            ) : null}
        </div>
    );
}