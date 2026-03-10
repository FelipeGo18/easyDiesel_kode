import { prisma } from './prisma';

export interface OperationalScope {
    roleName: string;
    userId: string;
    stationId: string | null;
    distributorId: string | null;
}

export async function resolveOperationalScope(userId: string): Promise<OperationalScope> {
    const usuario = await prisma.usuario.findUnique({
        where: { id: userId },
        include: {
            rol: { select: { nombre: true } },
            estacionGestionada: { select: { id: true } },
            distribuidorGestionado: { select: { id: true } },
        },
    });

    if (!usuario) {
        throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 });
    }

    return {
        roleName: usuario.rol.nombre,
        userId: usuario.id,
        stationId: usuario.estacionGestionada?.id ?? null,
        distributorId: usuario.distribuidorGestionado?.id ?? null,
    };
}

export async function requireManagedStation(userId: string) {
    const scope = await resolveOperationalScope(userId);

    if (scope.roleName !== 'estacion') {
        return scope;
    }

    if (!scope.stationId) {
        throw Object.assign(new Error('El usuario de estación no tiene una estación asociada'), { statusCode: 409 });
    }

    return scope;
}