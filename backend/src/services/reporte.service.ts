import { prisma } from '../utils/prisma';
import { GenerarReporteInput } from '../validators/reporte.validator';

export class ReporteService {
    /**
     * Genera un registro de reporte y recopila los datos segun el tipo.
     */
    async generarReporte(data: GenerarReporteInput, usuarioId: string) {
        // 1. Crear el registro del reporte
        const reporte = await prisma.reporte.create({
            data: {
                tipo: data.tipo,
                formato: data.formato,
                parametros: data.parametros ?? {},
                generadoPor: usuarioId,
            }
        });

        // 2. Recopilar datos segun el tipo
        let contenido: any;

        switch (data.tipo) {
            case 'INVENTARIO':
                contenido = await this.datosInventario(data.parametros);
                break;
            case 'TRANSACCIONES':
                contenido = await this.datosTransacciones(data.parametros);
                break;
            case 'PRECIOS':
                contenido = await this.datosPrecios(data.parametros);
                break;
            case 'AUDITORIA':
                contenido = await this.datosAuditoria(data.parametros);
                break;
            case 'NORMATIVO':
                contenido = await this.datosNormativo();
                break;
        }

        return { reporte, contenido };
    }

    /**
     * Lista todos los reportes generados.
     */
    async obtenerReportes(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [reportes, total] = await Promise.all([
            prisma.reporte.findMany({
                include: { usuario: { select: { nombre: true, apellido: true, email: true } } },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.reporte.count()
        ]);

        return {
            data: reportes,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        };
    }

    // ---- Recopiladores de datos internos ----

    private async datosInventario(params?: any) {
        const where: any = {};
        if (params?.estacionId) where.estacionId = params.estacionId;
        if (params?.tipoCombustible) where.tipoCombustible = params.tipoCombustible;

        return prisma.tanque.findMany({
            where,
            include: { estacion: { select: { nombre: true, ciudad: true } } },
            orderBy: { nombre: 'asc' }
        });
    }

    private async datosTransacciones(params?: any) {
        const where: any = {};
        if (params?.estacionId) where.estacionId = params.estacionId;
        if (params?.tipoCombustible) where.tipoCombustible = params.tipoCombustible;
        if (params?.fechaDesde || params?.fechaHasta) {
            where.createdAt = {};
            if (params?.fechaDesde) where.createdAt.gte = new Date(params.fechaDesde);
            if (params?.fechaHasta) where.createdAt.lte = new Date(params.fechaHasta);
        }

        return prisma.transaccionCombustible.findMany({
            where,
            include: {
                estacion: { select: { nombre: true } },
                tanque: { select: { nombre: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 500 // Limitar resultados
        });
    }

    private async datosPrecios(params?: any) {
        const where: any = {};
        if (params?.zonaId) where.zonaId = params.zonaId;
        if (params?.tipoCombustible) where.tipoCombustible = params.tipoCombustible;

        return prisma.precioVigente.findMany({
            where,
            include: {
                zona: { select: { nombre: true } },
                decreto: { select: { numero: true, titulo: true } }
            },
            orderBy: { vigenciaDesde: 'desc' }
        });
    }

    private async datosAuditoria(params?: any) {
        const where: any = {};
        if (params?.fechaDesde || params?.fechaHasta) {
            where.createdAt = {};
            if (params?.fechaDesde) where.createdAt.gte = new Date(params.fechaDesde);
            if (params?.fechaHasta) where.createdAt.lte = new Date(params.fechaHasta);
        }

        return prisma.auditoriaLog.findMany({
            where,
            include: { usuario: { select: { email: true, nombre: true } } },
            orderBy: { createdAt: 'desc' },
            take: 500
        });
    }

    private async datosNormativo() {
        return prisma.decretoNormativo.findMany({
            where: { activo: true },
            include: { precios: { where: { activo: true } } },
            orderBy: { fechaExpedicion: 'desc' }
        });
    }
}

export const reporteService = new ReporteService();
