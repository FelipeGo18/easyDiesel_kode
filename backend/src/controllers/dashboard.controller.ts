import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';

export const obtenerResumenHandler = async (_req: Request, res: Response) => {
    try {
        const resumen = await dashboardService.obtenerResumen();
        res.json({ success: true, data: resumen });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
