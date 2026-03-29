import { prisma } from '../utils/prisma';
import { CrearDecretoInput, ActualizarDecretoInput } from '../validators/decreto.validator';
import { auditoriaService } from './auditoria.service';

interface AuditoriaMetadata {
    usuarioId: string;
    ip: string;
    userAgent?: string;
}

export class DecretoService {
    async obtenerDecretos() {
        return prisma.decretoNormativo.findMany({
            include: { _count: { select: { precios: true } } },
            orderBy: { fechaExpedicion: 'desc' }
        });
    }

    async obtenerDecretoPorId(id: string) {
        const decreto = await prisma.decretoNormativo.findUnique({
            where: { id },
            include: { precios: { where: { activo: true } } }
        });
        if (!decreto) throw new Error('Decreto no encontrado');
        return decreto;
    }

    async crearDecreto(data: CrearDecretoInput, meta?: AuditoriaMetadata) {
        const existe = await prisma.decretoNormativo.findUnique({ where: { numero: data.numero } });
        if (existe) throw new Error('Ya existe un decreto con este numero');

        const decreto = await prisma.decretoNormativo.create({
            data: {
                numero: data.numero,
                titulo: data.titulo,
                descripcion: data.descripcion,
                entidad: data.entidad,
                fechaExpedicion: new Date(data.fechaExpedicion),
                fechaVigencia: new Date(data.fechaVigencia),
                documentoUrl: data.documentoUrl,
            }
        });

        if (meta) {
            await auditoriaService.registrarLog({
                usuarioId: meta.usuarioId,
                modulo: 'DECRETOS',
                accion: 'CREAR_DECRETO',
                entidad: 'decreto_normativo',
                entidadId: decreto.id,
                ip: meta.ip,
                userAgent: meta.userAgent,
                datosDespues: { numero: decreto.numero, titulo: decreto.titulo }
            });
        }

        return decreto;
    }

    async actualizarDecreto(id: string, data: ActualizarDecretoInput, meta?: AuditoriaMetadata) {
        const existe = await prisma.decretoNormativo.findUnique({ where: { id } });
        if (!existe) throw new Error('Decreto no encontrado');

        if (data.numero && data.numero !== existe.numero) {
            const dup = await prisma.decretoNormativo.findUnique({ where: { numero: data.numero } });
            if (dup) throw new Error('Ya existe un decreto con este numero');
        }

        const updateData: any = { ...data };
        if (data.fechaExpedicion) updateData.fechaExpedicion = new Date(data.fechaExpedicion);
        if (data.fechaVigencia) updateData.fechaVigencia = new Date(data.fechaVigencia);

        const decreto = await prisma.decretoNormativo.update({ where: { id }, data: updateData });

        if (meta) {
            await auditoriaService.registrarLog({
                usuarioId: meta.usuarioId,
                modulo: 'DECRETOS',
                accion: 'ACTUALIZAR_DECRETO',
                entidad: 'decreto_normativo',
                entidadId: id,
                ip: meta.ip,
                userAgent: meta.userAgent,
                datosAntes: existe,
                datosDespues: { cambios: Object.keys(data) }
            });
        }

        return decreto;
    }
}

export const decretoService = new DecretoService();
