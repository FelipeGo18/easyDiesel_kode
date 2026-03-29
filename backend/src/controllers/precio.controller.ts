import { Request, Response } from 'express';
import { precioService } from '../services/precio.service';
import { crearPrecioSchema, actualizarPrecioSchema } from '../validators/precio.validator';
import { ZodError } from 'zod';

export const obtenerPreciosHandler = async (req: Request, res: Response) => {
    try {
        const { zonaId, tipoCombustible, activos } = req.query;
        const precios = await precioService.obtenerPrecios({
            zonaId: zonaId as string,
            tipoCombustible: tipoCombustible as string,
            soloActivos: activos !== 'false'
        });
        res.json({ success: true, data: precios });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const obtenerPrecioPorIdHandler = async (req: Request, res: Response) => {
    try {
        const precio = await precioService.obtenerPrecioPorId(req.params.id as string);
        res.json({ success: true, data: precio });
    } catch (error: any) {
        const status = error.message === 'Precio no encontrado' ? 404 : 500;
        res.status(status).json({ success: false, message: error.message });
    }
};

export const crearPrecioHandler = async (req: Request, res: Response) => {
    try {
        const validData = crearPrecioSchema.parse(req.body);
        const precio = await precioService.crearPrecio(validData, {
            usuarioId: (req as any).user?.userId || '',
            ip: req.ip || '127.0.0.1',
            userAgent: req.get('user-agent')
        });
        res.status(201).json({ success: true, message: 'Precio vigente creado (anteriores desactivados)', data: precio });
    } catch (error: any) {
        if (error instanceof ZodError) { res.status(400).json({ success: false, errors: error.issues }); return; }
        res.status(400).json({ success: false, message: error.message });
    }
};

export const actualizarPrecioHandler = async (req: Request, res: Response) => {
    try {
        const validData = actualizarPrecioSchema.parse(req.body);
        const precio = await precioService.actualizarPrecio(req.params.id as string, validData, {
            usuarioId: (req as any).user?.userId || '',
            ip: req.ip || '127.0.0.1',
            userAgent: req.get('user-agent')
        });
        res.json({ success: true, message: 'Precio actualizado', data: precio });
    } catch (error: any) {
        if (error instanceof ZodError) { res.status(400).json({ success: false, errors: error.issues }); return; }
        const status = error.message === 'Precio no encontrado' ? 404 : 400;
        res.status(status).json({ success: false, message: error.message });
    }
};

/**
 * Endpoint publico para consultar el precio actual de un combustible.
 */
export const consultarPrecioActualHandler = async (req: Request, res: Response) => {
    try {
        const { tipoCombustible, tipoServicio, zonaId } = req.query;
        if (!tipoCombustible || !tipoServicio || !zonaId) {
            res.status(400).json({ success: false, message: 'Se requiere tipoCombustible, tipoServicio y zonaId' });
            return;
        }
        const precio = await precioService.consultarPrecioActual(
            tipoCombustible as string,
            tipoServicio as string,
            zonaId as string
        );
        res.json({ success: true, data: precio });
    } catch (error: any) {
        res.status(404).json({ success: false, message: error.message });
    }
};
