import { Request, Response } from 'express';
import { decretoService } from '../services/decreto.service';
import { crearDecretoSchema, actualizarDecretoSchema } from '../validators/decreto.validator';
import { ZodError } from 'zod';

export const obtenerDecretosHandler = async (_req: Request, res: Response) => {
    try {
        const decretos = await decretoService.obtenerDecretos();
        res.json({ success: true, data: decretos });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const obtenerDecretoPorIdHandler = async (req: Request, res: Response) => {
    try {
        const decreto = await decretoService.obtenerDecretoPorId(req.params.id as string);
        res.json({ success: true, data: decreto });
    } catch (error: any) {
        const status = error.message === 'Decreto no encontrado' ? 404 : 500;
        res.status(status).json({ success: false, message: error.message });
    }
};

export const crearDecretoHandler = async (req: Request, res: Response) => {
    try {
        const validData = crearDecretoSchema.parse(req.body);
        const decreto = await decretoService.crearDecreto(validData, {
            usuarioId: (req as any).user?.userId || 'sistema',
            ip: req.ip || '127.0.0.1',
            userAgent: req.get('user-agent')
        });
        res.status(201).json({ success: true, message: 'Decreto creado', data: decreto });
    } catch (error: any) {
        if (error instanceof ZodError) { res.status(400).json({ success: false, errors: error.issues }); return; }
        res.status(400).json({ success: false, message: error.message });
    }
};

export const actualizarDecretoHandler = async (req: Request, res: Response) => {
    try {
        const validData = actualizarDecretoSchema.parse(req.body);
        const decreto = await decretoService.actualizarDecreto(req.params.id as string, validData, {
            usuarioId: (req as any).user?.userId || 'sistema',
            ip: req.ip || '127.0.0.1',
            userAgent: req.get('user-agent')
        });
        res.json({ success: true, message: 'Decreto actualizado', data: decreto });
    } catch (error: any) {
        if (error instanceof ZodError) { res.status(400).json({ success: false, errors: error.issues }); return; }
        const status = error.message === 'Decreto no encontrado' ? 404 : 400;
        res.status(status).json({ success: false, message: error.message });
    }
};
