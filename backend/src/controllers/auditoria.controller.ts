import { Request, Response } from 'express';
import { auditoriaService } from '../services/auditoria.service';

export const obtenerLogsHandler = async (req: Request, res: Response) => {
    try {
        const { usuarioId, modulo, accion, entidad, desde, hasta, page, limit } = req.query;
        
        // Restricción por rol Estación
        let estacionIdFiltro: string | undefined = undefined;
        if (req.user?.rol === 'estacion') {
            const usuario = await auditoriaService.obtenerUsuarioConEstacion(req.user.userId);
            if (!usuario?.estacionGestionada?.id) {
                res.status(403).json({ success: false, message: 'Usuario de estación no tiene una estación asignada' });
                return;
            }
            estacionIdFiltro = usuario.estacionGestionada.id;
        }

        const resultado = await auditoriaService.obtenerLogs({
            usuarioId: usuarioId as string,
            modulo: modulo as string,
            accion: accion as string,
            entidad: entidad as string,
            desde: desde as string,
            hasta: hasta as string,
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            estacionId: estacionIdFiltro
        });
        res.json({ success: true, ...resultado });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const obtenerLogPorIdHandler = async (req: Request, res: Response) => {
    try {
        const log = await auditoriaService.obtenerLogPorId(req.params.id as string);
        res.json({ success: true, data: log });
    } catch (error: any) {
        const status = error.message === 'Log de auditoria no encontrado' ? 404 : 500;
        res.status(status).json({ success: false, message: error.message });
    }
};
