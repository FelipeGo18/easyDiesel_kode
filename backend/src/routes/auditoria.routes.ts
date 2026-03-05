import { Router } from 'express';
import { obtenerLogsHandler, obtenerLogPorIdHandler } from '../controllers/auditoria.controller';

const router = Router();

/**
 * @swagger
 * /api/auditoria:
 *   get:
 *     summary: Consulta y filtra los logs de auditoría (M5)
 *     tags: [Auditoria]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: modulo
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lista paginada de logs de auditoría
 */
router.get('/', obtenerLogsHandler);

/**
 * @swagger
 * /api/auditoria/{id}:
 *   get:
 *     summary: Obtiene los detalles de un log específico
 *     tags: [Auditoria]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Log detallado (datosAntes y datosDespues)
 */
router.get('/:id', obtenerLogPorIdHandler);

export default router;
