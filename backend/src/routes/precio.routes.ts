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
router.get('/consultar', consultarPrecioActualHandler);

router.get('/', obtenerPreciosHandler);
router.get('/:id', obtenerPrecioPorIdHandler);
router.post('/', crearPrecioHandler);
router.put('/:id', actualizarPrecioHandler);

export default router;
