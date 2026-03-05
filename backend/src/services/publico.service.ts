import { prisma } from '../utils/prisma';

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
    async getEstaciones() {
        return await prisma.estacionServicio.findMany({
            where: { activa: true },
            select: {
                id: true,
                nombre: true,
                direccion: true,
                ciudad: true,
                departamento: true,
                codigoSicom: true,
                latitud: true,
                longitud: true,
                zona: { select: { nombre: true } }
            }
        });
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
                departamentos: true
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
}

export const publicoService = new PublicoService();
