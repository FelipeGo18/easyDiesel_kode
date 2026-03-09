/**
 * Route helpers for informative station discovery along a planned trip.
 */

/** Haversine distance in km between two [lng, lat] points. */
export function haversineKm(a: [number, number], b: [number, number]): number {
    const earthRadiusKm = 6371;
    const dLat = ((b[1] - a[1]) * Math.PI) / 180;
    const dLon = ((b[0] - a[0]) * Math.PI) / 180;
    const sinLat = Math.sin(dLat / 2);
    const sinLon = Math.sin(dLon / 2);
    const h =
        sinLat * sinLat +
        Math.cos((a[1] * Math.PI) / 180) * Math.cos((b[1] * Math.PI) / 180) * sinLon * sinLon;
    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/**
 * Cumulative distance along a polyline (array of [lng, lat]).
 * Returns an array where index 0 = 0 and the last entry is the total length in km.
 */
export function cumulativeDistances(coords: [number, number][]): number[] {
    const distances: number[] = [0];

    for (let i = 1; i < coords.length; i++) {
        distances.push(distances[i - 1] + haversineKm(coords[i - 1], coords[i]));
    }

    return distances;
}

/** Returns an interpolated coordinate at a given cumulative km along the route. */
export function getCoordinateAtDistance(
    polyline: [number, number][],
    cumulativeKm: number[],
    targetKm: number,
): [number, number] {
    if (polyline.length === 0) {
        return [0, 0];
    }

    if (targetKm <= 0) {
        return polyline[0];
    }

    const totalKm = cumulativeKm[cumulativeKm.length - 1] ?? 0;
    if (targetKm >= totalKm) {
        return polyline[polyline.length - 1];
    }

    for (let i = 0; i < cumulativeKm.length - 1; i++) {
        const startKm = cumulativeKm[i];
        const endKm = cumulativeKm[i + 1];

        if (targetKm < startKm || targetKm > endKm) {
            continue;
        }

        const segmentKm = endKm - startKm;
        const t = segmentKm === 0 ? 0 : (targetKm - startKm) / segmentKm;
        const start = polyline[i];
        const end = polyline[i + 1];

        return [
            start[0] + (end[0] - start[0]) * t,
            start[1] + (end[1] - start[1]) * t,
        ];
    }

    return polyline[polyline.length - 1];
}

export function getRouteSamplePoints(routeCoords: [number, number][], spacingKm = DEFAULT_SPACING_KM): [number, number][] {
    const cumulativeKm = cumulativeDistances(routeCoords);
    const totalKm = cumulativeKm[cumulativeKm.length - 1] ?? 0;

    if (totalKm === 0) {
        return routeCoords.length ? [routeCoords[0]] : [];
    }

    const points: [number, number][] = [];
    const step = Math.max(1, spacingKm);

    for (let currentKm = 0; currentKm <= totalKm; currentKm += step) {
        points.push(getCoordinateAtDistance(routeCoords, cumulativeKm, currentKm));
    }

    const lastPoint = routeCoords[routeCoords.length - 1];
    const lastSample = points[points.length - 1];
    if (!lastSample || haversineKm(lastSample, lastPoint) > 0.1) {
        points.push(lastPoint);
    }

    return points;
}

/**
 * Returns the minimum distance from a point to a route polyline and the
 * approximate cumulative km where that projection occurs.
 */
export function pointToPolyline(
    point: [number, number],
    polyline: [number, number][],
    cumulativeKm: number[],
): { distanceKm: number; alongKm: number } {
    let bestDistanceKm = Infinity;
    let bestAlongKm = 0;

    for (let i = 0; i < polyline.length - 1; i++) {
        const start = polyline[i];
        const end = polyline[i + 1];
        const segmentKm = cumulativeKm[i + 1] - cumulativeKm[i];

        if (segmentKm === 0) {
            continue;
        }

        const dx = end[0] - start[0];
        const dy = end[1] - start[1];
        const denominator = dx * dx + dy * dy;
        const t = denominator === 0
            ? 0
            : Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / denominator));

        const projection: [number, number] = [start[0] + t * dx, start[1] + t * dy];
        const distanceKm = haversineKm(point, projection);

        if (distanceKm < bestDistanceKm) {
            bestDistanceKm = distanceKm;
            bestAlongKm = cumulativeKm[i] + t * segmentKm;
        }
    }

    return { distanceKm: bestDistanceKm, alongKm: bestAlongKm };
}

export interface StationCandidate {
    id: string;
    nombre: string;
    direccion: string;
    ciudad: string;
    lngLat: [number, number];
    departamento?: string;
    zonaId?: string;
    zonaNombre?: string;
    codigoSicom?: string;
}

export interface StationOnRoute extends StationCandidate {
    detourKm: number;
    alongKm: number;
    segmentIndex: number;
}

export interface InformativeRouteResult {
    totalDistanceKm: number;
    totalDurationMinutes: number;
    routeGeometry: [number, number][];
    stations: StationOnRoute[];
    spacingKm: number;
    coveredSegments: number;
    totalSegments: number;
}

export interface StationSamplingOptions {
    spacingKm?: number;
    maxDetourKm?: number;
}

const DEFAULT_SPACING_KM = 10;
const DEFAULT_MAX_DETOUR_KM = 3;

/** Projects stations to the route and filters them by detour threshold. */
export function projectStationsToRoute(
    routeCoords: [number, number][],
    stations: StationCandidate[],
    maxDetourKm = DEFAULT_MAX_DETOUR_KM,
): StationOnRoute[] {
    const cumulativeKm = cumulativeDistances(routeCoords);

    return stations
        .map((station) => {
            const projection = pointToPolyline(station.lngLat, routeCoords, cumulativeKm);
            return {
                ...station,
                detourKm: projection.distanceKm,
                alongKm: projection.alongKm,
                segmentIndex: 0,
            };
        })
        .filter((station) => station.detourKm <= maxDetourKm)
        .sort((a, b) => a.alongKm - b.alongKm);
}

/**
 * Selects one informative station around the route for each distance segment.
 * The station chosen is the closest detour inside that interval.
 */
export function selectStationsAlongRoute(
    routeCoords: [number, number][],
    stations: StationCandidate[],
    options: StationSamplingOptions = {},
): { stations: StationOnRoute[]; spacingKm: number; coveredSegments: number; totalSegments: number } {
    const spacingKm = options.spacingKm ?? DEFAULT_SPACING_KM;
    const maxDetourKm = options.maxDetourKm ?? DEFAULT_MAX_DETOUR_KM;
    const cumulativeKm = cumulativeDistances(routeCoords);
    const totalDistanceKm = cumulativeKm[cumulativeKm.length - 1] ?? 0;

    if (totalDistanceKm === 0) {
        return { stations: [], spacingKm, coveredSegments: 0, totalSegments: 0 };
    }

    const projectedStations = projectStationsToRoute(routeCoords, stations, maxDetourKm);
    const totalSegments = Math.max(1, Math.ceil(totalDistanceKm / spacingKm));

    // Assign segment index to each station
    const allStations: StationOnRoute[] = projectedStations.map((station) => ({
        ...station,
        segmentIndex: Math.min(
            totalSegments - 1,
            Math.floor(station.alongKm / spacingKm),
        ),
    }));

    // Count unique segments that have at least one station
    const coveredSet = new Set(allStations.map((s) => s.segmentIndex));

    return {
        stations: allStations,
        spacingKm,
        coveredSegments: coveredSet.size,
        totalSegments,
    };
}

/**
 * From all projected stations, pick only the one with the smallest detour per segment.
 * Returns them sorted by alongKm (order along the route).
 * Mapbox Directions supports up to 25 waypoints, so this also caps the result.
 */
export function selectBestPerSegment(
    routeCoords: [number, number][],
    stations: StationCandidate[],
    options: StationSamplingOptions = {},
): { stations: StationOnRoute[]; spacingKm: number; coveredSegments: number; totalSegments: number } {
    const result = selectStationsAlongRoute(routeCoords, stations, options);

    const bestBySegment = new Map<number, StationOnRoute>();
    for (const station of result.stations) {
        const current = bestBySegment.get(station.segmentIndex);
        if (!current || station.detourKm < current.detourKm) {
            bestBySegment.set(station.segmentIndex, station);
        }
    }

    // Sort by position along route, cap at 23 waypoints (Mapbox limit is 25 including origin/dest)
    const bestStations = [...bestBySegment.values()]
        .sort((a, b) => a.alongKm - b.alongKm)
        .slice(0, 23);

    return {
        stations: bestStations,
        spacingKm: result.spacingKm,
        coveredSegments: bestStations.length,
        totalSegments: result.totalSegments,
    };
}

export function formatDuration(minutes: number): string {
    const roundedMinutes = Math.max(0, Math.round(minutes));
    const hours = Math.floor(roundedMinutes / 60);
    const remainingMinutes = roundedMinutes % 60;
    return hours > 0 ? `${hours}h ${remainingMinutes}min` : `${remainingMinutes} min`;
}

export function formatDistance(km: number): string {
    return km >= 10 ? `${Math.round(km)} km` : `${km.toFixed(1)} km`;
}
