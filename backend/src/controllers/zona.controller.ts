import { Request, Response } from 'express';
import { zonaService } from '../services/zona.service';
import { crearZonaSchema, actualizarZonaSchema } from '../validators/zona.validator';
import { ZodError } from 'zod';

export const obtenerZonasHandler = async (_req: Request, res: Response) => {
    try {
        const zonas = await zonaService.obtenerZonas();
        res.json({ success: true, data: zonas });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const obtenerZonaPorIdHandler = async (req: Request, res: Response) => {
    try {
        const zona = await zonaService.obtenerZonaPorId(req.params.id as string);
        res.json({ success: true, data: zona });
    } catch (error: any) {
        const status = error.message === 'Zona no encontrada' ? 404 : 500;
        res.status(status).json({ success: false, message: error.message });
    }
};

export const crearZonaHandler = async (req: Request, res: Response) => {
    try {
        const validData = crearZonaSchema.parse(req.body);
        const zona = await zonaService.crearZona(validData, {
            usuarioId: (req as any).user?.userId || 'sistema',
            ip: req.ip || '127.0.0.1',
            userAgent: req.get('user-agent')
        });
        res.status(201).json({ success: true, message: 'Zona creada', data: zona });
    } catch (error: any) {
        if (error instanceof ZodError) { res.status(400).json({ success: false, errors: error.issues }); return; }
        res.status(400).json({ success: false, message: error.message });
    }
};

export const actualizarZonaHandler = async (req: Request, res: Response) => {
    try {
        const validData = actualizarZonaSchema.parse(req.body);
        const zona = await zonaService.actualizarZona(req.params.id as string, validData, {
            usuarioId: (req as any).user?.userId || 'sistema',
            ip: req.ip || '127.0.0.1',
            userAgent: req.get('user-agent')
        });
        res.json({ success: true, message: 'Zona actualizada', data: zona });
    } catch (error: any) {
        if (error instanceof ZodError) { res.status(400).json({ success: false, errors: error.issues }); return; }
        const status = error.message === 'Zona no encontrada' ? 404 : 400;
        res.status(status).json({ success: false, message: error.message });
    }
};
