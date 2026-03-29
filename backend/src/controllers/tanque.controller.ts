import { Request, Response } from 'express';
import { tanqueService } from '../services/tanque.service';
import { crearTanqueSchema, actualizarTanqueSchema } from '../validators/tanque.validator';
import { ZodError } from 'zod';

export const obtenerTanquesHandler = async (req: Request, res: Response) => {
    try {
        const { estacionId } = req.query;
        const tanques = await tanqueService.obtenerTanques(estacionId as string);
        res.json({ success: true, data: tanques });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const obtenerTanquePorIdHandler = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const tanque = await tanqueService.obtenerTanquePorId(id);
        res.json({ success: true, data: tanque });
    } catch (error: any) {
        if (error.message === 'Tanque no encontrado') {
            res.status(404).json({ success: false, message: error.message });
            return;
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

export const crearTanqueHandler = async (req: Request, res: Response) => {
    try {
        const validData = crearTanqueSchema.parse(req.body);
        const nuevoTanque = await tanqueService.crearTanque(validData, {
            usuarioId: (req as any).user?.userId || 'sistema',
            ip: req.ip || '127.0.0.1',
            userAgent: req.get('user-agent')
        });
        res.status(201).json({ success: true, message: 'Tanque creado exitosamente', data: nuevoTanque });
    } catch (error: any) {
        if (error instanceof ZodError) {
            res.status(400).json({ success: false, errors: error.issues });
            return;
        }
        res.status(400).json({ success: false, message: error.message });
    }
};

export const actualizarTanqueHandler = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const body = req.body;
        
        if (!body || Object.keys(body).length === 0) {
            res.status(400).json({ success: false, message: 'No hay datos para actualizar' });
            return;
        }

        const validData = actualizarTanqueSchema.parse(body);

        const tanqueActualizado = await tanqueService.actualizarTanque(id, validData, {
            usuarioId: (req as any).user?.userId || 'sistema',
            ip: req.ip || '127.0.0.1',
            userAgent: req.get('user-agent')
        });
        res.json({ success: true, message: 'Tanque actualizado', data: tanqueActualizado });
    } catch (error: any) {
        if (error instanceof ZodError) {
            res.status(400).json({ success: false, errors: error.issues });
            return;
        }
        if (error.message === 'Tanque no encontrado') {
            res.status(404).json({ success: false, message: error.message });
            return;
        }
        res.status(400).json({ success: false, message: error.message });
    }
};
