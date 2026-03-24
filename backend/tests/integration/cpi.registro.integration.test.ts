/**
 * CPI-001, CPI-002, CPI-003
 * Integración UC-01 ↔ UC-05: Registro de Consumo y Validación de Datos
 *
 * Referencia: Pruebas_Integracion_EasyDiesel.md — sección 2.1.4
 */

import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/utils/prisma';
import { buildCpiContext, resetCpiState, teardownCpiContext, CpiContext } from '../helpers/cpi.context';

jest.setTimeout(30000);

describe('CPI — UC-01 con UC-05: Registro de Consumo y Validación', () => {
    const suffix = `${Date.now()}r`;
    let ctx: CpiContext;

    beforeAll(async () => {
        ctx = await buildCpiContext(suffix);
    });

    beforeEach(async () => {
        await resetCpiState(ctx);
    });

    afterAll(async () => {
        await teardownCpiContext(ctx);
    });

    // ================================================================
    // CPI-001 — Registro exitoso con trazabilidad en auditoría
    // ================================================================
    describe('CPI-001: Registro de Consumo con Validación Exitosa', () => {
        it('Paso 1-3: POST con datos válidos retorna 201 y descuenta el inventario del tanque', async () => {
            const response = await request(app)
                .post('/api/inventario/transacciones')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({
                    estacionId: ctx.estacionId,
                    tanqueId: ctx.tanqueId,
                    tipoCombustible: 'ACPM',
                    tipoServicio: 'PARTICULAR',
                    galones: 50,
                    placaVehiculo: 'ABC123',
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBeDefined();
            expect(response.body.data.estado).toBe('COMPLETADA');

            const tanque = await prisma.tanque.findUniqueOrThrow({ where: { id: ctx.tanqueId } });
            expect(Number(tanque.nivelActual)).toBe(950); // 1000 - 50
        });

        it('Paso 4: El log de auditoría registra la transacción con acción REGISTRAR_TRANSACCION_SALIDA', async () => {
            const txRes = await request(app)
                .post('/api/inventario/transacciones')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({
                    estacionId: ctx.estacionId,
                    tanqueId: ctx.tanqueId,
                    tipoCombustible: 'ACPM',
                    tipoServicio: 'PARTICULAR',
                    galones: 10,
                    placaVehiculo: 'DEF456',
                });
            expect(txRes.status).toBe(201);
            const txId = txRes.body.data.id;

            const auditRes = await request(app)
                .get('/api/auditoria')
                .set('Authorization', `Bearer ${ctx.adminToken}`);

            expect(auditRes.status).toBe(200);
            const items = auditRes.body.data?.data ?? auditRes.body.data ?? auditRes.body;
            const entry = (Array.isArray(items) ? items : []).find(
                (l: any) => l.entidadId === txId
            );
            expect(entry).toBeDefined();
            expect(entry.accion).toBe('REGISTRAR_TRANSACCION_SALIDA');
            expect(entry.modulo).toBe('inventario');
        });
    });

    // ================================================================
    // CPI-002 — Rechazo por datos de servicio inválidos (Zod UC-05)
    // ================================================================
    describe('CPI-002: Registro con Tipo de Servicio o Combustible Inválido', () => {
        it('POST con tipoServicio fuera del enum retorna 400 y no crea ninguna transacción', async () => {
            const countBefore = await prisma.transaccionCombustible.count({
                where: { estacionId: ctx.estacionId },
            });

            const response = await request(app)
                .post('/api/inventario/transacciones')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({
                    estacionId: ctx.estacionId,
                    tanqueId: ctx.tanqueId,
                    tipoCombustible: 'ACPM',
                    tipoServicio: 'INVALIDO',
                    galones: 30,
                });

            expect(response.status).toBe(400);

            const countAfter = await prisma.transaccionCombustible.count({
                where: { estacionId: ctx.estacionId },
            });
            expect(countAfter).toBe(countBefore);
        });

        it('POST con tipoCombustible inválido retorna 400', async () => {
            const response = await request(app)
                .post('/api/inventario/transacciones')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({
                    estacionId: ctx.estacionId,
                    tanqueId: ctx.tanqueId,
                    tipoCombustible: 'KEROSENE',
                    tipoServicio: 'PARTICULAR',
                    galones: 10,
                });
            expect(response.status).toBe(400);
        });

        it('POST sin tipoServicio retorna 400', async () => {
            const response = await request(app)
                .post('/api/inventario/transacciones')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({
                    estacionId: ctx.estacionId,
                    tanqueId: ctx.tanqueId,
                    tipoCombustible: 'ACPM',
                    galones: 30,
                });
            expect(response.status).toBe(400);
        });
    });

    // ================================================================
    // CPI-003 — Rechazo por volumen fuera de rango
    // ================================================================
    describe('CPI-003: Registro con Volumen Fuera de Rango', () => {
        it('POST con galones negativos retorna 400 (Zod: positive)', async () => {
            const response = await request(app)
                .post('/api/inventario/transacciones')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({
                    estacionId: ctx.estacionId,
                    tanqueId: ctx.tanqueId,
                    tipoCombustible: 'ACPM',
                    tipoServicio: 'PARTICULAR',
                    galones: -5,
                });
            expect(response.status).toBe(400);
        });

        it('POST con galones = 0 retorna 400 (Zod: positive)', async () => {
            const response = await request(app)
                .post('/api/inventario/transacciones')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({
                    estacionId: ctx.estacionId,
                    tanqueId: ctx.tanqueId,
                    tipoCombustible: 'ACPM',
                    tipoServicio: 'PARTICULAR',
                    galones: 0,
                });
            expect(response.status).toBe(400);
        });

        it('POST con galones que exceden el stock disponible retorna error de negocio', async () => {
            const response = await request(app)
                .post('/api/inventario/transacciones')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({
                    estacionId: ctx.estacionId,
                    tanqueId: ctx.tanqueId,
                    tipoCombustible: 'ACPM',
                    tipoServicio: 'PARTICULAR',
                    galones: 1500, // tanque tiene 1000
                });
            expect([400, 422, 500]).toContain(response.status);
        });
    });
});
