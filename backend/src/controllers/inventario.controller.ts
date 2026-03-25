import { Request, Response } from 'express';
import { inventarioService } from '../services/inventario.service';
import { prisma } from '../utils/prisma';
import { registrarEntregaSchema, confirmarEntregaSchema, confirmarEntregaMultiTanqueSchema, registrarTransaccionSchema, cierreTurnoSchema, entradaDirectaSchema } from '../validators/inventario.validator';
import { ZodError } from 'zod';

export const obtenerTransaccionesHandler = async (req: Request, res: Response) => {
    try {
        const estacionId = req.query.estacionId as string | undefined;
        const placaVehiculo = req.query.placaVehiculo as string | undefined;
        if (!estacionId && !placaVehiculo) {
            res.status(400).json({ success: false, message: 'Se requiere estacionId o placaVehiculo' });
            return;
        }
        const page = req.query.page ? Number(req.query.page) : undefined;
        const limit = req.query.limit ? Number(req.query.limit) : undefined;
        const result = await inventarioService.listarTransacciones({ estacionId, placaVehiculo, page, limit });
        res.json({ success: true, ...result });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const cancelarEntregaHandler = async (req: Request, res: Response) => {
    try {
        const entregaId = req.params.id as string;
        if (!entregaId) {
            res.status(400).json({ success: false, message: 'Se requiere el ID de la entrega' });
            return;
        }
        // El distribuidor solo puede cancelar sus propias entregas
        const distribuidorId = (req.user as any)?.distribuidorId as string | undefined;
        const result = await inventarioService.cancelarEntrega(entregaId, {
            distribuidorId,
            usuarioId: req.user?.userId,
            ip: req.ip,
            userAgent: typeof req.get === 'function' ? req.get('user-agent') || undefined : undefined,
        });
        res.json({ success: true, message: 'Entrega cancelada correctamente', data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const obtenerEntregasPendientesHandler = async (req: Request, res: Response) => {
    try {
        const estacionId = req.query.estacionId as string;
        if (!estacionId) {
            res.status(400).json({ success: false, message: 'Se requiere estacionId' });
            return;
        }

        const page = req.query.page ? Number(req.query.page) : undefined;
        const limit = req.query.limit ? Number(req.query.limit) : undefined;
        const result = await inventarioService.listarEntregasPendientes(estacionId, { page, limit });
        res.json({ success: true, ...result });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const obtenerEntregasPorDistribuidorHandler = async (req: Request, res: Response) => {
    try {
        const distribuidorId = req.query.distribuidorId as string;
        if (!distribuidorId) {
            res.status(400).json({ success: false, message: 'Se requiere distribuidorId' });
            return;
        }
        const page = req.query.page ? Number(req.query.page) : undefined;
        const limit = req.query.limit ? Number(req.query.limit) : undefined;
        const result = await inventarioService.listarEntregasPorDistribuidor(distribuidorId, { page, limit });
        res.json({ success: true, ...result });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

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
            message: 'Entrega registrada como pendiente de confirmación para la estación',
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

export const confirmarEntregaHandler = async (req: Request, res: Response) => {
    try {
        const validData = confirmarEntregaSchema.parse({
            ...req.body,
            entregaId: req.params.id,
        });
        const result = await inventarioService.confirmarEntrega(validData, {
            usuarioId: req.user?.userId,
            ip: req.ip,
            userAgent: typeof req.get === 'function' ? req.get('user-agent') || undefined : undefined,
        });
        res.status(200).json({
            success: true,
            message: 'Entrega confirmada e inventario actualizado con éxito',
            alerta: result.alerta,
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

export const registrarEntradaDirectaHandler = async (req: Request, res: Response) => {
    try {
        const validData = entradaDirectaSchema.parse(req.body);
        const result = await inventarioService.registrarEntradaDirecta(validData, {
            usuarioId: req.user?.userId,
            ip: req.ip,
            userAgent: typeof req.get === 'function' ? req.get('user-agent') || undefined : undefined,
        });
        res.status(201).json({
            success: true,
            message: `Entrada directa registrada: ${result.transaccion.galones} gal cargados`,
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

export const obtenerProximaRemisionHandler = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'No autenticado' });
            return;
        }
        // Look up distribuidorId from DB — it's NOT in the JWT
        const usuario = await prisma.usuario.findUnique({
            where: { id: userId },
            select: { distribuidorGestionado: { select: { id: true } } },
        });
        const distribuidorId = usuario?.distribuidorGestionado?.id;
        if (!distribuidorId) {
            res.status(400).json({ success: false, message: 'Usuario no vinculado a una distribuidora' });
            return;
        }
        const result = await inventarioService.proximaRemision(distribuidorId);
        res.json({ success: true, data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const confirmarEntregaMultiTanqueHandler = async (req: Request, res: Response) => {
    try {
        const validData = confirmarEntregaMultiTanqueSchema.parse({
            ...req.body,
            entregaId: req.params.id,
        });
        const result = await inventarioService.confirmarEntregaMultiTanque(validData, {
            usuarioId: req.user?.userId,
            ip: req.ip,
            userAgent: typeof req.get === 'function' ? req.get('user-agent') || undefined : undefined,
        });
        res.json({
            success: true,
            message: `Entrega confirmada y distribuida en ${result.transacciones.length} tanque(s)`,
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
