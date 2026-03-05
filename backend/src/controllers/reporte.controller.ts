import { Request, Response } from 'express';
import { reporteService } from '../services/reporte.service';
import { generarReporteSchema } from '../validators/reporte.validator';
import { ZodError } from 'zod';

export const generarReporteHandler = async (req: Request, res: Response) => {
    try {
        const validData = generarReporteSchema.parse(req.body);
        const usuarioId = req.user?.userId;
        if (!usuarioId) { res.status(401).json({ success: false, message: 'No autenticado' }); return; }

        const resultado = await reporteService.generarReporte(validData, usuarioId);
        res.status(201).json({
            success: true,
            message: `Reporte de ${validData.tipo} generado exitosamente`,
            data: resultado
        });
    } catch (error: any) {
        if (error instanceof ZodError) { res.status(400).json({ success: false, errors: error.issues }); return; }
        res.status(500).json({ success: false, message: error.message });
    }
};

export const obtenerReportesHandler = async (req: Request, res: Response) => {
    try {
        const { page, limit } = req.query;
        const resultado = await reporteService.obtenerReportes(
            page ? Number(page) : undefined,
            limit ? Number(limit) : undefined
        );
        res.json({ success: true, ...resultado });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
