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
actorRouter.get('/estaciones', obtenerEstacionesHandler);
actorRouter.get('/estaciones/:id', obtenerEstacionPorIdHandler);
actorRouter.post('/estaciones', crearEstacionHandler);
actorRouter.put('/estaciones/:id', actualizarEstacionHandler);

// --- RUTAS DISTRIBUIDORES ---
actorRouter.get('/distribuidores', obtenerDistribuidoresHandler);
actorRouter.get('/distribuidores/:id', obtenerDistribuidorPorIdHandler);
actorRouter.post('/distribuidores', crearDistribuidorHandler);
actorRouter.put('/distribuidores/:id', actualizarDistribuidorHandler);

export default actorRouter;
