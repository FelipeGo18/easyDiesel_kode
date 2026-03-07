import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { registerSchema, loginSchema, logoutSchema, refreshTokenSchema } from '../validators/auth.validator';
import { ZodError } from 'zod';

// ──────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────

function formatZodErrors(error: ZodError) {
    return error.issues.map((issue) => ({
        campo: issue.path.join('.'),
        mensaje: issue.message,
    }));
}

function buildSessionMetadata(req: Request) {
    return {
        ip: req.ip,
        userAgent: typeof req.get === 'function' ? req.get('user-agent') || undefined : undefined,
    };
}

// ──────────────────────────────────────────
// Handlers
// ──────────────────────────────────────────

/**
 * POST /api/auth/register
 */
export const registerHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const data = registerSchema.parse(req.body);
        const result = await authService.register(data, buildSessionMetadata(req));

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: result,
        });
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({
                success: false,
                error: 'Datos de registro inválidos',
                details: formatZodErrors(error),
            });
            return;
        }
        next(error);
    }
};

/**
 * GET /api/auth/google/callback
 */
export const googleCallbackHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { code } = req.query;
        if (!code || typeof code !== 'string') {
            res.status(400).json({ success: false, error: 'Código inválido' });
            return;
        }

        // Simulación de intercambio de código por información de usuario de Google
        // En una implementación real se usaría google-auth-library o fetch a las APIs de Google
        // Por ahora, asumimos que obtenemos la info (para efectos de este plan)
        const googleUser = {
            email: 'user@google.com', // Esto vendría de Google
            nombre: 'Usuario Google',
            googleId: 'google-123',
            fotoUrl: 'https://lh3.googleusercontent.com/a/...'
        };

        const result = await authService.loginWithGoogle(googleUser, buildSessionMetadata(req));

        res.status(200).json({
            success: true,
            message: 'Login con Google exitoso',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/auth/login
 */
export const loginHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const data = loginSchema.parse(req.body);
        const result = await authService.login(data, buildSessionMetadata(req));

        res.status(200).json({
            success: true,
            message: 'Login exitoso',
            data: result,
        });
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({
                success: false,
                error: 'Datos de login inválidos',
                details: formatZodErrors(error),
            });
            return;
        }
        next(error);
    }
};

/**
 * POST /api/auth/supabase-login
 * Intercambia un access_token de Supabase por un JWT de nuestro backend
 */
export const supabaseLoginHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { access_token } = req.body;
        if (!access_token) {
            res.status(400).json({ success: false, error: 'Token de Supabase no proporcionado' });
            return;
        }

        const result = await authService.loginWithSupabaseToken(access_token, buildSessionMetadata(req));

        res.status(200).json({
            success: true,
            message: 'Login con Supabase exitoso',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/auth/me
 */
export const meHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: 'No autenticado' });
            return;
        }

        const profile = await authService.getProfile(req.user.userId);

        res.status(200).json({
            success: true,
            data: profile,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/auth/refresh
 */
export const refreshHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const data = refreshTokenSchema.parse(req.body);
        const result = await authService.refreshSession(data.refresh_token, buildSessionMetadata(req));

        res.status(200).json({
            success: true,
            message: 'Sesión renovada exitosamente',
            data: result,
        });
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({
                success: false,
                error: 'Refresh token inválido',
                details: formatZodErrors(error),
            });
            return;
        }

        next(error);
    }
};

/**
 * POST /api/auth/logout
 */
export const logoutHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const data = logoutSchema.parse(req.body);
        await authService.logout(data.refresh_token);

        res.status(200).json({
            success: true,
            message: 'Sesión cerrada correctamente',
        });
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({
                success: false,
                error: 'Refresh token inválido',
                details: formatZodErrors(error),
            });
            return;
        }

        next(error);
    }
};
