import { Router } from 'express';
import {
    getPreciosHandler,
    getEstacionesHandler,
    getZonasHandler,
    getDecretosHandler,
    getEstacionesCercanasHandler,
    getTransaccionesPorPlacaHandler,
} from '../controllers/publico.controller';
import { publicReadRateLimiter } from '../middleware/rate-limit';

const publicoRouter = Router();

publicoRouter.use(publicReadRateLimiter);

/**
 * @swagger
 * /api/publico/precios:
 *   get:
 *     summary: Obtiene precios de combustibles vigentes
 *     tags: [Público]
 */
publicoRouter.get('/precios', getPreciosHandler);

/**
 * @swagger
 * /api/publico/estaciones:
 *   get:
 *     summary: Obtiene listado de estaciones de servicio
 *     tags: [Público]
 */
publicoRouter.get('/estaciones', getEstacionesHandler);

/**
 * @swagger
 * /api/publico/estaciones-cercanas:
 *   get:
 *     summary: Busca gasolineras cercanas usando Google Places
 *     tags: [Público]
 */
publicoRouter.get('/estaciones-cercanas', getEstacionesCercanasHandler);

/**
 * @swagger
 * /api/publico/zonas:
 *   get:
 *     summary: Obtiene las zonas de distribución
 *     tags: [Público]
 */
publicoRouter.get('/zonas', getZonasHandler);

/**
 * @swagger
 * /api/publico/decretos/vigentes:
 *   get:
 *     summary: Obtiene decretos normativos vigentes
 *     tags: [Público]
 */
publicoRouter.get('/decretos/vigentes', getDecretosHandler);

/**
 * @swagger
 * /api/publico/transacciones:
 *   get:
 *     summary: Consulta historial de consumos por placa de vehículo
 *     tags: [Público]
 */
publicoRouter.get('/transacciones', getTransaccionesPorPlacaHandler);

export { publicoRouter };
