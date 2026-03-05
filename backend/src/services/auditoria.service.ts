import { prisma } from '../utils/prisma';

interface RegistrarLogInput {
    usuarioId: string;
    modulo: string;
    accion: string;
    entidad: string;
    entidadId?: string;
    datosAntes?: any;
    datosDespues?: any;
    ip?: string;
    userAgent?: string;
}

export class AuditoriaService {
    /**
     * Registra un evento de auditoria en la base de datos.
     */
    async registrarLog(data: RegistrarLogInput) {
        return prisma.auditoriaLog.create({
            data: {
                usuarioId: data.usuarioId,
                modulo: data.modulo,
                accion: data.accion,
                entidad: data.entidad,
                entidadId: data.entidadId,
                datosAntes: data.datosAntes ?? undefined,
                datosDespues: data.datosDespues ?? undefined,
                ip: data.ip,
                userAgent: data.userAgent,
            }
        });
    }

    /**
     * Obtiene logs de auditoria con filtros opcionales.
     */
    async obtenerLogs(filtros?: {
        usuarioId?: string;
        modulo?: string;
        accion?: string;
        entidad?: string;
        desde?: string;
        hasta?: string;
        page?: number;
        limit?: number;
    }) {
        const where: any = {};
        if (filtros?.usuarioId) where.usuarioId = filtros.usuarioId;
        if (filtros?.modulo) where.modulo = filtros.modulo;
        if (filtros?.accion) where.accion = filtros.accion;
        if (filtros?.entidad) where.entidad = filtros.entidad;

        if (filtros?.desde || filtros?.hasta) {
            where.createdAt = {};
            if (filtros?.desde) where.createdAt.gte = new Date(filtros.desde);
            if (filtros?.hasta) where.createdAt.lte = new Date(filtros.hasta);
        }

        const page = filtros?.page ?? 1;
        const limit = filtros?.limit ?? 50;
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            prisma.auditoriaLog.findMany({
                where,
                include: {
                    usuario: { select: { id: true, email: true, nombre: true, apellido: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.auditoriaLog.count({ where })
        ]);

        return {
            data: logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Obtiene un log de auditoria por ID.
     */
    async obtenerLogPorId(id: string) {
        const log = await prisma.auditoriaLog.findUnique({
            where: { id },
            include: { usuario: { select: { id: true, email: true, nombre: true, apellido: true } } }
        });
        if (!log) throw new Error('Log de auditoria no encontrado');
        return log;
    }
}

export const auditoriaService = new AuditoriaService();
