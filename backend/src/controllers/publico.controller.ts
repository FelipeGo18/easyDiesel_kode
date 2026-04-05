import { Request, Response, NextFunction } from 'express';
import { publicoService } from '../services/publico.service';

/**
 * GET /api/publico/precios
 */
export const getPreciosHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const result = await publicoService.getPrecios();
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/publico/estaciones
 */
export const getEstacionesHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const result = await publicoService.getEstaciones({
            zonaId: typeof req.query.zonaId === 'string' ? req.query.zonaId : undefined,
            soloConCoordenadas: req.query.soloConCoordenadas === 'true',
        });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/publico/zonas
 */
export const getZonasHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const result = await publicoService.getZonas();
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/publico/decretos/vigentes
 */
export const getDecretosHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const result = await publicoService.getDecretosVigentes();
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/publico/transacciones
 */
export const getTransaccionesPorPlacaHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const placaVehiculo = typeof req.query.placaVehiculo === 'string' ? req.query.placaVehiculo : '';
        const page = req.query.page ? Number(req.query.page) : undefined;
        const limit = req.query.limit ? Number(req.query.limit) : undefined;
        const result = await publicoService.getTransaccionesPorPlaca(placaVehiculo, page, limit);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/publico/estaciones-cercanas
 */
export const getEstacionesCercanasHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const latitud = Number(req.query.latitud);
        const longitud = Number(req.query.longitud);
        const radioMetros = typeof req.query.radioMetros === 'string' ? Number(req.query.radioMetros) : undefined;
        const limite = typeof req.query.limite === 'string' ? Number(req.query.limite) : undefined;

        if (!Number.isFinite(latitud) || !Number.isFinite(longitud)) {
            const error = new Error('latitud y longitud son obligatorios y deben ser numéricos');
            (error as Error & { statusCode?: number }).statusCode = 400;
            throw error;
        }

        const result = await publicoService.getEstacionesCercanas({ latitud, longitud, radioMetros, limite });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};
