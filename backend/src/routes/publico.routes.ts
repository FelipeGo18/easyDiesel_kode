import { Router } from 'express';
import {
    getPreciosHandler,
    getEstacionesHandler,
    getZonasHandler,
    getDecretosHandler
} from '../controllers/publico.controller';

const publicoRouter = Router();

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

export { publicoRouter };
