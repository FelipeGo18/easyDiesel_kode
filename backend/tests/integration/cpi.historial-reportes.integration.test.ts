/**
 * CPI-006, CPI-007, CPI-008, CPI-009, CPI-010, CPI-011
 * Integración UC-02/UC-03/UC-04 ↔ UC-09: Historial, Reportes y Filtros
 *
 * Referencia: Pruebas_Integracion_EasyDiesel.md — sección 1.4.4 Bloques 2
 */

import request from 'supertest';
import { app } from '../../src/app';
import { buildCpiContext, resetCpiState, teardownCpiContext, CpiContext } from '../helpers/cpi.context';

jest.setTimeout(60000);

describe('CPI — UC-02/UC-03/UC-04: Historial, Reportes y Filtros', () => {
    const suffix = `${Date.now()}h`;
    let ctx: CpiContext;

    beforeAll(async () => {
        ctx = await buildCpiContext(suffix);

        // Insertar 5 transacciones con placa AAA111 y 3 con placa BBB222
        for (let i = 0; i < 5; i++) {
            await request(app)
                .post('/api/inventario/transacciones')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({
                    estacionId: ctx.estacionId,
                    tanqueId: ctx.tanqueId,
                    tipoCombustible: 'ACPM',
                    tipoServicio: 'PARTICULAR',
                    galones: 5,
                    placaVehiculo: 'AAA111',
                });
        }
        for (let i = 0; i < 3; i++) {
            await request(app)
                .post('/api/inventario/transacciones')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({
                    estacionId: ctx.estacionId,
                    tanqueId: ctx.tanqueId,
                    tipoCombustible: 'ACPM',
                    tipoServicio: 'PARTICULAR',
                    galones: 5,
                    placaVehiculo: 'BBB222',
                });
        }
    });

    beforeEach(async () => {
        await resetCpiState(ctx);
    });

    afterAll(async () => {
        await teardownCpiContext(ctx);
    });

    // ================================================================
    // CPI-006 — Consulta exitosa de historial con filtros (UC-02 con UC-09)
    // ================================================================
    describe('CPI-006: Consulta Exitosa de Historial de Consumos (UC-02 con UC-09)', () => {
        it('GET /api/inventario/transacciones?estacionId devuelve historial paginado con totales', async () => {
            const response = await request(app)
                .get(`/api/inventario/transacciones?estacionId=${ctx.estacionId}&page=1&limit=20`)
                .set('Authorization', `Bearer ${ctx.adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.pagination).toBeDefined();
            expect(response.body.pagination.total).toBeGreaterThanOrEqual(8);
        });

        it('Sin estacionId ni placaVehiculo retorna 400 (parámetro requerido)', async () => {
            const response = await request(app)
                .get('/api/inventario/transacciones')
                .set('Authorization', `Bearer ${ctx.adminToken}`);
            expect(response.status).toBe(400);
        });

        it('Todos los registros retornados pertenecen a la estación filtrada', async () => {
            const response = await request(app)
                .get(`/api/inventario/transacciones?estacionId=${ctx.estacionId}`)
                .set('Authorization', `Bearer ${ctx.adminToken}`);
            expect(response.status).toBe(200);
            const items = response.body.data?.data ?? response.body.data ?? [];
            (Array.isArray(items) ? items : []).forEach((t: any) => {
                expect(t.estacionId).toBe(ctx.estacionId);
            });
        });
    });

    // ================================================================
    // CPI-007 — Control de acceso por roles en historial (UC-02 con UC-09)
    // ================================================================
    describe('CPI-007: Control de Acceso por Roles en Historial (UC-02 con UC-09)', () => {
        it('Usuario sin inventario:leer recibe 403 al consultar historial', async () => {
            const response = await request(app)
                .get(`/api/inventario/transacciones?estacionId=${ctx.estacionId}`)
                .set('Authorization', `Bearer ${ctx.noPermsToken}`);
            expect(response.status).toBe(403);
        });

        it('Usuario con inventario:leer accede correctamente y ve todos los registros', async () => {
            const response = await request(app)
                .get(`/api/inventario/transacciones?estacionId=${ctx.estacionId}`)
                .set('Authorization', `Bearer ${ctx.adminToken}`);
            expect(response.status).toBe(200);
            expect(response.body.pagination.total).toBeGreaterThanOrEqual(8);
        });

        it('Sin token de autenticación retorna 401', async () => {
            const response = await request(app)
                .get(`/api/inventario/transacciones?estacionId=${ctx.estacionId}`);
            expect(response.status).toBe(401);
        });

        it('Usuario sin auditoria:leer recibe 403 al consultar GET /api/auditoria', async () => {
            const response = await request(app)
                .get('/api/auditoria')
                .set('Authorization', `Bearer ${ctx.noPermsToken}`);
            expect(response.status).toBe(403);
        });
    });

    // ================================================================
    // CPI-008 — Coherencia de datos en reportes (UC-03 con UC-01)
    // ================================================================
    describe('CPI-008: Coherencia de Datos en Reportes (UC-03 con UC-01)', () => {
        it('POST /api/reportes genera reporte TRANSACCIONES y retorna buffer PDF', async () => {
            const response = await request(app)
                .post('/api/reportes')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({
                    tipo: 'TRANSACCIONES',
                    formato: 'PDF',
                    periodoInicio: new Date(Date.now() - 86400000).toISOString(),
                    periodoFin: new Date().toISOString(),
                    parametros: { estacionId: ctx.estacionId },
                });
            expect([200, 201]).toContain(response.status);
            expect(response.headers['content-type']).toMatch(/pdf/);
        });

        it('POST /api/reportes genera reporte INVENTARIO en formato EXCEL', async () => {
            const response = await request(app)
                .post('/api/reportes')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({
                    tipo: 'INVENTARIO',
                    formato: 'EXCEL',
                    periodoInicio: new Date(Date.now() - 86400000 * 7).toISOString(),
                    periodoFin: new Date().toISOString(),
                    parametros: { estacionId: ctx.estacionId },
                });
            expect([200, 201]).toContain(response.status);
            expect(response.headers['content-type']).toMatch(/spreadsheetml/);
        });

        it('El reporte generado queda registrado en GET /api/reportes', async () => {
            await request(app)
                .post('/api/reportes')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({
                    tipo: 'TRANSACCIONES',
                    formato: 'PDF',
                    periodoInicio: new Date(Date.now() - 86400000).toISOString(),
                    periodoFin: new Date().toISOString(),
                    parametros: { estacionId: ctx.estacionId },
                });

            const listRes = await request(app)
                .get('/api/reportes')
                .set('Authorization', `Bearer ${ctx.adminToken}`);
            expect(listRes.status).toBe(200);
            expect(listRes.body.pagination.total).toBeGreaterThanOrEqual(1);
        });

        it('Usuario sin reportes:generar recibe 403', async () => {
            const response = await request(app)
                .post('/api/reportes')
                .set('Authorization', `Bearer ${ctx.noPermsToken}`)
                .send({
                    tipo: 'TRANSACCIONES',
                    formato: 'PDF',
                    periodoInicio: new Date(Date.now() - 86400000).toISOString(),
                    periodoFin: new Date().toISOString(),
                });
            expect(response.status).toBe(403);
        });
    });

    // ================================================================
    // CPI-009 — Reporte fallido por fechas inválidas (UC-03 con UC-01)
    // ================================================================
    describe('CPI-009: Generación de Reporte Fallida por Fechas Inválidas (UC-03 con UC-01)', () => {
        it('periodoInicio con formato inválido retorna 400', async () => {
            const response = await request(app)
                .post('/api/reportes')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({
                    tipo: 'TRANSACCIONES',
                    formato: 'PDF',
                    periodoInicio: 'no-es-una-fecha',
                    periodoFin: new Date().toISOString(),
                });
            expect(response.status).toBe(400);
        });

        it('periodoFin con formato inválido retorna 400', async () => {
            const response = await request(app)
                .post('/api/reportes')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({
                    tipo: 'TRANSACCIONES',
                    formato: 'PDF',
                    periodoInicio: new Date(Date.now() - 86400000).toISOString(),
                    periodoFin: 'fecha-invalida',
                });
            expect(response.status).toBe(400);
        });

        it('Sin periodoInicio retorna 400 (campo requerido por Zod)', async () => {
            const response = await request(app)
                .post('/api/reportes')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({
                    tipo: 'TRANSACCIONES',
                    formato: 'PDF',
                    periodoFin: new Date().toISOString(),
                });
            expect(response.status).toBe(400);
        });

        it('Sin periodoFin retorna 400 (campo requerido por Zod)', async () => {
            const response = await request(app)
                .post('/api/reportes')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({
                    tipo: 'TRANSACCIONES',
                    formato: 'PDF',
                    periodoInicio: new Date(Date.now() - 86400000).toISOString(),
                });
            expect(response.status).toBe(400);
        });
    });

    // ================================================================
    // CPI-010 — Filtrado exitoso de historial por placa (UC-04 con UC-03)
    // ================================================================
    describe('CPI-010: Filtrado de Historial por Placa de Vehículo (UC-04 con UC-03)', () => {
        it('Filtrar por placaVehiculo=AAA111 retorna solo registros de esa placa', async () => {
            const response = await request(app)
                .get('/api/inventario/transacciones?placaVehiculo=AAA111')
                .set('Authorization', `Bearer ${ctx.adminToken}`);
            expect(response.status).toBe(200);
            const items = response.body.data?.data ?? response.body.data ?? [];
            expect(Array.isArray(items)).toBe(true);
            expect(items.length).toBeGreaterThanOrEqual(5);
            (Array.isArray(items) ? items : []).forEach((t: any) => {
                expect(t.placaVehiculo).toBe('AAA111');
            });
        });

        it('El total difiere al cambiar la placa filtrada (AAA111 > BBB222)', async () => {
            const resA = await request(app)
                .get('/api/inventario/transacciones?placaVehiculo=AAA111')
                .set('Authorization', `Bearer ${ctx.adminToken}`);
            const resB = await request(app)
                .get('/api/inventario/transacciones?placaVehiculo=BBB222')
                .set('Authorization', `Bearer ${ctx.adminToken}`);
            expect(resA.status).toBe(200);
            expect(resB.status).toBe(200);
            const totalA = resA.body.pagination?.total ?? (resA.body.data?.data ?? resA.body.data ?? []).length;
            const totalB = resB.body.pagination?.total ?? (resB.body.data?.data ?? resB.body.data ?? []).length;
            expect(totalA).toBeGreaterThan(totalB);
        });
    });

    // ================================================================
    // CPI-011 — Filtrado fallido por placa sin datos (UC-04 con UC-03)
    // ================================================================
    describe('CPI-011: Filtrado de Historial — Placa Sin Datos (UC-04 con UC-03)', () => {
        it('Placa inexistente retorna lista vacía sin error HTTP 500', async () => {
            const response = await request(app)
                .get('/api/inventario/transacciones?placaVehiculo=ZZZ999')
                .set('Authorization', `Bearer ${ctx.adminToken}`);
            expect(response.status).toBe(200);
            const items = response.body.data?.data ?? response.body.data ?? [];
            expect(Array.isArray(items) ? items.length : 0).toBe(0);
        });

        it('Respuesta con placa sin datos no retorna HTTP 500', async () => {
            const response = await request(app)
                .get('/api/inventario/transacciones?placaVehiculo=XYZ000')
                .set('Authorization', `Bearer ${ctx.adminToken}`);
            expect(response.status).not.toBe(500);
        });
    });
});
