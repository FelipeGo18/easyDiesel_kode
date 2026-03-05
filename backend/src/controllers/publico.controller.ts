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
        const result = await publicoService.getEstaciones();
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
