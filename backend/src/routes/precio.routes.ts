import { Router } from 'express';
import {
    obtenerPreciosHandler,
    obtenerPrecioPorIdHandler,
    crearPrecioHandler,
    actualizarPrecioHandler,
    consultarPrecioActualHandler
} from '../controllers/precio.controller';

const router = Router();

// Endpoint publico para consultar precios vigentes
/**
 * @swagger
 * /api/precios/consultar:
 *   get:
 *     summary: Consulta pública del precio vigente por estación o zona
 *     tags: [Precios]
 *     parameters:
 *       - in: query
 *         name: zonaId
 *         schema: { type: string }
 *       - in: query
 *         name: estacionId
 *         schema: { type: string }
 *       - in: query
 *         name: tipoCombustible
 *         schema: { type: string }
 *       - in: query
 *         name: tipoServicio
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Precio actual aplicable
 */
router.get('/consultar', consultarPrecioActualHandler);

/**
 * @swagger
 * /api/precios:
 *   get:
 *     summary: Lista todos los precios registrados
 *     tags: [Precios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de precios
 */
router.get('/', obtenerPreciosHandler);

/**
 * @swagger
 * /api/precios/{id}:
 *   get:
 *     summary: Obtiene precio por ID
 *     tags: [Precios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Datos de precio
 */
router.get('/:id', obtenerPrecioPorIdHandler);

/**
 * @swagger
 * /api/precios:
 *   post:
 *     summary: Registra un nuevo precio vigente
 *     tags: [Precios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tipoCombustible, tipoServicio, zonaId, precioGalon, decretoId, vigenciaDesde]
 *             properties:
 *               tipoCombustible: { type: string, enum: [ACPM, GASOLINA_CORRIENTE, GASOLINA_EXTRA] }
 *               tipoServicio: { type: string, enum: [PARTICULAR, PUBLICO, DIPLOMATICO, OFICIAL, CARGA] }
 *               zonaId: { type: string }
 *               precioGalon: { type: number }
 *               subsidioGalon: { type: number }
 *               decretoId: { type: string }
 *               vigenciaDesde: { type: string, format: date-time }
 *               vigenciaHasta: { type: string, format: date-time }
 *               activo: { type: boolean }
 *     responses:
 *       201:
 *         description: Precio creado
 */
router.post('/', crearPrecioHandler);

/**
 * @swagger
 * /api/precios/{id}:
 *   put:
 *     summary: Actualiza un precio
 *     tags: [Precios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Precio actualizado
 */
router.put('/:id', actualizarPrecioHandler);

export default router;
