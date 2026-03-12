import { prisma } from '../utils/prisma';

interface ResolveFuelPriceInput {
    estacionId: string;
    tipoCombustible: 'ACPM' | 'GASOLINA_CORRIENTE' | 'GASOLINA_EXTRA';
    tipoServicio: 'PARTICULAR' | 'PUBLICO' | 'DIPLOMATICO' | 'OFICIAL' | 'CARGA';
    fecha?: Date;
    /**
     * Gran Consumidor (Decreto 763/2024): distribuidores REGULADO con consumo >20.000 gal/mes.
     * Cuando es true y el combustible es ACPM, se aplica precio de paridad internacional
     * (tipoServicio=PARTICULAR), excepto en zonas no interconectadas (ZNI).
     */
    esGranConsumidor?: boolean;
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

        // Decreto 763/2024: Gran Consumidor de ACPM en zona interconectada paga
        // precio de paridad internacional (tipoServicio=PARTICULAR).
        const esZonaNI = estacion.zona.tipoZona === 'NO_INTERCONECTADA';
        const tipoServicioEfectivo =
            input.esGranConsumidor && input.tipoCombustible === 'ACPM' && !esZonaNI
                ? 'PARTICULAR'
                : input.tipoServicio;

        const precio = await prisma.precioVigente.findFirst({
            where: {
                zonaId: estacion.zonaId,
                tipoCombustible: input.tipoCombustible,
                tipoServicio: tipoServicioEfectivo,
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
        const granConsumidorAplicado = !!(input.esGranConsumidor && input.tipoCombustible === 'ACPM' && !esZonaNI);

        return {
            precioId: precio.id,
            zonaId: precio.zonaId,
            zona: precio.zona,
            precioUnitario,
            subsidioGalon,
            subsidioAplicado: subsidioGalon > 0,
            decretoAplicado: granConsumidorAplicado ? '763/2024' : precio.decreto.numero,
            decreto: precio.decreto,
            granConsumidorAplicado,
            vigenciaDesde: precio.vigenciaDesde,
            vigenciaHasta: precio.vigenciaHasta,
        };
    }
}

export const pricingEngineService = new PricingEngineService();