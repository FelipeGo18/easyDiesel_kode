import { Router } from 'express';
import { registrarEntregaHandler, registrarTransaccionHandler } from '../controllers/inventario.controller';

const router = Router();

// Endpoints bajo /api/inventario
router.post('/entregas', registrarEntregaHandler); // Registro de abastecimiento (Distribuidor -> Estación/Tanque)
router.post('/transacciones', registrarTransaccionHandler); // Registro de ventas o salidas de combustible

export default router;
