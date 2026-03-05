import { Router } from 'express';
import { registrarEntregaHandler, registrarTransaccionHandler, cierreTurnoHandler } from '../controllers/inventario.controller';

const router = Router();

// Endpoints bajo /api/inventario

/**
 * @swagger
 * /api/inventario/cierre-turno:
 *   post:
 *     summary: Registra un cierre de turno comparando niveles físicos vs teóricos
 *     tags: [Inventario]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [estacionId, tanqueId, nivelFisico]
 *             properties:
 *               estacionId: { type: string }
 *               tanqueId: { type: string }
 *               nivelFisico: { type: number }
 *               observaciones: { type: string }
 *     responses:
 *       200:
 *         description: Cierre de turno procesado, retorna diferencia
 */
router.post('/cierre-turno', cierreTurnoHandler);

/**
 * @swagger
 * /api/inventario/entregas:
 *   post:
 *     summary: Registra una entrega o abastecimiento de combustible (entrada)
 *     tags: [Inventario]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [distribuidorId, estacionId, tanqueId, tipoCombustible, galones, precioUnitario, numeroRemision, fechaEntrega]
 *             properties:
 *               distribuidorId: { type: string }
 *               estacionId: { type: string }
 *               tanqueId: { type: string }
 *               tipoCombustible: { type: string, enum: [ACPM, GASOLINA_CORRIENTE, GASOLINA_EXTRA] }
 *               galones: { type: number }
 *               precioUnitario: { type: number }
 *               numeroRemision: { type: string }
 *               fechaEntrega: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Entrega registrada correctamente, suma al tanque
 */
router.post('/entregas', registrarEntregaHandler); // Registro de abastecimiento (Distribuidor -> Estación/Tanque)

/**
 * @swagger
 * /api/inventario/transacciones:
 *   post:
 *     summary: Registra una venta o salida de combustible
 *     tags: [Inventario]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [estacionId, tanqueId, tipo, tipoCombustible, tipoServicio, galones, precioUnitario]
 *             properties:
 *               estacionId: { type: string }
 *               tanqueId: { type: string }
 *               tipo: { type: string, enum: [SALIDA] }
 *               tipoCombustible: { type: string, enum: [ACPM, GASOLINA_CORRIENTE, GASOLINA_EXTRA] }
 *               tipoServicio: { type: string, enum: [PARTICULAR, PUBLICO, DIPLOMATICO, OFICIAL, CARGA] }
 *               galones: { type: number }
 *               precioUnitario: { type: number }
 *               placaVehiculo: { type: string }
 *     responses:
 *       201:
 *         description: Transacción registrada correctamente, resta del tanque
 */
router.post('/transacciones', registrarTransaccionHandler); // Registro de ventas o salidas de combustible

export default router;
