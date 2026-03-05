import { Router } from 'express';
import { generarReporteHandler, obtenerReportesHandler } from '../controllers/reporte.controller';

const router = Router();

/**
 * @swagger
 * /api/reportes:
 *   get:
 *     summary: Lista todos los reportes generados
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista paginada de reportes
 */
router.get('/', obtenerReportesHandler);

/**
 * @swagger
 * /api/reportes:
 *   post:
 *     summary: Genera y descarga un nuevo reporte
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tipo]
 *             properties:
 *               tipo:
 *                 type: string
 *                 enum: [INVENTARIO, TRANSACCIONES, PRECIOS, AUDITORIA, NORMATIVO]
 *               formato:
 *                 type: string
 *                 enum: [PDF, EXCEL, CSV]
 *                 default: PDF
 *               parametros:
 *                 type: object
 *                 description: Filtros para el reporte (estacionId, zonaId, fechas)
 *     responses:
 *       201:
 *         description: Archivo binario (PDF/Excel/CSV) adjunto
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.post('/', generarReporteHandler);

export default router;
