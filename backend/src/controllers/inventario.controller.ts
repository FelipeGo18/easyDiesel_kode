import { Request, Response } from 'express';
import { inventarioService } from '../services/inventario.service';
import { registrarEntregaSchema, registrarTransaccionSchema } from '../validators/inventario.validator';
import { ZodError } from 'zod';

export const registrarEntregaHandler = async (req: Request, res: Response) => {
    try {
        const validData = registrarEntregaSchema.parse(req.body);
        const entrega = await inventarioService.registrarEntrega(validData);
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
        const transaccion = await inventarioService.registrarTransaccion(validData);

        const { _alertaNivelMinimo, ...transaccionPayload } = transaccion;

        res.status(201).json({
            success: true,
            message: 'Transacción registrada e inventario actualizado con éxito',
            alerta: _alertaNivelMinimo ? 'ATENCIÓN: El tanque ha alcanzado o superado el nivel mínimo operativo' : undefined,
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
