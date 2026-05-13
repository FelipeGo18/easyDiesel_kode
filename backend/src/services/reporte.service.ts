import { prisma } from '../utils/prisma';
import { GenerarReporteInput } from '../validators/reporte.validator';
import { generarPDF } from '../utils/pdfGenerator';
import { generarExcel, generarCSV } from '../utils/excelGenerator';
import { auditoriaService } from './auditoria.service';

export class ReporteService {
    /**
     * Genera un registro de reporte y recopila los datos segun el tipo,
     * devolviendo el archivo generado en Buffer.
     */
    async generarReporte(data: GenerarReporteInput, usuarioId: string, options?: { ip?: string; userAgent?: string }) {
        // 1. Crear el registro del reporte
        const reporte = await prisma.reporte.create({
            data: {
                tipo: data.tipo,
                formato: data.formato,
                periodoInicio: new Date(data.periodoInicio),
                periodoFin: new Date(data.periodoFin),
                parametros: data.parametros ?? {},
                generadoPor: usuarioId,
            }
        });

        // 2. Registro de Auditoría
        await auditoriaService.registrarLog({
            usuarioId,
            modulo: 'REPORTES',
            accion: 'GENERAR_REPORTE',
            entidad: 'reporte',
            entidadId: reporte.id,
            ip: options?.ip,
            userAgent: options?.userAgent,
            datosDespues: { tipo: data.tipo, formato: data.formato }
        });

        // 2. Recopilar datos segun el tipo
        let contenido: any[] = [];

        switch (data.tipo) {
            case 'INVENTARIO':
                contenido = await this.datosInventario(data.parametros);
                break;
            case 'TRANSACCIONES':
                contenido = await this.datosTransacciones({ 
                    ...data.parametros, 
                    fechaDesde: data.periodoInicio, 
                    fechaHasta: data.periodoFin 
                });
                break;
            case 'PRECIOS':
                contenido = await this.datosPrecios(data.parametros);
                break;
            case 'AUDITORIA':
                contenido = await this.datosAuditoria({ 
                    ...data.parametros, 
                    fechaDesde: data.periodoInicio, 
                    fechaHasta: data.periodoFin 
                });
                break;
            case 'NORMATIVO':
                contenido = await this.datosNormativo();
                break;
        }

        // 3. Generar el archivo fisico
        const titulo = `Reporte de ${data.tipo}`;
        let fileBuffer: Buffer;

        switch (data.formato) {
            case 'EXCEL':
                fileBuffer = await generarExcel(titulo, contenido);
                break;
            case 'CSV':
                fileBuffer = await generarCSV(titulo, contenido);
                break;
            case 'PDF':
            default:
                fileBuffer = await generarPDF(titulo, contenido);
                break;
        }

        return { reporte, fileBuffer };
    }

    /**
     * Lista todos los reportes generados.
     */
    async obtenerReportes(page = 1, limit = 20, usuarioId?: string) {
        const skip = (page - 1) * limit;
        const where: any = {};
        if (usuarioId) where.generadoPor = usuarioId;

        const [reportes, total] = await Promise.all([
            prisma.reporte.findMany({
                where,
                include: { usuario: { select: { nombre: true, email: true } } },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.reporte.count({ where })
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
        if (params?.estacionId) {
            where.estacionId = params.estacionId;
        }

        if (params?.tipoCombustible) {
            where.tipoCombustible = params.tipoCombustible;
        }

        if (params?.fechaDesde) {
            where.createdAt = {
                ...where.createdAt,
                gte: new Date(params.fechaDesde)
            };
        }

        if (params?.fechaHasta) {
            const fechaHasta = new Date(params.fechaHasta);
            fechaHasta.setHours(23, 59, 59, 999);
            where.createdAt = {
                ...where.createdAt,
                lte: fechaHasta
            };
        }

        const data = await prisma.transaccionCombustible.findMany({
            where,
            include: {
                estacion: { select: { nombre: true } },
                tanque: { select: { nombre: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 500
        });

        return data.map(t => ({
            fecha: t.createdAt,
            estacion: t.estacion?.nombre || '—',
            tanque: t.tanque?.nombre || '—',
            tipo: t.tipo,
            combustible: t.tipoCombustible,
            servicio: t.tipoServicio,
            galones: Number(t.galones),
            placa: t.placaVehiculo || '—',
            precioUnit: Number(t.precioUnitario),
            total: Number(t.precioTotal),
        }));
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

        if (params?.estacionId) {
            where.usuario = {
                estacionGestionada: {
                    id: params.estacionId
                }
            };
        }

        if (params?.fechaDesde) {
            where.createdAt = {
                ...where.createdAt,
                gte: new Date(params.fechaDesde)
            };
        }

        if (params?.fechaHasta) {
            const fechaHasta = new Date(params.fechaHasta);
            fechaHasta.setHours(23, 59, 59, 999);
            where.createdAt = {
                ...where.createdAt,
                lte: fechaHasta
            };
        }

        if (params?.usuarioId) {
            where.usuarioId = params.usuarioId;
        }

        if (params?.modulo) {
            where.modulo = params.modulo;
        }

        if (params?.entidad) {
            where.entidad = params.entidad;
        }

        if (params?.accion) {
            where.accion = params.accion;
        }

        return prisma.auditoriaLog.findMany({
            where,
            include: { usuario: { select: { email: true, nombre: true } } },
            orderBy: { createdAt: 'desc' },
            take: 500
        });
    }

    private async datosNormativo() {
        const decretos = await prisma.decretoNormativo.findMany({
            where: { activo: true },
            select: {
                id: true,
                numero: true,
                titulo: true,
                fechaExpedicion: true,
                fechaPublicacion: true,
                activo: true,
                precios: {
                    where: { activo: true },
                    select: {
                        id: true,
                        tipoCombustible: true,
                        tipoServicio: true,
                        precioUnitario: true,
                        zona: { select: { nombre: true } }
                    }
                },
            },
            orderBy: { fechaExpedicion: 'desc' },
        });

        // Aplanar: una fila por decreto × precio vigente, para que el generador PDF
        // pueda construir una tabla legible sin manejar arrays anidados.
        const rows: Record<string, string | number | null>[] = [];

        for (const d of decretos) {
            if (d.precios.length === 0) {
                rows.push({
                    decreto: d.numero,
                    titulo: d.titulo,
                    entidad: d.entidad ?? '—',
                    expedicion: d.fechaExpedicion.toLocaleDateString('es-CO'),
                    vigenciaDesde: d.fechaVigencia.toLocaleDateString('es-CO'),
                    zona: '—',
                    combustible: '—',
                    tipoServicio: '—',
                    precioGalon: null,
                    subsidioGalon: null,
                });
            } else {
                for (const p of d.precios) {
                    rows.push({
                        decreto: d.numero,
                        titulo: d.titulo,
                        entidad: d.entidad ?? '—',
                        expedicion: d.fechaExpedicion.toLocaleDateString('es-CO'),
                        vigenciaDesde: d.fechaVigencia.toLocaleDateString('es-CO'),
                        zona: p.zona.nombre,
                        combustible: p.tipoCombustible,
                        tipoServicio: p.tipoServicio,
                        precioGalon: Number(p.precioGalon),
                        subsidioGalon: Number(p.subsidioGalon),
                    });
                }
            }
        }

        return rows;
    }
}

export const reporteService = new ReporteService();
