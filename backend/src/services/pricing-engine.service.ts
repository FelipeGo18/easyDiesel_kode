import { prisma } from '../utils/prisma';

interface ResolveFuelPriceInput {
    estacionId: string;
    tipoCombustible: 'ACPM' | 'GASOLINA_CORRIENTE';
    tipoServicio: 'PARTICULAR' | 'PUBLICO' | 'DIPLOMATICO' | 'OFICIAL' | 'CARGA';
    fecha?: Date;
}

export class PricingEngineService {
    async resolveCurrentFuelPrice(input: ResolveFuelPriceInput) {
        const fecha = input.fecha ?? new Date();

        const estacion = await prisma.estacionServicio.findUnique({
            where: { id: input.estacionId },
            select: {
                id: true,
                nombre: true,
                zonaId: true,
                zona: { select: { id: true, nombre: true, tipoZona: true } },
            },
        });

        if (!estacion) {
            throw Object.assign(new Error('Estación no encontrada para resolver el precio vigente'), { statusCode: 404 });
        }

        const precio = await prisma.precioVigente.findFirst({
            where: {
                zonaId: estacion.zonaId,
                tipoCombustible: input.tipoCombustible,
                tipoServicio: input.tipoServicio,
                activo: true,
                vigenciaDesde: { lte: fecha },
                OR: [{ vigenciaHasta: null }, { vigenciaHasta: { gte: fecha } }],
            },
            include: {
                decreto: { select: { id: true, numero: true, titulo: true, fechaVigencia: true } },
                zona: { select: { id: true, nombre: true, tipoZona: true } },
            },
            orderBy: { vigenciaDesde: 'desc' },
        });

        if (!precio) {
            throw Object.assign(new Error('No existe un precio vigente para la combinación seleccionada en esta zona'), { statusCode: 404 });
        }

        const precioUnitario = Number(precio.precioGalon);
        const subsidioGalon = Number(precio.subsidioGalon);

        return {
            precioId: precio.id,
            zonaId: precio.zonaId,
            zona: precio.zona,
            precioUnitario,
            subsidioGalon,
            subsidioAplicado: subsidioGalon > 0,
            decretoAplicado: precio.decreto.numero,
            decreto: precio.decreto,
            vigenciaDesde: precio.vigenciaDesde,
            vigenciaHasta: precio.vigenciaHasta,
        };
    }
}

export const pricingEngineService = new PricingEngineService();