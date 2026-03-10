import rateLimit from 'express-rate-limit';

function createLimiter(options: { windowMs: number; max: number; message: string }) {
    return rateLimit({
        windowMs: options.windowMs,
        max: options.max,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            success: false,
            message: options.message,
        },
    });
}

export const globalApiRateLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Demasiadas solicitudes, intenta de nuevo más tarde.',
});

export const authRateLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: 'Demasiados intentos de autenticación, espera unos minutos antes de reintentar.',
});

export const publicReadRateLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 120,
    message: 'Demasiadas consultas públicas, intenta de nuevo más tarde.',
});