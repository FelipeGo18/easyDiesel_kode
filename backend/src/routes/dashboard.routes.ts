import { Router } from 'express';
import { obtenerResumenHandler } from '../controllers/dashboard.controller';

const router = Router();

router.get('/', obtenerResumenHandler);

export default router;
