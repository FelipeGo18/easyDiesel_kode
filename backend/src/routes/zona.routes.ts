import { Router } from 'express';
import { obtenerZonasHandler, obtenerZonaPorIdHandler, crearZonaHandler, actualizarZonaHandler } from '../controllers/zona.controller';

const router = Router();

/**
 * @swagger
 * /api/zonas:
 *   get:
 *     summary: Lista las zonas de distribución (Interconectadas, No interconectadas)
 *     tags: [Zonas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de zonas
 */
router.get('/', obtenerZonasHandler);

/**
 * @swagger
 * /api/zonas/{id}:
 *   get:
 *     summary: Obtiene una zona por ID
 *     tags: [Zonas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Detalles de la zona
 */
router.get('/:id', obtenerZonaPorIdHandler);

/**
 * @swagger
 * /api/zonas:
 *   post:
 *     summary: Crea una nueva zona
 *     tags: [Zonas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre]
 *             properties:
 *               nombre: { type: string }
 *               tipoZona: { type: string, enum: [INTERCONECTADA, NO_INTERCONECTADA] }
 *               departamentos: { type: array, items: { type: string } }
 *               descripcion: { type: string }
 *     responses:
 *       201:
 *         description: Zona creada
 */
router.post('/', crearZonaHandler);

/**
 * @swagger
 * /api/zonas/{id}:
 *   put:
 *     summary: Actualiza una zona
 *     tags: [Zonas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Zona actualizada
 */
router.put('/:id', actualizarZonaHandler);

export default router;
