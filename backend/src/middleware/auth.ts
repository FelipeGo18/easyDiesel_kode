import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { hasAnyPermission, normalizePermissions } from '../utils/permissions';
import { getJwtSecret } from '../config/security';

interface JwtPayload {
    userId: string;
    email: string;
    rol: string;
    permisos?: string[];
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
