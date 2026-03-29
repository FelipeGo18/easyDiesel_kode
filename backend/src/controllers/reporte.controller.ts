import { Request, Response } from 'express';
import { reporteService } from '../services/reporte.service';
import { generarReporteSchema } from '../validators/reporte.validator';
import { ZodError } from 'zod';
import { prisma } from '../utils/prisma';

export const generarReporteHandler = async (req: Request, res: Response) => {
    try {
        const validData = generarReporteSchema.parse(req.body);
        const usuarioId = req.user?.userId;
        const userRol = req.user?.rol;
        if (!usuarioId) { res.status(401).json({ success: false, message: 'No autenticado' }); return; }

        // Restricción por rol Estación: inyectar forzosamente su estacionId
        if (userRol === 'estacion') {
            const usuario = await prisma.usuario.findUnique({
                where: { id: usuarioId },
                include: { estacionGestionada: { select: { id: true, zonaId: true } } }
            });

            if (!usuario?.estacionGestionada?.id) {
                res.status(403).json({ success: false, message: 'Usuario de estación no tiene una estación asignada' });
                return;
            }

            // Sobrescribir parametros para asegurar que solo vea su estacion y zona
            if (!validData.parametros) validData.parametros = {};
            validData.parametros.estacionId = usuario.estacionGestionada.id;
            validData.parametros.zonaId = usuario.estacionGestionada.zonaId;
        }

        const { reporte, fileBuffer } = await reporteService.generarReporte(validData, usuarioId, {
            ip: req.ip || '127.0.0.1',
            userAgent: req.get('user-agent')
        });

        // Nombres y tipos MIME segun formato
        let contentType = 'application/pdf';
        let extension = 'pdf';

        if (validData.formato === 'EXCEL') {
            contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            extension = 'xlsx';
        } else if (validData.formato === 'CSV') {
            contentType = 'text/csv';
            extension = 'csv';
        }

        const filename = `Reporte_${validData.tipo}_${reporte.id.split('-')[0]}.${extension}`;

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Enviar buffer binario directamente (no-JSON)
        res.send(fileBuffer);

    } catch (error: any) {
        if (error instanceof ZodError) { res.status(400).json({ success: false, errors: error.issues }); return; }
        res.status(500).json({ success: false, message: error.message });
    }
};

export const obtenerReportesHandler = async (req: Request, res: Response) => {
    try {
        const { page, limit } = req.query;
        
        // Restricción por rol Estación
        let filtroUsuarioId: string | undefined = undefined;
        if (req.user?.rol === 'estacion') {
            filtroUsuarioId = req.user.userId;
        }

        const resultado = await reporteService.obtenerReportes(
            page ? Number(page) : undefined,
            limit ? Number(limit) : undefined,
            filtroUsuarioId
        );
        res.json({ success: true, ...resultado });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
