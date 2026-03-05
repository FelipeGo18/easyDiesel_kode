import { Router } from 'express';
import { obtenerDecretosHandler, obtenerDecretoPorIdHandler, crearDecretoHandler, actualizarDecretoHandler } from '../controllers/decreto.controller';

const router = Router();

router.get('/', obtenerDecretosHandler);
router.get('/:id', obtenerDecretoPorIdHandler);
router.post('/', crearDecretoHandler);
router.put('/:id', actualizarDecretoHandler);

export default router;
