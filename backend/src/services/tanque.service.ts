import { prisma } from '../utils/prisma';
import { CrearTanqueInput, ActualizarTanqueInput } from '../validators/tanque.validator';
import { auditoriaService } from './auditoria.service';

interface AuditoriaMetadata {
    usuarioId: string;
    ip: string;
    userAgent?: string;
}

export class TanqueService {
    async obtenerTanques(estacionId?: string) {
        const cond = estacionId ? { estacionId } : {};
        return prisma.tanque.findMany({
            where: cond,
            include: {
                estacion: { select: { nombre: true, ciudad: true } },
            },
            orderBy: { nombre: 'asc' }
        });
    }

    async obtenerTanquePorId(id: string) {
        const tanque = await prisma.tanque.findUnique({
            where: { id },
            include: { estacion: true }
        });

        if (!tanque) throw new Error('Tanque no encontrado');
        return tanque;
    }

    async crearTanque(data: CrearTanqueInput, meta?: AuditoriaMetadata) {
        // Valida que la estación exista
        const estacion = await prisma.estacionServicio.findUnique({ where: { id: data.estacionId } });
        if (!estacion) throw new Error('La estación seleccionada no existe');

        // Todo nuevo tanque arranca con nivelActual = 0
        const tanque = await prisma.tanque.create({
            data: {
                nombre: data.nombre,
                capacidadGalones: data.capacidadGalones,
                nivelMinimo: data.nivelMinimo,
                nivelActual: 0,
                tipoCombustible: data.tipoCombustible,
                estacionId: data.estacionId
            }
        });

        if (meta) {
            await auditoriaService.registrarLog({
                usuarioId: meta.usuarioId,
                modulo: 'TANQUES',
                accion: 'CREAR_TANQUE',
                entidad: 'tanque',
                entidadId: tanque.id,
                ip: meta.ip,
                userAgent: meta.userAgent,
                datosDespues: { nombre: tanque.nombre, capacidad: tanque.capacidadGalones }
            });
        }

        return tanque;
    }

    async actualizarTanque(id: string, data: ActualizarTanqueInput, meta?: AuditoriaMetadata) {
        const existe = await prisma.tanque.findUnique({ where: { id } });
        if (!existe) throw new Error('Tanque no encontrado');

        if (data.estacionId) {
            const estacion = await prisma.estacionServicio.findUnique({ where: { id: data.estacionId } });
            if (!estacion) throw new Error('La estación seleccionada no existe');
        }

        const tanque = await prisma.tanque.update({
            where: { id },
            data: {
                ...(data.nombre && { nombre: data.nombre }),
                ...(data.capacidadGalones !== undefined && { capacidadGalones: data.capacidadGalones }),
                ...(data.nivelMinimo !== undefined && { nivelMinimo: data.nivelMinimo }),
                ...(data.tipoCombustible && { tipoCombustible: data.tipoCombustible }),
                ...(data.estacionId && { estacionId: data.estacionId })
            }
        });

        if (meta) {
            await auditoriaService.registrarLog({
                usuarioId: meta.usuarioId,
                modulo: 'TANQUES',
                accion: 'ACTUALIZAR_TANQUE',
                entidad: 'tanque',
                entidadId: id,
                ip: meta.ip,
                userAgent: meta.userAgent,
                datosAntes: existe,
                datosDespues: { cambios: Object.keys(data) }
            });
        }

        return tanque;
    }
}

export const tanqueService = new TanqueService();
