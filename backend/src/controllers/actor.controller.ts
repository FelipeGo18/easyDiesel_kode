import { Request, Response } from 'express';
import { actorService } from '../services/actor.service';
import {
    crearEstacionSchema,
    actualizarEstacionSchema,
    crearDistribuidorSchema,
    actualizarDistribuidorSchema
} from '../validators/actor.validator';

// ==========================================
// ESTACIONES DE SERVICIO
// ==========================================

export const obtenerEstacionesHandler = async (req: Request, res: Response) => {
    try {
        const search = req.query.search as string | undefined;
        const page = req.query.page ? Number(req.query.page) : undefined;
        const limit = req.query.limit ? Number(req.query.limit) : undefined;
        const result = await actorService.obtenerEstaciones({ search, page, limit });
        res.json({ success: true, ...result });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error interno o de base de datos', error: error.message });
    }
};

export const obtenerEstacionPorIdHandler = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const estacion = await actorService.obtenerEstacionPorId(id);
        res.json({ success: true, data: estacion });
    } catch (error: any) {
        res.status(404).json({ success: false, message: error.message });
    }
};

export const actualizarZonaEstacionHandler = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { zonaId } = req.body;
        if (!zonaId || typeof zonaId !== 'string') {
            return res.status(400).json({ success: false, message: 'Se requiere zonaId (string)' });
        }
        const estacion = await actorService.actualizarZonaEstacion(id, zonaId, {
            usuarioId: (req as any).user?.userId || 'sistema',
            ip: req.ip || '127.0.0.1',
            userAgent: req.get('user-agent')
        });
        res.json({ success: true, message: 'Zona actualizada', data: estacion });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const crearEstacionHandler = async (req: Request, res: Response) => {
    try {
        const validData = crearEstacionSchema.parse(req.body);
        const nuevaEstacion = await actorService.crearEstacion(validData, {
            usuarioId: (req as any).user?.userId || 'sistema',
            ip: req.ip || '127.0.0.1',
            userAgent: req.get('user-agent')
        });
        res.status(201).json({ success: true, message: 'Estación creada', data: nuevaEstacion });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            res.status(400).json({ success: false, errors: error.errors });
        } else {
            res.status(400).json({ success: false, message: error.message });
        }
    }
};

export const actualizarEstacionHandler = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const validData = actualizarEstacionSchema.parse(req.body);

        if (Object.keys(validData).length === 0) {
            return res.status(400).json({ success: false, message: 'No hay datos válidos para actualizar' });
        }

        const estacion = await actorService.actualizarEstacion(id, validData, {
            usuarioId: (req as any).user?.userId || 'sistema',
            ip: req.ip || '127.0.0.1',
            userAgent: req.get('user-agent')
        });
        res.json({ success: true, message: 'Estación actualizada', data: estacion });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            res.status(400).json({ success: false, errors: error.errors });
        } else {
            res.status(400).json({ success: false, message: error.message });
        }
    }
};

// ==========================================
// DISTRIBUIDORES
// ==========================================

export const obtenerDistribuidoresHandler = async (req: Request, res: Response) => {
    try {
        const search = req.query.search as string | undefined;
        const page = req.query.page ? Number(req.query.page) : undefined;
        const limit = req.query.limit ? Number(req.query.limit) : undefined;
        const result = await actorService.obtenerDistribuidores({ search, page, limit });
        res.json({ success: true, ...result });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error interno o de base de datos', error: error.message });
    }
};

export const obtenerDistribuidorPorIdHandler = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const distribuidor = await actorService.obtenerDistribuidorPorId(id);
        res.json({ success: true, data: distribuidor });
    } catch (error: any) {
        res.status(404).json({ success: false, message: error.message });
    }
};

export const crearDistribuidorHandler = async (req: Request, res: Response) => {
    try {
        const validData = crearDistribuidorSchema.parse(req.body);
        const nuevoDistribuidor = await actorService.crearDistribuidor(validData, {
            usuarioId: (req as any).user?.userId || 'sistema',
            ip: req.ip || '127.0.0.1',
            userAgent: req.get('user-agent')
        });
        res.status(201).json({ success: true, message: 'Distribuidor creado', data: nuevoDistribuidor });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            res.status(400).json({ success: false, errors: error.errors });
        } else {
            res.status(400).json({ success: false, message: error.message });
        }
    }
};

export const actualizarDistribuidorHandler = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const validData = actualizarDistribuidorSchema.parse(req.body);

        if (Object.keys(validData).length === 0) {
            return res.status(400).json({ success: false, message: 'No hay datos válidos para actualizar' });
        }

        const distribuidor = await actorService.actualizarDistribuidor(id, validData, {
            usuarioId: (req as any).user?.userId || 'sistema',
            ip: req.ip || '127.0.0.1',
            userAgent: req.get('user-agent')
        });
        res.json({ success: true, message: 'Distribuidor actualizado', data: distribuidor });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            res.status(400).json({ success: false, errors: error.errors });
        } else {
            res.status(400).json({ success: false, message: error.message });
        }
    }
};
