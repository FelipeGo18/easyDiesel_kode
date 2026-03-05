import { prisma } from '../utils/prisma';
import { CrearZonaInput, ActualizarZonaInput } from '../validators/zona.validator';

export class ZonaService {
    async obtenerZonas() {
        return prisma.zonaDistribucion.findMany({
            include: { _count: { select: { estaciones: true, precios: true } } },
            orderBy: { nombre: 'asc' }
        });
    }

    async obtenerZonaPorId(id: string) {
        const zona = await prisma.zonaDistribucion.findUnique({
            where: { id },
            include: {
                estaciones: { select: { id: true, nombre: true, ciudad: true } },
                precios: { where: { activo: true } }
            }
        });
        if (!zona) throw new Error('Zona no encontrada');
        return zona;
    }

    async crearZona(data: CrearZonaInput) {
        const existe = await prisma.zonaDistribucion.findUnique({ where: { nombre: data.nombre } });
        if (existe) throw new Error('Ya existe una zona con este nombre');

        return prisma.zonaDistribucion.create({ data });
    }

    async actualizarZona(id: string, data: ActualizarZonaInput) {
        const existe = await prisma.zonaDistribucion.findUnique({ where: { id } });
        if (!existe) throw new Error('Zona no encontrada');

        if (data.nombre && data.nombre !== existe.nombre) {
            const duplicada = await prisma.zonaDistribucion.findUnique({ where: { nombre: data.nombre } });
            if (duplicada) throw new Error('Ya existe una zona con este nombre');
        }

        return prisma.zonaDistribucion.update({ where: { id }, data });
    }
}

export const zonaService = new ZonaService();
