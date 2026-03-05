import { prisma } from '../utils/prisma';
import {
    CrearEstacionInput,
    ActualizarEstacionInput,
    CrearDistribuidorInput,
    ActualizarDistribuidorInput
} from '../validators/actor.validator';

export class ActorService {
    // ==========================================
    // ESTACIONES DE SERVICIO
    // ==========================================

    async obtenerEstaciones() {
        return prisma.estacionServicio.findMany({
            include: {
                zona: true,
                usuario: { select: { id: true, nombre: true, email: true } }
            },
            orderBy: { createdAt: 'desc' },
        });
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

    async crearEstacion(data: CrearEstacionInput) {
        const existeNit = await prisma.estacionServicio.findUnique({ where: { nit: data.nit } });
        if (existeNit) throw new Error('Ya existe una estación con este NIT');

        const existeSicom = await prisma.estacionServicio.findUnique({ where: { codigoSicom: data.codigoSicom } });
        if (existeSicom) throw new Error('Ya existe una estación con este Código SICOM');

        const existeUsuario = await prisma.estacionServicio.findUnique({ where: { usuarioId: data.usuarioId } });
        if (existeUsuario) throw new Error('Este usuario ya está asignado a otra estación');

        return prisma.estacionServicio.create({
            data: {
                nombre: data.nombre,
                nit: data.nit,
                direccion: data.direccion,
                ciudad: data.ciudad,
                departamento: data.departamento,
                codigoSicom: data.codigoSicom,
                latitud: data.latitud ?? null,
                longitud: data.longitud ?? null,
                zonaId: data.zonaId,
                usuarioId: data.usuarioId,
            },
            include: { zona: true, usuario: true }
        });
    }

    async actualizarEstacion(id: string, data: ActualizarEstacionInput) {
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

        const { zonaId, ...updateData } = data;
        const updatePayload: any = { ...updateData };

        if (zonaId) {
            updatePayload.zona = { connect: { id: zonaId } };
        }

        return prisma.estacionServicio.update({
            where: { id },
            data: updatePayload,
            include: { zona: true }
        });
    }

    // ==========================================
    // DISTRIBUIDORES
    // ==========================================

    async obtenerDistribuidores() {
        return prisma.distribuidor.findMany({
            include: {
                usuario: { select: { id: true, nombre: true, email: true } }
            },
            orderBy: { createdAt: 'desc' },
        });
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

    async crearDistribuidor(data: CrearDistribuidorInput) {
        const existeNit = await prisma.distribuidor.findUnique({ where: { nit: data.nit } });
        if (existeNit) throw new Error('Ya existe un distribuidor con este NIT');

        const existeUsuario = await prisma.distribuidor.findUnique({ where: { usuarioId: data.usuarioId } });
        if (existeUsuario) throw new Error('Este usuario ya está asignado a otro distribuidor');

        return prisma.distribuidor.create({
            data: {
                nombre: data.nombre,
                nit: data.nit,
                tipo: data.tipo,
                direccion: data.direccion,
                ciudad: data.ciudad,
                departamento: data.departamento,
                usuarioId: data.usuarioId,
            },
            include: { usuario: true }
        });
    }

    async actualizarDistribuidor(id: string, data: ActualizarDistribuidorInput) {
        const existe = await prisma.distribuidor.findUnique({ where: { id } });
        if (!existe) throw new Error('Distribuidor no encontrado');

        if (data.nit && data.nit !== existe.nit) {
            const existeNit = await prisma.distribuidor.findUnique({ where: { nit: data.nit } });
            if (existeNit) throw new Error('El nuevo NIT ya está registrado');
        }

        return prisma.distribuidor.update({
            where: { id },
            data: {
                ...(data.nombre && { nombre: data.nombre }),
                ...(data.nit && { nit: data.nit }),
                ...(data.tipo && { tipo: data.tipo }),
                ...(data.direccion && { direccion: data.direccion }),
                ...(data.ciudad && { ciudad: data.ciudad }),
                ...(data.departamento && { departamento: data.departamento }),
            }
        });
    }
}

export const actorService = new ActorService();
