import { Router } from 'express';
import { obtenerEntregasPendientesHandler, obtenerEntregasPorDistribuidorHandler, registrarEntregaHandler, confirmarEntregaHandler, registrarTransaccionHandler, cierreTurnoHandler, registrarEntradaDirectaHandler, obtenerTransaccionesHandler, cancelarEntregaHandler } from '../controllers/inventario.controller';
import { can } from '../middleware/auth';

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
router.post('/cierre-turno', can('inventario:escribir'), cierreTurnoHandler);

router.get('/entregas/pendientes', obtenerEntregasPendientesHandler);

router.get('/entregas', obtenerEntregasPorDistribuidorHandler);

/** POST /inventario/entregas/directa — Entrada directa sin distribuidor previo */
router.post('/entregas/directa', can('inventario:escribir'), registrarEntradaDirectaHandler);

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
 *         description: Entrega registrada como pendiente de confirmación
 */
router.post('/entregas', can('inventario:escribir'), registrarEntregaHandler); // Registro de abastecimiento (Distribuidor -> Estación/Tanque)

/**
 * @swagger
 * /api/inventario/entregas/{id}/confirmar:
 *   post:
 *     summary: Confirma la recepción real de una entrega pendiente
 *     tags: [Inventario]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [estacionId, tanqueId, galonesRecibidos]
 *             properties:
 *               estacionId: { type: string }
 *               tanqueId: { type: string }
 *               galonesRecibidos: { type: number }
 *     responses:
 *       200:
 *         description: Entrega confirmada y tanque actualizado
 */
router.post('/entregas/:id/confirmar', can('inventario:escribir'), confirmarEntregaHandler);

/** DELETE /inventario/entregas/:id — Cancela (elimina) una entrega pendiente */
router.delete('/entregas/:id', can('inventario:escribir'), cancelarEntregaHandler);

/**
 * @swagger
 * /api/inventario/transacciones:
 *   get:
 *     summary: Lista transacciones de una estación o por placa de vehículo
 *     tags: [Inventario]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: estacionId
 *       - in: query
 *         name: placaVehiculo
 *       - in: query
 *         name: page
 *       - in: query
 *         name: limit
 *     responses:
 *       200:
 *         description: Lista paginada de transacciones
 */
router.get('/transacciones', obtenerTransaccionesHandler);

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
router.post('/transacciones', can('inventario:escribir'), registrarTransaccionHandler); // Registro de ventas o salidas de combustible

export default router;
