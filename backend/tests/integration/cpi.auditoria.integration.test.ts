/**
 * CPI-004, CPI-008
 * Integración UC-01/UC-05 ↔ UC-06: Trazabilidad y Auditoría
 *
 * Referencia: Pruebas_Integracion_EasyDiesel.md — sección 2.1.4
 */

import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/utils/prisma';
import { buildCpiContext, resetCpiState, teardownCpiContext, CpiContext } from '../helpers/cpi.context';

jest.setTimeout(30000);

describe('CPI — UC-01/UC-05 con UC-06: Trazabilidad y Auditoría', () => {
    const suffix = `${Date.now()}a`;
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
    // CPI-004 — Log de auditoría generado automáticamente tras registro
    // ================================================================
    describe('CPI-004: Auditoría Generada Tras Registro Exitoso', () => {
        it('Cada transacción exitosa genera exactamente un log de auditoría nuevo', async () => {
            const countBefore = await prisma.auditoriaLog.count({
                where: { usuarioId: ctx.userId, accion: 'REGISTRAR_TRANSACCION_SALIDA' },
            });

            const txRes = await request(app)
                .post('/api/inventario/transacciones')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({
                    estacionId: ctx.estacionId,
                    tanqueId: ctx.tanqueId,
                    tipoCombustible: 'ACPM',
                    tipoServicio: 'PARTICULAR',
                    galones: 5,
                    placaVehiculo: 'GHI789',
                });
            expect(txRes.status).toBe(201);

            const countAfter = await prisma.auditoriaLog.count({
                where: { usuarioId: ctx.userId, accion: 'REGISTRAR_TRANSACCION_SALIDA' },
            });
            expect(countAfter).toBe(countBefore + 1);
        });

        it('El log contiene datosAntes (nivelTanqueAntes) y datosDespues con trazabilidad completa', async () => {
            const txRes = await request(app)
                .post('/api/inventario/transacciones')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({
                    estacionId: ctx.estacionId,
                    tanqueId: ctx.tanqueId,
                    tipoCombustible: 'ACPM',
                    tipoServicio: 'PARTICULAR',
                    galones: 5,
                    placaVehiculo: 'JKL012',
                });
            expect(txRes.status).toBe(201);
            const txId = txRes.body.data.id;

            const log = await prisma.auditoriaLog.findFirst({
                where: { entidadId: txId, usuarioId: ctx.userId },
            });
            expect(log).toBeDefined();
            expect(log?.accion).toBe('REGISTRAR_TRANSACCION_SALIDA');
            expect(log?.entidad).toBe('transaccion_combustible');
            expect((log?.datosAntes as any)?.nivelTanqueAntes).toBeDefined();
            expect((log?.datosDespues as any)?.galones).toBe(5);
            expect((log?.datosDespues as any)?.tipoCombustible).toBe('ACPM');
            expect((log?.datosDespues as any)?.precioTotal).toBeDefined();
        });

        it('Una transacción rechazada por Zod NO genera entrada de auditoría', async () => {
            const countBefore = await prisma.auditoriaLog.count({
                where: { usuarioId: ctx.userId, accion: 'REGISTRAR_TRANSACCION_SALIDA' },
            });

            await request(app)
                .post('/api/inventario/transacciones')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({
                    estacionId: ctx.estacionId,
                    tanqueId: ctx.tanqueId,
                    tipoCombustible: 'ACPM',
                    tipoServicio: 'NO_VALIDO',
                    galones: 5,
                });

            const countAfter = await prisma.auditoriaLog.count({
                where: { usuarioId: ctx.userId, accion: 'REGISTRAR_TRANSACCION_SALIDA' },
            });
            expect(countAfter).toBe(countBefore);
        });
    });

    // ================================================================
    // CPI-008 — Auditoría diferenciada: exitosas vs. fallidas
    // ================================================================
    describe('CPI-008: Auditoría de Operaciones de Validación (UC-05 ↔ UC-06)', () => {
        it('Transacción inválida NO genera log; transacción válida SÍ genera exactamente un log', async () => {
            const countBefore = await prisma.auditoriaLog.count({
                where: { usuarioId: ctx.userId },
            });

            await request(app)
                .post('/api/inventario/transacciones')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({
                    estacionId: ctx.estacionId,
                    tanqueId: ctx.tanqueId,
                    tipoCombustible: 'ACPM',
                    tipoServicio: 'NO_VALIDO',
                    galones: 10,
                });

            const countAfterInvalid = await prisma.auditoriaLog.count({
                where: { usuarioId: ctx.userId },
            });
            expect(countAfterInvalid).toBe(countBefore);

            const txRes = await request(app)
                .post('/api/inventario/transacciones')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({
                    estacionId: ctx.estacionId,
                    tanqueId: ctx.tanqueId,
                    tipoCombustible: 'ACPM',
                    tipoServicio: 'PARTICULAR',
                    galones: 5,
                    placaVehiculo: 'MNO345',
                });
            expect(txRes.status).toBe(201);

            const countAfterValid = await prisma.auditoriaLog.count({
                where: { usuarioId: ctx.userId },
            });
            expect(countAfterValid).toBe(countBefore + 1);
        });

        it('El log de auditoría es inmutable: no existe endpoint DELETE /api/auditoria/:id', async () => {
            const log = await prisma.auditoriaLog.findFirst({
                where: { usuarioId: ctx.userId },
            });
            if (log) {
                const response = await request(app)
                    .delete(`/api/auditoria/${log.id}`)
                    .set('Authorization', `Bearer ${ctx.adminToken}`);
                expect([404, 405]).toContain(response.status);
            }
        });

        it('El cierre de turno también genera un log de auditoría con acción CIERRE_TURNO', async () => {
            const countBefore = await prisma.auditoriaLog.count({
                where: { usuarioId: ctx.userId, accion: 'CIERRE_TURNO' },
            });

            const response = await request(app)
                .post('/api/inventario/cierre-turno')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({
                    estacionId: ctx.estacionId,
                    tanqueId: ctx.tanqueId,
                    nivelFisico: 980,
                    observaciones: 'Cierre test CPI-008',
                });

            expect(response.status).toBe(200);

            const countAfter = await prisma.auditoriaLog.count({
                where: { usuarioId: ctx.userId, accion: 'CIERRE_TURNO' },
            });
            expect(countAfter).toBe(countBefore + 1);
        });
    });
});
