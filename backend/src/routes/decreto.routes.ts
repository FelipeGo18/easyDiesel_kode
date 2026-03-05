import { Router } from 'express';
import { obtenerDecretosHandler, obtenerDecretoPorIdHandler, crearDecretoHandler, actualizarDecretoHandler } from '../controllers/decreto.controller';

const router = Router();

/**
 * @swagger
 * /api/decretos:
 *   get:
 *     summary: Lista los decretos normativos
 *     tags: [Normativa]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de decretos
 */
router.get('/', obtenerDecretosHandler);

/**
 * @swagger
 * /api/decretos/{id}:
 *   get:
 *     summary: Obtiene un decreto por ID
 *     tags: [Normativa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Datos del decreto
 */
router.get('/:id', obtenerDecretoPorIdHandler);

/**
 * @swagger
 * /api/decretos:
 *   post:
 *     summary: Registra un nuevo decreto normativo
 *     tags: [Normativa]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [numero, titulo, fechaExpedicion, fechaVigencia]
 *             properties:
 *               numero: { type: string }
 *               titulo: { type: string }
 *               descripcion: { type: string }
 *               entidad: { type: string }
 *               fechaExpedicion: { type: string, format: date-time }
 *               fechaVigencia: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Decreto creado
 */
router.post('/', crearDecretoHandler);

/**
 * @swagger
 * /api/decretos/{id}:
 *   put:
 *     summary: Actualiza la información de un decreto
 *     tags: [Normativa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Decreto actualizado
 */
router.put('/:id', actualizarDecretoHandler);

export default router;
