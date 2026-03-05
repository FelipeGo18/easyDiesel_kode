import { Router } from 'express';
import { obtenerResumenHandler } from '../controllers/dashboard.controller';

const router = Router();

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Obtiene estadísticas agregadas del sistema (M7)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resumen general de usuarios, inventario, normativas y transacciones
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado (solo admin)
 */
router.get('/', obtenerResumenHandler);

export default router;
