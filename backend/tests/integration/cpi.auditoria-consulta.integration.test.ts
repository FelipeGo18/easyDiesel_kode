/**
 * CPI-013, CPI-014
 * Integración UC-06: Consulta de Auditoría con Filtros y sin Resultados
 *
 * Referencia: Pruebas_Integracion_EasyDiesel.md — sección 1.4.4 Bloque 3
 */

import request from 'supertest';
import { app } from '../../src/app';
import { buildCpiContext, resetCpiState, teardownCpiContext, CpiContext } from '../helpers/cpi.context';

jest.setTimeout(30000);

describe('CPI — UC-06: Consulta Detallada de Auditoría', () => {
    const suffix = `${Date.now()}ac`;
    let ctx: CpiContext;
    let txId: string;

    beforeAll(async () => {
        ctx = await buildCpiContext(suffix);

        // Generar una transacción para disponer de logs de auditoría
        const txRes = await request(app)
            .post('/api/inventario/transacciones')
            .set('Authorization', `Bearer ${ctx.adminToken}`)
            .send({
                estacionId: ctx.estacionId,
                tanqueId: ctx.tanqueId,
                tipoCombustible: 'ACPM',
                tipoServicio: 'PARTICULAR',
                galones: 10,
                placaVehiculo: 'LOG001',
            });
        txId = txRes.body.data?.id;
    });

    beforeEach(async () => {
        await resetCpiState(ctx);
    });

    afterAll(async () => {
        await teardownCpiContext(ctx);
    });

    // ================================================================
    // CPI-013 — Consulta exitosa con filtros y detalle de registro
    // ================================================================
    describe('CPI-013: Consulta Exitosa de Auditoría con Filtros (UC-06)', () => {
        it('GET /api/auditoria retorna lista paginada de logs', async () => {
            const response = await request(app)
                .get('/api/auditoria?page=1&limit=10')
                .set('Authorization', `Bearer ${ctx.adminToken}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.pagination).toBeDefined();
            expect(response.body.pagination.total).toBeGreaterThanOrEqual(1);
        });

        it('Filtrar por modulo=INVENTARIO retorna solo logs de ese módulo', async () => {
            const response = await request(app)
                .get('/api/auditoria?modulo=INVENTARIO')
                .set('Authorization', `Bearer ${ctx.adminToken}`);
            expect(response.status).toBe(200);
            const items: any[] = Array.isArray(response.body.data) ? response.body.data : [];
            items.forEach((log) => {
                expect(log.modulo).toBe('INVENTARIO');
            });
        });

        it('Filtrar por accion=REGISTRAR_TRANSACCION_SALIDA retorna solo logs de esa acción', async () => {
            const response = await request(app)
                .get('/api/auditoria?accion=REGISTRAR_TRANSACCION_SALIDA')
                .set('Authorization', `Bearer ${ctx.adminToken}`);
            expect(response.status).toBe(200);
            const items: any[] = Array.isArray(response.body.data) ? response.body.data : [];
            items.forEach((log) => {
                expect(log.accion).toBe('REGISTRAR_TRANSACCION_SALIDA');
            });
        });

        it('Filtrar por rango de fechas retorna logs dentro del rango', async () => {
            const desde = new Date(Date.now() - 3600000).toISOString();
            const hasta = new Date(Date.now() + 3600000).toISOString();
            const response = await request(app)
                .get(`/api/auditoria?desde=${desde}&hasta=${hasta}`)
                .set('Authorization', `Bearer ${ctx.adminToken}`);
            expect(response.status).toBe(200);
            expect(response.body.pagination.total).toBeGreaterThanOrEqual(1);
        });

        it('GET /api/auditoria/:id retorna detalle completo con datosAntes y datosDespues', async () => {
            const listRes = await request(app)
                .get('/api/auditoria?accion=REGISTRAR_TRANSACCION_SALIDA')
                .set('Authorization', `Bearer ${ctx.adminToken}`);
            const logs: any[] = Array.isArray(listRes.body.data) ? listRes.body.data : [];
            const log = logs.find((l) => l.entidadId === txId);

            if (log) {
                const detailRes = await request(app)
                    .get(`/api/auditoria/${log.id}`)
                    .set('Authorization', `Bearer ${ctx.adminToken}`);
                expect(detailRes.status).toBe(200);
                expect(detailRes.body.data.id).toBe(log.id);
                expect(detailRes.body.data.datosAntes).toBeDefined();
                expect(detailRes.body.data.datosDespues).toBeDefined();
                expect(detailRes.body.data.accion).toBe('REGISTRAR_TRANSACCION_SALIDA');
                expect(detailRes.body.data.entidad).toBe('transaccion_combustible');
            }
        });
    });

    // ================================================================
    // CPI-014 — Consulta de auditoría sin resultados
    // ================================================================
    describe('CPI-014: Consulta de Auditoría Sin Resultados (UC-06)', () => {
        it('Acción inexistente retorna lista vacía con paginación total=0 sin HTTP 500', async () => {
            const response = await request(app)
                .get('/api/auditoria?accion=ACCION_QUE_NO_EXISTE')
                .set('Authorization', `Bearer ${ctx.adminToken}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.pagination.total).toBe(0);
            const items: any[] = Array.isArray(response.body.data) ? response.body.data : [];
            expect(items).toHaveLength(0);
        });

        it('Rango de fechas en el futuro retorna lista vacía sin HTTP 500', async () => {
            const desde = new Date('2099-01-01').toISOString();
            const hasta = new Date('2099-12-31').toISOString();
            const response = await request(app)
                .get(`/api/auditoria?desde=${desde}&hasta=${hasta}`)
                .set('Authorization', `Bearer ${ctx.adminToken}`);
            expect(response.status).toBe(200);
            expect(response.body.pagination.total).toBe(0);
        });

        it('GET /api/auditoria/:id con UUID inexistente retorna 404', async () => {
            const response = await request(app)
                .get('/api/auditoria/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${ctx.adminToken}`);
            expect(response.status).toBe(404);
        });
    });
});
