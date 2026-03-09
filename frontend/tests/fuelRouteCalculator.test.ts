import { describe, it, expect } from 'vitest';
import {
    haversineKm,
    cumulativeDistances,
    getCoordinateAtDistance,
    getRouteSamplePoints,
    pointToPolyline,
    projectStationsToRoute,
    selectStationsAlongRoute,
    formatDuration,
    formatDistance,
    type StationCandidate,
} from '@/utils/fuelRouteCalculator';

/* ═══════ haversineKm ═══════ */
describe('haversineKm', () => {
    it('returns 0 for the same point', () => {
        expect(haversineKm([-74.07, 4.71], [-74.07, 4.71])).toBe(0);
    });

    it('calculates Bogotá → Medellín ≈ 415 km (straight line)', () => {
        const d = haversineKm([-74.07, 4.71], [-75.56, 6.25]);
        expect(d).toBeGreaterThan(200);
        expect(d).toBeLessThan(250); // straight-line ~228 km
    });

    it('is symmetric', () => {
        const a: [number, number] = [-74.07, 4.71];
        const b: [number, number] = [-75.56, 6.25];
        expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 6);
    });
});

/* ═══════ cumulativeDistances ═══════ */
describe('cumulativeDistances', () => {
    it('returns [0] for a single point', () => {
        expect(cumulativeDistances([[-74, 4]])).toEqual([0]);
    });

    it('returns cumulative sum', () => {
        const coords: [number, number][] = [[-74, 4], [-74, 5], [-74, 6]];
        const dists = cumulativeDistances(coords);
        expect(dists).toHaveLength(3);
        expect(dists[0]).toBe(0);
        expect(dists[1]).toBeGreaterThan(0);
        expect(dists[2]).toBeGreaterThan(dists[1]);
    });

    it('last entry equals total polyline length', () => {
        const coords: [number, number][] = [[-74, 4], [-74, 4.5], [-74, 5]];
        const dists = cumulativeDistances(coords);
        const seg1 = haversineKm(coords[0], coords[1]);
        const seg2 = haversineKm(coords[1], coords[2]);
        expect(dists[2]).toBeCloseTo(seg1 + seg2, 4);
    });
});

describe('getCoordinateAtDistance', () => {
    it('returns the first point for negative distance', () => {
        const route: [number, number][] = [[-74, 4], [-74, 5]];
        const cumulative = cumulativeDistances(route);
        expect(getCoordinateAtDistance(route, cumulative, -1)).toEqual(route[0]);
    });

    it('interpolates a point along the route', () => {
        const route: [number, number][] = [[-74, 4], [-74, 6]];
        const cumulative = cumulativeDistances(route);
        const point = getCoordinateAtDistance(route, cumulative, cumulative[1] / 2);
        expect(point[0]).toBeCloseTo(-74, 6);
        expect(point[1]).toBeGreaterThan(4.9);
        expect(point[1]).toBeLessThan(5.1);
    });
});

describe('getRouteSamplePoints', () => {
    it('returns multiple points for a long route', () => {
        const route: [number, number][] = [[-74, 4], [-74, 6]];
        const points = getRouteSamplePoints(route, 20);
        expect(points.length).toBeGreaterThan(2);
    });
});

/* ═══════ pointToPolyline ═══════ */
describe('pointToPolyline', () => {
    it('returns distance and along-km for a point on the route', () => {
        const poly: [number, number][] = [[-74, 4], [-74, 5], [-74, 6]];
        const cumDists = cumulativeDistances(poly);
        // Point right on the route
        const { distanceKm, alongKm } = pointToPolyline([-74, 5], poly, cumDists);
        expect(distanceKm).toBeLessThan(0.01); // essentially on the route
        expect(alongKm).toBeCloseTo(cumDists[1], 0);
    });

    it('detects offset from route', () => {
        const poly: [number, number][] = [[-74, 4], [-74, 6]];
        const cumDists = cumulativeDistances(poly);
        // Point 0.1° east of the midpoint
        const { distanceKm } = pointToPolyline([-73.9, 5], poly, cumDists);
        expect(distanceKm).toBeGreaterThan(5); // ~11 km offset
    });
});

/* ═══════ route stations ═══════ */
describe('projectStationsToRoute', () => {
    it('projects stations near the route', () => {
        const route: [number, number][] = [[-74, 4], [-74, 5], [-74, 6]];
        const stations: StationCandidate[] = [
            { id: 's1', nombre: 'Near', direccion: 'Dir', ciudad: 'City', lngLat: [-74.01, 5] },
        ];

        const projected = projectStationsToRoute(route, stations, 5);
        expect(projected).toHaveLength(1);
        expect(projected[0].detourKm).toBeLessThan(5);
    });

    it('filters stations too far from the route', () => {
        const route: [number, number][] = [[-74, 4], [-74, 5], [-74, 6]];
        const stations: StationCandidate[] = [
            { id: 'far', nombre: 'Far', direccion: 'Dir', ciudad: 'City', lngLat: [-72, 5] },
        ];

        const projected = projectStationsToRoute(route, stations, 5);
        expect(projected).toHaveLength(0);
    });
});

describe('selectStationsAlongRoute', () => {
    it('returns one station per covered segment', () => {
        const route: [number, number][] = [];
        for (let lat = 4; lat <= 7; lat += 0.1) {
            route.push([-74, lat]);
        }

        const stations: StationCandidate[] = [
            { id: 's1', nombre: 'A', direccion: 'Dir', ciudad: 'A', lngLat: [-74.01, 4.4] },
            { id: 's2', nombre: 'B', direccion: 'Dir', ciudad: 'B', lngLat: [-74.01, 5.0] },
            { id: 's3', nombre: 'C', direccion: 'Dir', ciudad: 'C', lngLat: [-74.01, 5.6] },
            { id: 's4', nombre: 'D', direccion: 'Dir', ciudad: 'D', lngLat: [-74.01, 6.2] },
        ];

        const result = selectStationsAlongRoute(route, stations, { spacingKm: 60, maxDetourKm: 5 });
        expect(result.stations.length).toBeGreaterThan(0);
        expect(result.coveredSegments).toBe(result.stations.length);
        expect(result.totalSegments).toBeGreaterThanOrEqual(result.coveredSegments);
    });

    it('prefers the closest detour inside each segment', () => {
        const route: [number, number][] = [[-74, 4], [-74, 5], [-74, 6]];
        const stations: StationCandidate[] = [
            { id: 'near', nombre: 'Near', direccion: 'Dir', ciudad: 'City', lngLat: [-74.005, 4.5] },
            { id: 'far', nombre: 'Far', direccion: 'Dir', ciudad: 'City', lngLat: [-74.04, 4.5] },
        ];

        const result = selectStationsAlongRoute(route, stations, { spacingKm: 200, maxDetourKm: 5 });
        expect(result.stations).toHaveLength(1);
        expect(result.stations[0].id).toBe('near');
    });

    it('returns empty for zero-length routes', () => {
        const result = selectStationsAlongRoute([[-74, 4]], [], { spacingKm: 60 });
        expect(result.stations).toEqual([]);
        expect(result.totalSegments).toBe(0);
    });
});

describe('formatDuration', () => {
    it('formats minutes < 60', () => {
        expect(formatDuration(45)).toBe('45 min');
    });

    it('formats hours + minutes', () => {
        expect(formatDuration(125)).toBe('2h 5min');
    });

    it('normalizes 1h 60min into 2h 0min', () => {
        expect(formatDuration(119.6)).toBe('2h 0min');
    });
});

describe('formatDistance', () => {
    it('formats < 10 km with decimal', () => {
        expect(formatDistance(5.3)).toBe('5.3 km');
    });

    it('formats >= 10 km without decimal', () => {
        expect(formatDistance(42.7)).toBe('43 km');
    });
});
