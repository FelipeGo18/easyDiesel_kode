import { prisma } from '../utils/prisma';
import { CrearTanqueInput, ActualizarTanqueInput } from '../validators/tanque.validator';

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

    async crearTanque(data: CrearTanqueInput) {
        // Valida que la estación exista
        const estacion = await prisma.estacionServicio.findUnique({ where: { id: data.estacionId } });
        if (!estacion) throw new Error('La estación seleccionada no existe');

        // Todo nuevo tanque arranca con nivelActual = 0
        return prisma.tanque.create({
            data: {
                nombre: data.nombre,
                capacidadGalones: data.capacidadGalones,
                nivelMinimo: data.nivelMinimo,
                nivelActual: 0,
                tipoCombustible: data.tipoCombustible,
                estacionId: data.estacionId
            }
        });
    }

    async actualizarTanque(id: string, data: ActualizarTanqueInput) {
        const existe = await prisma.tanque.findUnique({ where: { id } });
        if (!existe) throw new Error('Tanque no encontrado');

        if (data.estacionId) {
            const estacion = await prisma.estacionServicio.findUnique({ where: { id: data.estacionId } });
            if (!estacion) throw new Error('La estación seleccionada no existe');
        }

        return prisma.tanque.update({
            where: { id },
            data: {
                ...(data.nombre && { nombre: data.nombre }),
                ...(data.capacidadGalones !== undefined && { capacidadGalones: data.capacidadGalones }),
                ...(data.nivelMinimo !== undefined && { nivelMinimo: data.nivelMinimo }),
                ...(data.tipoCombustible && { tipoCombustible: data.tipoCombustible }),
                ...(data.estacionId && { estacionId: data.estacionId })
            }
        });
    }
}

export const tanqueService = new TanqueService();
