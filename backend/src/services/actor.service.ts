import { prisma } from '../utils/prisma';
import {
    CrearEstacionInput,
    ActualizarEstacionInput,
    CrearDistribuidorInput,
    ActualizarDistribuidorInput
} from '../validators/actor.validator';
import { auditoriaService } from './auditoria.service';

interface AuditoriaMetadata {
    usuarioId: string;
    ip: string;
    userAgent?: string;
}

export class ActorService {
    // ==========================================
    // ESTACIONES DE SERVICIO
    // ==========================================

    async obtenerEstaciones(opts?: { search?: string; page?: number; limit?: number }) {
        const page = Math.max(1, opts?.page ?? 1);
        const limit = Math.min(200, Math.max(1, opts?.limit ?? 100));
        const skip = (page - 1) * limit;

        const where: any = {};
        if (opts?.search?.trim()) {
            const q = opts.search.trim();
            where.OR = [
                { nombre: { contains: q, mode: 'insensitive' } },
                { nit: { contains: q, mode: 'insensitive' } },
                { ciudad: { contains: q, mode: 'insensitive' } },
                { codigoSicom: { contains: q, mode: 'insensitive' } },
            ];
        }

        const [data, total] = await Promise.all([
            prisma.estacionServicio.findMany({
                where,
                include: {
                    zona: true,
                    distribuidor: { select: { id: true, nombre: true } },
                    usuario: { select: { id: true, nombre: true, email: true } },
                    tanques: true,
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.estacionServicio.count({ where }),
        ]);

        return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    async obtenerEstacionPorId(id: string) {
        const estacion = await prisma.estacionServicio.findUnique({
            where: { id },
            include: { 
                zona: true, 
                tanques: true,
                usuario: { select: { id: true, nombre: true, email: true } }
            },
        });
        if (!estacion) throw new Error('Estación no encontrada');
        return estacion;
    }

    async crearEstacion(data: CrearEstacionInput, meta?: AuditoriaMetadata) {
        const existeNit = await prisma.estacionServicio.findUnique({ where: { nit: data.nit } });
        if (existeNit) throw new Error('Ya existe una estación con este NIT');

        const existeSicom = await prisma.estacionServicio.findUnique({ where: { codigoSicom: data.codigoSicom } });
        if (existeSicom) throw new Error('Ya existe una estación con este Código SICOM');

        const existeUsuario = await prisma.estacionServicio.findUnique({ where: { usuarioId: data.usuarioId } });
        if (existeUsuario) throw new Error('Este usuario ya está asignado a otra estación');

        const estacion = await prisma.estacionServicio.create({
            data: {
                nombre: data.nombre,
                nit: data.nit,
                direccion: data.direccion,
                ciudad: data.ciudad,
                departamento: data.departamento,
                codigoSicom: data.codigoSicom,
                latitud: data.latitud ?? null,
                longitud: data.longitud ?? null,
                zona: { connect: { id: data.zonaId } },
                usuario: { connect: { id: data.usuarioId } },
                ...(data.distribuidorId && { distribuidor: { connect: { id: data.distribuidorId } } }),
            },
            include: { zona: true, usuario: true, distribuidor: true }
        });

        if (meta) {
            await auditoriaService.registrarLog({
                usuarioId: meta.usuarioId,
                modulo: 'ACTORES',
                accion: 'CREAR_ESTACION',
                entidad: 'estacion_servicio',
                entidadId: estacion.id,
                ip: meta.ip,
                userAgent: meta.userAgent,
                datosDespues: { nombre: estacion.nombre, nit: estacion.nit, sicom: estacion.codigoSicom }
            });
        }

        return estacion;
    }

    async actualizarZonaEstacion(estacionId: string, zonaId: string, meta?: AuditoriaMetadata) {
        const existe = await prisma.estacionServicio.findUnique({ where: { id: estacionId } });
        if (!existe) throw new Error('Estación no encontrada');

        const zona = await prisma.zonaDistribucion.findUnique({ where: { id: zonaId } });
        if (!zona) throw new Error('Zona no encontrada');

        const estacion = await prisma.estacionServicio.update({
            where: { id: estacionId },
            data: { zona: { connect: { id: zonaId } } },
            include: { zona: true },
        });

        if (meta) {
            await auditoriaService.registrarLog({
                usuarioId: meta.usuarioId,
                modulo: 'ACTORES',
                accion: 'ACTUALIZAR_ZONA_ESTACION',
                entidad: 'estacion_servicio',
                entidadId: estacionId,
                ip: meta.ip,
                userAgent: meta.userAgent,
                datosAntes: { zonaId: existe.zonaId },
                datosDespues: { zonaId: zona.id, zonaNombre: zona.nombre }
            });
        }

        return estacion;
    }

    async actualizarEstacion(id: string, data: ActualizarEstacionInput, meta?: AuditoriaMetadata) {
        const existe = await prisma.estacionServicio.findUnique({ where: { id } });
        if (!existe) throw new Error('Estación no encontrada');

        if (data.nit && data.nit !== existe.nit) {
            const existeNit = await prisma.estacionServicio.findUnique({ where: { nit: data.nit } });
            if (existeNit) throw new Error('El nuevo NIT ya está registrado');
        }

        if (data.codigoSicom && data.codigoSicom !== existe.codigoSicom) {
            const existeSicom = await prisma.estacionServicio.findUnique({ where: { codigoSicom: data.codigoSicom } });
            if (existeSicom) throw new Error('El nuevo Código SICOM ya está registrado');
        }

        const { zonaId, distribuidorId, usuarioId, ...updateData } = data;
        const updatePayload: any = { ...updateData };

        if (zonaId) {
            updatePayload.zona = { connect: { id: zonaId } };
        }

        if (usuarioId) {
            updatePayload.usuario = { connect: { id: usuarioId } };
        }

        if (distribuidorId !== undefined) {
            if (distribuidorId) {
                updatePayload.distribuidor = { connect: { id: distribuidorId } };
            } else {
                updatePayload.distribuidor = { disconnect: true };
            }
        }

        const estacion = await prisma.estacionServicio.update({
            where: { id },
            data: updatePayload,
            include: { zona: true, distribuidor: true }
        });

        if (meta) {
            await auditoriaService.registrarLog({
                usuarioId: meta.usuarioId,
                modulo: 'ACTORES',
                accion: 'ACTUALIZAR_ESTACION',
                entidad: 'estacion_servicio',
                entidadId: id,
                ip: meta.ip,
                userAgent: meta.userAgent,
                datosAntes: existe,
                datosDespues: { cambios: Object.keys(data) }
            });
        }

        return estacion;
    }

    // ==========================================
    // DISTRIBUIDORES
    // ==========================================

    async obtenerDistribuidores(opts?: { search?: string; page?: number; limit?: number }) {
        const page = Math.max(1, opts?.page ?? 1);
        const limit = Math.min(200, Math.max(1, opts?.limit ?? 100));
        const skip = (page - 1) * limit;

        const where: any = {};
        if (opts?.search?.trim()) {
            const q = opts.search.trim();
            where.OR = [
                { nombre: { contains: q, mode: 'insensitive' } },
                { nit: { contains: q, mode: 'insensitive' } },
                { ciudad: { contains: q, mode: 'insensitive' } },
            ];
        }

        const [data, total] = await Promise.all([
            prisma.distribuidor.findMany({
                where,
                include: {
                    usuario: { select: { id: true, nombre: true, email: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.distribuidor.count({ where }),
        ]);

        return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    async obtenerDistribuidorPorId(id: string) {
        const distribuidor = await prisma.distribuidor.findUnique({
            where: { id },
            include: {
                usuario: { select: { id: true, nombre: true, email: true } }
            }
        });
        if (!distribuidor) throw new Error('Distribuidor no encontrado');
        return distribuidor;
    }

    async crearDistribuidor(data: CrearDistribuidorInput, meta?: AuditoriaMetadata) {
        const existeNit = await prisma.distribuidor.findUnique({ where: { nit: data.nit } });
        if (existeNit) throw new Error('Ya existe un distribuidor con este NIT');

        const existeUsuario = await prisma.distribuidor.findUnique({ where: { usuarioId: data.usuarioId } });
        if (existeUsuario) throw new Error('Este usuario ya está asignado a otro distribuidor');

        const distribuidor = await prisma.distribuidor.create({
            data: {
                nombre: data.nombre,
                nit: data.nit,
                tipo: data.tipo,
                direccion: data.direccion,
                ciudad: data.ciudad,
                departamento: data.departamento,
                usuario: { connect: { id: data.usuarioId } },
            },
            include: { usuario: true }
        });

        if (meta) {
            await auditoriaService.registrarLog({
                usuarioId: meta.usuarioId,
                modulo: 'ACTORES',
                accion: 'CREAR_DISTRIBUIDOR',
                entidad: 'distribuidor',
                entidadId: distribuidor.id,
                ip: meta.ip,
                userAgent: meta.userAgent,
                datosDespues: { nombre: distribuidor.nombre, nit: distribuidor.nit, tipo: distribuidor.tipo }
            });
        }

        return distribuidor;
    }

    async actualizarDistribuidor(id: string, data: ActualizarDistribuidorInput, meta?: AuditoriaMetadata) {
        const existe = await prisma.distribuidor.findUnique({ where: { id } });
        if (!existe) throw new Error('Distribuidor no encontrado');

        if (data.nit && data.nit !== existe.nit) {
            const existeNit = await prisma.distribuidor.findUnique({ where: { nit: data.nit } });
            if (existeNit) throw new Error('El nuevo NIT ya está registrado');
        }

        const { usuarioId, ...updateData } = data;
        const updatePayload: any = { ...updateData };

        if (usuarioId) {
            updatePayload.usuario = { connect: { id: usuarioId } };
        }

        const distribuidor = await prisma.distribuidor.update({
            where: { id },
            data: updatePayload,
            include: { usuario: true }
        });

        if (meta) {
            await auditoriaService.registrarLog({
                usuarioId: meta.usuarioId,
                modulo: 'ACTORES',
                accion: 'ACTUALIZAR_DISTRIBUIDOR',
                entidad: 'distribuidor',
                entidadId: id,
                ip: meta.ip,
                userAgent: meta.userAgent,
                datosAntes: existe,
                datosDespues: { cambios: Object.keys(data) }
            });
        }

        return distribuidor;
    }
}

export const actorService = new ActorService();
