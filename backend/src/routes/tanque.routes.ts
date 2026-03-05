import { Router } from 'express';
import {
    obtenerTanquesHandler,
    obtenerTanquePorIdHandler,
    crearTanqueHandler,
    actualizarTanqueHandler
} from '../controllers/tanque.controller';

const router = Router();

// Endpoint bajo /api/tanques
router.get('/', obtenerTanquesHandler);
router.get('/:id', obtenerTanquePorIdHandler);
router.post('/', crearTanqueHandler);
router.put('/:id', actualizarTanqueHandler);

export default router;
