import { Router } from 'express';
import {
    obtenerTanquesHandler,
    obtenerTanquePorIdHandler,
    crearTanqueHandler,
    actualizarTanqueHandler
} from '../controllers/tanque.controller';

const router = Router();

// Endpoint bajo /api/tanques

/**
 * @swagger
 * /api/tanques:
 *   get:
 *     summary: Lista los tanques de combustible asociados a las estaciones
 *     tags: [Tanques]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: estacionId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lista de tanques
 */
router.get('/', obtenerTanquesHandler);

/**
 * @swagger
 * /api/tanques/{id}:
 *   get:
 *     summary: Obtiene los detalles y nivel actual de un tanque
 *     tags: [Tanques]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Datos del tanque
 */
router.get('/:id', obtenerTanquePorIdHandler);

/**
 * @swagger
 * /api/tanques:
 *   post:
 *     summary: Crea y registra un nuevo tanque
 *     tags: [Tanques]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, capacidadGalones, nivelMinimo, tipoCombustible, estacionId]
 *             properties:
 *               nombre: { type: string }
 *               capacidadGalones: { type: number }
 *               nivelMinimo: { type: number }
 *               tipoCombustible: { type: string, enum: [ACPM, GASOLINA_CORRIENTE, GASOLINA_EXTRA] }
 *               estacionId: { type: string }
 *     responses:
 *       201:
 *         description: Tanque creado (Nivel actual iniciado en 0)
 */
router.post('/', crearTanqueHandler);

/**
 * @swagger
 * /api/tanques/{id}:
 *   put:
 *     summary: Actualiza las configuraciones de un tanque
 *     tags: [Tanques]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Tanque actualizado
 */
router.put('/:id', actualizarTanqueHandler);

export default router;
