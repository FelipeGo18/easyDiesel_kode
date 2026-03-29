import { prisma } from '../utils/prisma';
import { CrearZonaInput, ActualizarZonaInput } from '../validators/zona.validator';
import { auditoriaService } from './auditoria.service';

interface AuditoriaMetadata {
    usuarioId: string;
    ip: string;
    userAgent?: string;
}

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

    async crearZona(data: CrearZonaInput, meta?: AuditoriaMetadata) {
        const existe = await prisma.zonaDistribucion.findUnique({ where: { nombre: data.nombre } });
        if (existe) throw new Error('Ya existe una zona con este nombre');

        const zona = await prisma.zonaDistribucion.create({ data });

        if (meta) {
            await auditoriaService.registrarLog({
                usuarioId: meta.usuarioId,
                modulo: 'ZONAS',
                accion: 'CREAR_ZONA',
                entidad: 'zona_distribucion',
                entidadId: zona.id,
                ip: meta.ip,
                userAgent: meta.userAgent,
                datosDespues: { nombre: zona.nombre, tipo: zona.tipoZona }
            });
        }

        return zona;
    }

    async actualizarZona(id: string, data: ActualizarZonaInput, meta?: AuditoriaMetadata) {
        const existe = await prisma.zonaDistribucion.findUnique({ where: { id } });
        if (!existe) throw new Error('Zona no encontrada');

        if (data.nombre && data.nombre !== existe.nombre) {
            const duplicada = await prisma.zonaDistribucion.findUnique({ where: { nombre: data.nombre } });
            if (duplicada) throw new Error('Ya existe una zona con este nombre');
        }

        const zona = await prisma.zonaDistribucion.update({ where: { id }, data });

        if (meta) {
            await auditoriaService.registrarLog({
                usuarioId: meta.usuarioId,
                modulo: 'ZONAS',
                accion: 'ACTUALIZAR_ZONA',
                entidad: 'zona_distribucion',
                entidadId: id,
                ip: meta.ip,
                userAgent: meta.userAgent,
                datosAntes: existe,
                datosDespues: { cambios: Object.keys(data) }
            });
        }

        return zona;
    }
}

export const zonaService = new ZonaService();
