import { prisma } from '../utils/prisma';

interface GooglePlacesSearchNearbyResponse {
    places?: Array<{
        id: string;
        displayName?: { text?: string };
        formattedAddress?: string;
        shortFormattedAddress?: string;
        location?: { latitude?: number; longitude?: number };
        nationalPhoneNumber?: string;
        types?: string[];
        addressComponents?: Array<{
            longText?: string;
            shortText?: string;
            types?: string[];
        }>;
    }>;
}

type GooglePlace = NonNullable<GooglePlacesSearchNearbyResponse['places']>[number];
type GoogleAddressComponent = NonNullable<GooglePlace['addressComponents']>[number];

function normalizePlaceText(value?: string | null) {
    return (value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function resolveZonaFromPlace(
    place: GooglePlace,
    zonas: Array<{ id: string; nombre: string; departamentos: string[]; }>
) {
    const componentByType = (type: string) => place.addressComponents?.find((component: GoogleAddressComponent) => component.types?.includes(type));

    const cityCandidates = [
        componentByType('locality')?.longText,
        componentByType('administrative_area_level_2')?.longText,
        componentByType('sublocality')?.longText,
        componentByType('postal_town')?.longText,
    ].filter(Boolean) as string[];

    const departmentCandidates = [
        componentByType('administrative_area_level_1')?.longText,
        componentByType('administrative_area_level_1')?.shortText,
    ].filter(Boolean) as string[];

    const normalizedAddress = normalizePlaceText(`${place.formattedAddress ?? ''} ${place.shortFormattedAddress ?? ''}`);
    const normalizedCities = cityCandidates.map(normalizePlaceText).filter(Boolean);
    const normalizedDepartments = departmentCandidates.map(normalizePlaceText).filter(Boolean);

    const matchedZone = zonas.find((zona) => {
        // Si no hay departamentos, no podemos validar por ubicación de forma precisa,
        // pero intentamos emparejar la ciudad con el nombre de la zona si coinciden.
        const cityNameMatch = normalizedCities.some(city => normalizePlaceText(zona.nombre).includes(city));

        if (!zona.departamentos.length) {
            return cityNameMatch;
        }

        return zona.departamentos.some((departamento) => {
            const normalizedDepartamento = normalizePlaceText(departamento);
            return normalizedDepartments.includes(normalizedDepartamento) || normalizedAddress.includes(normalizedDepartamento);
        });
    });

    return {
        city: cityCandidates[0] ?? '',
        department: departmentCandidates[0] ?? '',
        zone: matchedZone,
    };
}

export class PublicoService {
    /**
     * Obtiene los precios vigentes para todas las zonas.
     */
    async getPrecios() {
        return await prisma.precioVigente.findMany({
            where: { activo: true },
            include: {
                zona: { select: { nombre: true, tipoZona: true } },
                decreto: { select: { numero: true, titulo: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Obtiene el listado de estaciones de servicio activas.
     */
    async getEstaciones(filtros?: { zonaId?: string; soloConCoordenadas?: boolean }) {
        return prisma.estacionServicio.findMany({
            where: {
                activa: true,
                ...(filtros?.zonaId ? { zonaId: filtros.zonaId } : {}),
                ...(filtros?.soloConCoordenadas ? { latitud: { not: null }, longitud: { not: null } } : {}),
            },
            select: {
                id: true,
                nombre: true,
                direccion: true,
                ciudad: true,
                departamento: true,
                codigoSicom: true,
                zonaId: true,
                latitud: true,
                longitud: true,
                zona: { select: { id: true, nombre: true } },
                tanques: {
                    where: { activo: true },
                    select: { tipoCombustible: true },
                },
            },
            orderBy: { nombre: 'asc' },
        }).then((estaciones) => estaciones.map((estacion) => ({
            ...estacion,
            latitud: estacion.latitud ? Number(estacion.latitud) : null,
            longitud: estacion.longitud ? Number(estacion.longitud) : null,
            combustibles: [...new Set(estacion.tanques.map((tanque) => tanque.tipoCombustible))],
        })));
    }

    /**
     * Obtiene las zonas de distribución.
     */
    async getZonas() {
        return await prisma.zonaDistribucion.findMany({
            select: {
                id: true,
                nombre: true,
                tipoZona: true,
                departamentos: true,
            }
        });
    }

    /**
     * Obtiene los decretos normativos vigentes.
     */
    async getDecretosVigentes() {
        return await prisma.decretoNormativo.findMany({
            where: { activo: true },
            orderBy: { fechaVigencia: 'desc' }
        });
    }

    async getEstacionesCercanas(params: { latitud: number; longitud: number; radioMetros?: number; limite?: number }) {
        const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

        if (!googleMapsApiKey) {
            const error = new Error('GOOGLE_MAPS_API_KEY no está configurada');
            (error as Error & { statusCode?: number }).statusCode = 503;
            throw error;
        }

        const radioMetros = Math.min(Math.max(params.radioMetros ?? 5000, 1000), 50000);
        const limite = Math.min(Math.max(params.limite ?? 20, 1), 20);
        const zonas = await prisma.zonaDistribucion.findMany({
            select: {
                id: true,
                nombre: true,
                departamentos: true,
            },
        });

        const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': googleMapsApiKey,
                'X-Goog-FieldMask': [
                    'places.id',
                    'places.displayName',
                    'places.formattedAddress',
                    'places.shortFormattedAddress',
                    'places.location',
                    'places.types',
                    'places.nationalPhoneNumber',
                    'places.addressComponents',
                ].join(','),
            },
            body: JSON.stringify({
                includedTypes: ['gas_station'],
                maxResultCount: limite,
                rankPreference: 'DISTANCE',
                languageCode: 'es',
                regionCode: 'CO',
                locationRestriction: {
                    circle: {
                        center: {
                            latitude: params.latitud,
                            longitude: params.longitud,
                        },
                        radius: radioMetros,
                    },
                },
            }),
        });

        if (!response.ok) {
            const responseBody = await response.text();
            const error = new Error(`Google Places devolvió ${response.status}: ${responseBody}`);
            (error as Error & { statusCode?: number }).statusCode = response.status >= 400 && response.status < 500 ? 502 : 503;
            throw error;
        }

        const data = await response.json() as GooglePlacesSearchNearbyResponse;

        return (data.places ?? [])
            .filter((place) => typeof place.location?.latitude === 'number' && typeof place.location?.longitude === 'number')
            .map((place) => {
                const resolvedPlace = resolveZonaFromPlace(place, zonas);

                return {
                    id: place.id,
                    nombre: place.displayName?.text || 'Gasolinera cercana',
                    direccion: place.formattedAddress || place.shortFormattedAddress || 'Dirección no disponible',
                    ciudad: resolvedPlace.city,
                    departamento: resolvedPlace.department,
                    codigoSicom: 'GOOGLE_PLACES',
                    zonaId: resolvedPlace.zone?.id ?? 'GOOGLE_PLACES',
                    zona: resolvedPlace.zone
                        ? { id: resolvedPlace.zone.id, nombre: resolvedPlace.zone.nombre }
                        : undefined,
                    latitud: place.location?.latitude ?? null,
                    longitud: place.location?.longitude ?? null,
                    combustibles: ['ACPM', 'Gasolina'],
                };
            });
    }

    async getTransaccionesPorPlaca(placaVehiculo: string, page = 1, limit = 50) {
        const sanitized = placaVehiculo.toUpperCase().replace(/[^A-Z0-9-]/g, '');
        if (!sanitized || sanitized.length < 3) {
            throw Object.assign(new Error('La placa debe tener al menos 3 caracteres alfanuméricos'), { statusCode: 400 });
        }
        const safeLimit = Math.min(100, Math.max(1, limit));
        const safePage = Math.max(1, page);
        const skip = (safePage - 1) * safeLimit;

        const where = {
            placaVehiculo: { contains: sanitized, mode: 'insensitive' as const },
        };

        const [data, total] = await Promise.all([
            prisma.transaccionCombustible.findMany({
                where,
                select: {
                    id: true,
                    tipo: true,
                    tipoCombustible: true,
                    tipoServicio: true,
                    galones: true,
                    precioUnitario: true,
                    precioTotal: true,
                    placaVehiculo: true,
                    estado: true,
                    createdAt: true,
                    estacion: { select: { id: true, nombre: true, ciudad: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: safeLimit,
            }),
            prisma.transaccionCombustible.count({ where }),
        ]);

        return { data, pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) } };
    }
}

export const publicoService = new PublicoService();
