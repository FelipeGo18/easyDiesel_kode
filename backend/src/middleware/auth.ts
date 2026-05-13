import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { hasAnyPermission, normalizePermissions } from '../utils/permissions';
import { getJwtSecret } from '../config/security';
import { prisma } from '../utils/prisma';

interface JwtPayload {
    userId: string;
    email: string;
    rol: string;
    permisos?: string[];
    estacionId?: string;
    distribuidorId?: string;
}

// Extiende el tipo Request para incluir el usuario autenticado
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

/**
 * Middleware de autenticación JWT.
 * Verifica el token en el header Authorization: Bearer <token>
 */
export const auth = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: 'Token de autenticación requerido', error: 'Token de autenticación requerido' });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(
            token,
            getJwtSecret()
        ) as JwtPayload;

        req.user = {
            ...decoded,
            permisos: normalizePermissions(decoded.rol, decoded.permisos),
        };
        next();
    } catch {
        res.status(401).json({ success: false, message: 'Token inválido o expirado', error: 'Token inválido o expirado' });
    }
};

/**
 * Middleware de autorización por permisos.
 * Uso: can('inventario:crear', 'inventario:editar')
 */
export const can = (...requiredPermisos: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'No autenticado', error: 'No autenticado' });
            return;
        }

        // El admin tiene todos los permisos
        if (req.user.rol === 'admin') {
            return next();
        }

        const userPermisos = req.user.permisos || [];
        const allowed = hasAnyPermission(userPermisos, requiredPermisos);

        if (!allowed) {
            res.status(403).json({
                success: false,
                message: 'No tienes los permisos necesarios para realizar esta acción',
                error: 'No tienes los permisos necesarios para realizar esta acción',
            });
            return;
        }

        next();
    };
};

/**
 * Middleware que resuelve estacionId / distribuidorId del usuario autenticado
 * y los inyecta en req.user para que los controllers puedan hacer data-isolation.
 */
export const resolveOwnership = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user || req.user.rol === 'admin') return next();

    const rolesConRelacion = ['estacion', 'distribuidor', 'distribuidor_regulado'];
    if (!rolesConRelacion.includes(req.user.rol)) return next();

    // Si el token ya transporta el ownership id, no hace falta consultar la DB.
    if (req.user.estacionId || req.user.distribuidorId) {
        return next();
    }

    try {
        const usuario = await prisma.usuario.findUnique({
            where: { id: req.user.userId },
            select: {
                estacionGestionada: { select: { id: true } },
                distribuidorGestionado: { select: { id: true } },
            },
        });
        req.user.estacionId = usuario?.estacionGestionada?.id;
        req.user.distribuidorId = usuario?.distribuidorGestionado?.id;
    } catch { /* si falla el lookup se deja sin dato, el controller rechazará */ }
    next();
};

/**
 * Helpers de aislamiento de datos para usar dentro de controllers.
 * Validan que el recurso solicitado pertenezca al usuario.
 */
export function assertEstacionOwnership(req: Request, requestedEstacionId?: string): void {
    if (!req.user || req.user.rol === 'admin' || req.user.rol === 'regulador' || req.user.rol === 'auditor') return;
    if (req.user.rol === 'estacion' && req.user.estacionId && requestedEstacionId) {
        if (req.user.estacionId !== requestedEstacionId) {
            const err: any = new Error('No tienes acceso a esta estación');
            err.statusCode = 403;
            throw err;
        }
    }
}

export function assertDistribuidorOwnership(req: Request, requestedDistribuidorId?: string): void {
    if (!req.user || req.user.rol === 'admin' || req.user.rol === 'regulador' || req.user.rol === 'auditor') return;
    const distribuidorRoles = ['distribuidor', 'distribuidor_regulado'];
    if (distribuidorRoles.includes(req.user.rol) && req.user.distribuidorId && requestedDistribuidorId) {
        if (req.user.distribuidorId !== requestedDistribuidorId) {
            const err: any = new Error('No tienes acceso a este distribuidor');
            err.statusCode = 403;
            throw err;
        }
    }
}
