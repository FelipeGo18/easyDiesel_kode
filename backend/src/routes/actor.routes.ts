import { Router } from 'express';
import {
    obtenerEstacionesHandler,
    obtenerEstacionPorIdHandler,
    crearEstacionHandler,
    actualizarEstacionHandler,
    obtenerDistribuidoresHandler,
    obtenerDistribuidorPorIdHandler,
    crearDistribuidorHandler,
    actualizarDistribuidorHandler
} from '../controllers/actor.controller';

const actorRouter = Router();

// ==========================================
// NOTA: Estas rutas deben estar protegidas.
// Middleware JWT y roles aplicados en index.ts
// ==========================================

// --- RUTAS ESTACIONES ---
/**
 * @swagger
 * /api/actores/estaciones:
 *   get:
 *     summary: Lista las estaciones de servicio
 *     tags: [Estaciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de estaciones
 */
actorRouter.get('/estaciones', obtenerEstacionesHandler);

/**
 * @swagger
 * /api/actores/estaciones/{id}:
 *   get:
 *     summary: Obtiene una estación por ID
 *     tags: [Estaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos de la estación
 */
actorRouter.get('/estaciones/:id', obtenerEstacionPorIdHandler);

/**
 * @swagger
 * /api/actores/estaciones:
 *   post:
 *     summary: Crea una nueva estación de servicio
 *     tags: [Estaciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, nit, direccion, ciudad, departamento, codigoSicom, zonaId]
 *             properties:
 *               nombre: { type: string }
 *               nit: { type: string }
 *               direccion: { type: string }
 *               ciudad: { type: string }
 *               departamento: { type: string }
 *               codigoSicom: { type: string }
 *               zonaId: { type: string }
 *               latitud: { type: number }
 *               longitud: { type: number }
 *     responses:
 *       201:
 *         description: Estación creada
 */
actorRouter.post('/estaciones', crearEstacionHandler);

/**
 * @swagger
 * /api/actores/estaciones/{id}:
 *   put:
 *     summary: Actualiza una estación existente
 *     tags: [Estaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estación actualizada
 */
actorRouter.put('/estaciones/:id', actualizarEstacionHandler);

// --- RUTAS DISTRIBUIDORES ---
/**
 * @swagger
 * /api/actores/distribuidores:
 *   get:
 *     summary: Lista los distribuidores
 *     tags: [Distribuidores]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de distribuidores
 */
actorRouter.get('/distribuidores', obtenerDistribuidoresHandler);

/**
 * @swagger
 * /api/actores/distribuidores/{id}:
 *   get:
 *     summary: Obtiene un distribuidor por ID
 *     tags: [Distribuidores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos del distribuidor
 */
actorRouter.get('/distribuidores/:id', obtenerDistribuidorPorIdHandler);

/**
 * @swagger
 * /api/actores/distribuidores:
 *   post:
 *     summary: Crea un nuevo distribuidor
 *     tags: [Distribuidores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, nit, tipo, direccion, ciudad, departamento]
 *             properties:
 *               nombre: { type: string }
 *               nit: { type: string }
 *               tipo: { type: string, enum: [MAYORISTA, REGULADO] }
 *               direccion: { type: string }
 *               ciudad: { type: string }
 *               departamento: { type: string }
 *     responses:
 *       201:
 *         description: Distribuidor creado
 */
actorRouter.post('/distribuidores', crearDistribuidorHandler);

/**
 * @swagger
 * /api/actores/distribuidores/{id}:
 *   put:
 *     summary: Actualiza un distribuidor
 *     tags: [Distribuidores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Distribuidor actualizado
 */
actorRouter.put('/distribuidores/:id', actualizarDistribuidorHandler);

export default actorRouter;
