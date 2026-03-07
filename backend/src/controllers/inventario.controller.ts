import { Request, Response } from 'express';
import { inventarioService } from '../services/inventario.service';
import { registrarEntregaSchema, registrarTransaccionSchema, cierreTurnoSchema } from '../validators/inventario.validator';
import { ZodError } from 'zod';

export const cierreTurnoHandler = async (req: Request, res: Response) => {
    try {
        const validData = cierreTurnoSchema.parse(req.body);
        const result = await inventarioService.cierreTurno(validData, {
            usuarioId: req.user?.userId,
            ip: req.ip,
            userAgent: typeof req.get === 'function' ? req.get('user-agent') || undefined : undefined,
        });
        res.status(200).json({
            success: true,
            message: 'Cierre de turno procesado correctamente',
            data: result,
        });
    } catch (error: any) {
        if (error instanceof ZodError) {
            res.status(400).json({ success: false, errors: error.issues });
            return;
        }
        res.status(400).json({ success: false, message: error.message });
    }
};

export const registrarEntregaHandler = async (req: Request, res: Response) => {
    try {
        const validData = registrarEntregaSchema.parse(req.body);
        const entrega = await inventarioService.registrarEntrega(validData, {
            usuarioId: req.user?.userId,
            ip: req.ip,
            userAgent: typeof req.get === 'function' ? req.get('user-agent') || undefined : undefined,
        });
        res.status(201).json({
            success: true,
            message: 'Entrega registrada e inventario actualizado con éxito',
            data: entrega,
        });
    } catch (error: any) {
        if (error instanceof ZodError) {
            res.status(400).json({ success: false, errors: error.issues });
            return;
        }
        res.status(400).json({ success: false, message: error.message });
    }
};

export const registrarTransaccionHandler = async (req: Request, res: Response) => {
    try {
        const validData = registrarTransaccionSchema.parse(req.body);
        const transaccion = await inventarioService.registrarTransaccion(validData, {
            usuarioId: req.user?.userId,
            ip: req.ip,
            userAgent: typeof req.get === 'function' ? req.get('user-agent') || undefined : undefined,
        });

        const { _alertaNivelMinimo, _precioAplicado, ...transaccionPayload } = transaccion;

        res.status(201).json({
            success: true,
            message: 'Transacción registrada e inventario actualizado con éxito',
            alerta: _alertaNivelMinimo ? 'ATENCIÓN: El tanque ha alcanzado o superado el nivel mínimo operativo' : undefined,
            pricing: _precioAplicado,
            data: transaccionPayload,
        });
    } catch (error: any) {
        if (error instanceof ZodError) {
            res.status(400).json({ success: false, errors: error.issues });
            return;
        }
        res.status(400).json({ success: false, message: error.message });
    }
};
