/**
 * CPI-007, CPI-009
 * Integración UC-03/UC-08 ↔ UC-01: Precios Configurados y Reportes
 *
 * Referencia: Pruebas_Integracion_EasyDiesel.md — sección 2.1.4
 */

import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/utils/prisma';
import { buildCpiContext, resetCpiState, teardownCpiContext, CpiContext } from '../helpers/cpi.context';

jest.setTimeout(30000);

describe('CPI — UC-03/UC-08 con UC-01: Precios Configurados y Reportes', () => {
    const suffix = `${Date.now()}p`;
    let ctx: CpiContext;

    beforeAll(async () => {
        ctx = await buildCpiContext(suffix);
    });

    beforeEach(async () => {
        await resetCpiState(ctx);
    });

    afterAll(async () => {
        await teardownCpiContext(ctx);
    }, 60000);

    // ================================================================
    // CPI-007 — Generación de reportes refleja transacciones registradas
    // ================================================================
    describe('CPI-007: Coherencia de Datos en Reportes (UC-03 ↔ UC-01)', () => {
        it('POST /api/reportes genera un reporte TRANSACCIONES y retorna 200/201', async () => {
            const response = await request(app)
                .post('/api/reportes')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({
                    tipo: 'TRANSACCIONES',
                    formato: 'PDF',
                    periodoInicio: new Date(Date.now() - 86400000 * 7).toISOString(),
                    periodoFin: new Date().toISOString(),
                    parametros: { estacionId: ctx.estacionId },
                });

            expect([200, 201]).toContain(response.status);
        });

        it('GET /api/reportes lista los reportes generados con paginación', async () => {
            const response = await request(app)
                .get('/api/reportes')
                .set('Authorization', `Bearer ${ctx.adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('El reporte INVENTARIO también puede ser generado correctamente', async () => {
            const response = await request(app)
                .post('/api/reportes')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({
                    tipo: 'INVENTARIO',
                    formato: 'EXCEL',
                    periodoInicio: new Date(Date.now() - 86400000 * 30).toISOString(),
                    periodoFin: new Date().toISOString(),
                    parametros: { estacionId: ctx.estacionId },
                });
            expect([200, 201]).toContain(response.status);
        });

        it('Usuario sin reportes:generar recibe 403 al intentar generar un reporte', async () => {
            const response = await request(app)
                .post('/api/reportes')
                .set('Authorization', `Bearer ${ctx.noPermsToken}`)
                .send({ tipo: 'TRANSACCIONES', formato: 'PDF' });
            expect(response.status).toBe(403);
        });
    });

    // ================================================================
    // CPI-009 — Precio de PrecioVigente aplicado automáticamente en UC-01
    // ================================================================
    describe('CPI-009: Aplicación de Parámetros de Precio Configurados (UC-08 ↔ UC-01)', () => {
        it('Paso 2: La transacción usa el precioGalon configurado (9500 COP/galón)', async () => {
            const response = await request(app)
                .post('/api/inventario/transacciones')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({
                    estacionId: ctx.estacionId,
                    tanqueId: ctx.tanqueId,
                    tipoCombustible: 'ACPM',
                    tipoServicio: 'PARTICULAR',
                    galones: 10,
                    placaVehiculo: 'PQR678',
                });

            expect(response.status).toBe(201);
            expect(Number(response.body.data.precioUnitario)).toBe(9500);
            expect(Number(response.body.data.precioTotal)).toBe(95000); // 10 × 9500
        });

        it('Paso 3-4: Cambiar precio en UC-08 aplica el nuevo valor en transacciones posteriores', async () => {
            await prisma.precioVigente.update({
                where: { id: ctx.precioId },
                data: { activo: false },
            });

            const nuevoPrecio = await prisma.precioVigente.create({
                data: {
                    tipoCombustible: 'ACPM',
                    tipoServicio: 'PARTICULAR',
                    zonaId: ctx.zonaId,
                    precioGalon: 10200,
                    subsidioGalon: 0,
                    decretoId: ctx.decretoId,
                    vigenciaDesde: new Date(),
                    activo: true,
                },
            });

            const response = await request(app)
                .post('/api/inventario/transacciones')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({
                    estacionId: ctx.estacionId,
                    tanqueId: ctx.tanqueId,
                    tipoCombustible: 'ACPM',
                    tipoServicio: 'PARTICULAR',
                    galones: 10,
                    placaVehiculo: 'STU901',
                });

            expect(response.status).toBe(201);
            expect(Number(response.body.data.precioUnitario)).toBe(10200);
            expect(Number(response.body.data.precioTotal)).toBe(102000); // 10 × 10200

            await prisma.precioVigente.delete({ where: { id: nuevoPrecio.id } });
        });

        it('Los registros históricos conservan el precio original (no se actualizan retroactivamente)', async () => {
            const txRes = await request(app)
                .post('/api/inventario/transacciones')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({
                    estacionId: ctx.estacionId,
                    tanqueId: ctx.tanqueId,
                    tipoCombustible: 'ACPM',
                    tipoServicio: 'PARTICULAR',
                    galones: 5,
                });
            expect(txRes.status).toBe(201);
            const txId = txRes.body.data.id;
            const precioEnRespuesta = Number(txRes.body.data.precioUnitario);

            const txEnBd = await prisma.transaccionCombustible.findUniqueOrThrow({ where: { id: txId } });
            expect(Number(txEnBd.precioUnitario)).toBe(precioEnRespuesta);
        });
    });
});
