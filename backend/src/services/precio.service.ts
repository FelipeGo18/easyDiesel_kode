import { prisma } from '../utils/prisma';
import { CrearPrecioInput, ActualizarPrecioInput } from '../validators/precio.validator';
import { auditoriaService } from './auditoria.service';

interface AuditoriaMetadata {
    usuarioId: string;
    ip: string;
    userAgent?: string;
}

export class PrecioService {
    /**
     * Obtener precios vigentes, opcionalmente filtrando por zona y tipo de combustible.
     */
    async obtenerPrecios(filtros?: { zonaId?: string; tipoCombustible?: string; soloActivos?: boolean }) {
        const where: any = {};
        if (filtros?.zonaId) where.zonaId = filtros.zonaId;
        if (filtros?.tipoCombustible) where.tipoCombustible = filtros.tipoCombustible;
        if (filtros?.soloActivos !== false) where.activo = true; // por defecto solo activos

        return prisma.precioVigente.findMany({
            where,
            include: {
                zona: { select: { nombre: true, tipoZona: true } },
                decreto: { select: { numero: true, titulo: true } }
            },
            orderBy: { vigenciaDesde: 'desc' }
        });
    }

    async obtenerPrecioPorId(id: string) {
        const precio = await prisma.precioVigente.findUnique({
            where: { id },
            include: { zona: true, decreto: true }
        });
        if (!precio) throw new Error('Precio no encontrado');
        return precio;
    }

    /**
     * Crear un nuevo precio vigente. 
     * Desactiva automáticamente el precio anterior para la misma combinación
     * (tipoCombustible + tipoServicio + zona).
     */
    async crearPrecio(data: CrearPrecioInput, meta?: AuditoriaMetadata) {
        // Validar que la zona y el decreto existan
        const zona = await prisma.zonaDistribucion.findUnique({ where: { id: data.zonaId } });
        if (!zona) throw new Error('Zona no encontrada');

        const decreto = await prisma.decretoNormativo.findUnique({ where: { id: data.decretoId } });
        if (!decreto) throw new Error('Decreto no encontrado');

        // Transacción: desactivar precio anterior + crear nuevo
        const nuevoPrecio = await prisma.$transaction(async (tx: any) => {
            // Desactivar precio(s) anterior(es) para la misma combinación
            await tx.precioVigente.updateMany({
                where: {
                    tipoCombustible: data.tipoCombustible,
                    tipoServicio: data.tipoServicio,
                    zonaId: data.zonaId,
                    activo: true
                },
                data: {
                    activo: false,
                    vigenciaHasta: new Date(data.vigenciaDesde) // cierra con la fecha del nuevo
                }
            });

            // Crear nuevo precio vigente
            return tx.precioVigente.create({
                data: {
                    tipoCombustible: data.tipoCombustible,
                    tipoServicio: data.tipoServicio,
                    zonaId: data.zonaId,
                    precioGalon: data.precioGalon,
                    subsidioGalon: data.subsidioGalon,
                    decretoId: data.decretoId,
                    vigenciaDesde: new Date(data.vigenciaDesde),
                    vigenciaHasta: data.vigenciaHasta ? new Date(data.vigenciaHasta) : null,
                    activo: true
                },
                include: { zona: true, decreto: true }
            });
        });

        // Registro de Auditoría
        if (meta) {
            await auditoriaService.registrarLog({
                usuarioId: meta.usuarioId,
                modulo: 'PRECIOS',
                accion: 'CREAR_PRECIO',
                entidad: 'precio_vigente',
                entidadId: nuevoPrecio.id,
                ip: meta.ip,
                userAgent: meta.userAgent,
                datosDespues: {
                    zona: zona.nombre,
                    combustible: data.tipoCombustible,
                    precio: data.precioGalon
                }
            });
        }

        return nuevoPrecio;
    }

    /**
     * Actualizar un precio existente.
     */
    async actualizarPrecio(id: string, data: ActualizarPrecioInput, meta?: AuditoriaMetadata) {
        const existe = await prisma.precioVigente.findUnique({ where: { id }, include: { zona: true } });
        if (!existe) throw new Error('Precio no encontrado');

        const updateData: any = { ...data };
        if (data.vigenciaDesde) updateData.vigenciaDesde = new Date(data.vigenciaDesde);
        if (data.vigenciaHasta) updateData.vigenciaHasta = new Date(data.vigenciaHasta);

        const precio = await prisma.precioVigente.update({
            where: { id },
            data: updateData,
            include: { zona: true, decreto: true }
        });

        // Registro de Auditoría
        if (meta) {
            await auditoriaService.registrarLog({
                usuarioId: meta.usuarioId,
                modulo: 'PRECIOS',
                accion: 'ACTUALIZAR_PRECIO',
                entidad: 'precio_vigente',
                entidadId: id,
                ip: meta.ip,
                userAgent: meta.userAgent,
                datosAntes: existe,
                datosDespues: {
                    zona: existe.zona.nombre,
                    cambios: Object.keys(data)
                }
            });
        }

        return precio;
    }

    /**
     * Consulta publica: obtener el precio actual de un combustible para una zona.
     */
    async consultarPrecioActual(tipoCombustible: string, tipoServicio: string, zonaId: string) {
        const precio = await prisma.precioVigente.findFirst({
            where: {
                tipoCombustible: tipoCombustible as any,
                tipoServicio: tipoServicio as any,
                zonaId,
                activo: true
            },
            include: {
                zona: { select: { nombre: true } },
                decreto: { select: { numero: true, titulo: true } }
            }
        });

        if (!precio) throw new Error('No hay precio vigente para esa combinacion');
        return precio;
    }
}

export const precioService = new PrecioService();
