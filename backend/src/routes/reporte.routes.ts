import { Router } from 'express';
import { generarReporteHandler, obtenerReportesHandler } from '../controllers/reporte.controller';

const router = Router();

router.get('/', obtenerReportesHandler);
router.post('/', generarReporteHandler);

export default router;
