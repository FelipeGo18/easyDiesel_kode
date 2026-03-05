import { Router } from 'express';
import { obtenerLogsHandler, obtenerLogPorIdHandler } from '../controllers/auditoria.controller';

const router = Router();

router.get('/', obtenerLogsHandler);
router.get('/:id', obtenerLogPorIdHandler);

export default router;
