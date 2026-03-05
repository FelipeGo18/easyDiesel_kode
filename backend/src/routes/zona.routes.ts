import { Router } from 'express';
import { obtenerZonasHandler, obtenerZonaPorIdHandler, crearZonaHandler, actualizarZonaHandler } from '../controllers/zona.controller';

const router = Router();

router.get('/', obtenerZonasHandler);
router.get('/:id', obtenerZonaPorIdHandler);
router.post('/', crearZonaHandler);
router.put('/:id', actualizarZonaHandler);

export default router;
