/**
 * CPI-016, CPI-018
 * Integración UC-07/UC-08: Estaciones con Datos Inválidos y Precios Fuera de Rango
 *
 * Referencia: Pruebas_Integracion_EasyDiesel.md — sección 1.4.4 Bloque 4
 */

import request from 'supertest';
import { app } from '../../src/app';
import { buildCpiContext, resetCpiState, teardownCpiContext, CpiContext } from '../helpers/cpi.context';

jest.setTimeout(30000);

describe('CPI — UC-07/UC-08: Validación de Parámetros del Sistema', () => {
    const suffix = `${Date.now()}pa`;
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
    // CPI-016 — Creación de estación con datos inválidos (UC-07)
    // ================================================================
    describe('CPI-016: Creación de Estación con Datos Inválidos (UC-07)', () => {
        it('Coordenadas con texto en lugar de número retornan 400 (Zod: z.number())', async () => {
            const response = await request(app)
                .post('/api/actores/estaciones')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({
                    nombre: 'EDS Coordenadas Inválidas',
                    nit: `CPI016A${suffix.slice(-5)}`,
                    direccion: 'Calle 1 #2-3',
                    ciudad: 'Bogota',
                    departamento: 'Cundinamarca',
                    codigoSicom: `SC016A-${suffix}`,
                    zonaId: ctx.zonaId,
                    usuarioId: ctx.userId,
                    latitud: 'no-es-numero',
                    longitud: -74.0721,
                });
            expect(response.status).toBe(400);
        });

        it('NIT duplicado retorna error de integridad (400/409/500)', async () => {
            const response = await request(app)
                .post('/api/actores/estaciones')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({
                    nombre: 'EDS NIT Duplicado',
                    nit: `901${suffix.slice(-7)}`,
                    direccion: 'Calle Duplicada 1',
                    ciudad: 'Bogota',
                    departamento: 'Cundinamarca',
                    codigoSicom: `SC016B-${suffix}`,
                    zonaId: ctx.zonaId,
                    usuarioId: ctx.userId,
                });
            expect([400, 409, 500]).toContain(response.status);
        });

        it('Sin zonaId retorna 400 (campo requerido por Zod)', async () => {
            const response = await request(app)
                .post('/api/actores/estaciones')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({
                    nombre: 'EDS Sin Zona',
                    nit: `CPI016C${suffix.slice(-5)}`,
                    direccion: 'Sin zona',
                    ciudad: 'Bogota',
                    departamento: 'Cundinamarca',
                    codigoSicom: `SC016C-${suffix}`,
                    usuarioId: ctx.userId,
                });
            expect(response.status).toBe(400);
        });

        it('Sin token retorna 401 al intentar crear una estación', async () => {
            const response = await request(app)
                .post('/api/actores/estaciones')
                .send({
                    nombre: 'EDS Sin Token',
                    nit: `CPI016D${suffix.slice(-5)}`,
                    direccion: 'Sin auth',
                    ciudad: 'Bogota',
                    departamento: 'Cundinamarca',
                    codigoSicom: `SC016D-${suffix}`,
                    zonaId: ctx.zonaId,
                    usuarioId: ctx.userId,
                });
            expect(response.status).toBe(401);
        });
    });

    // ================================================================
    // CPI-018 — Configuración fallida de precio fuera de rango (UC-08)
    // ================================================================
    describe('CPI-018: Configuración Fallida de Precio Fuera de Rango (UC-08)', () => {
        it('precioGalon negativo retorna 400 (Zod: positive())', async () => {
            const response = await request(app)
                .post('/api/precios')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({
                    tipoCombustible: 'ACPM',
                    tipoServicio: 'PARTICULAR',
                    zonaId: ctx.zonaId,
                    precioGalon: -500,
                    subsidioGalon: 0,
                    decretoId: ctx.decretoId,
                    vigenciaDesde: new Date().toISOString(),
                });
            expect(response.status).toBe(400);
        });

        it('precioGalon igual a cero retorna 400 (Zod: positive())', async () => {
            const response = await request(app)
                .post('/api/precios')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({
                    tipoCombustible: 'ACPM',
                    tipoServicio: 'PARTICULAR',
                    zonaId: ctx.zonaId,
                    precioGalon: 0,
                    subsidioGalon: 0,
                    decretoId: ctx.decretoId,
                    vigenciaDesde: new Date().toISOString(),
                });
            expect(response.status).toBe(400);
        });

        it('Sin zonaId retorna 400 (FK obligatoria en Zod)', async () => {
            const response = await request(app)
                .post('/api/precios')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({
                    tipoCombustible: 'ACPM',
                    tipoServicio: 'PARTICULAR',
                    precioGalon: 9500,
                    subsidioGalon: 0,
                    decretoId: ctx.decretoId,
                    vigenciaDesde: new Date().toISOString(),
                });
            expect(response.status).toBe(400);
        });

        it('Sin decretoId retorna 400 (FK obligatoria en Zod)', async () => {
            const response = await request(app)
                .post('/api/precios')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({
                    tipoCombustible: 'ACPM',
                    tipoServicio: 'PARTICULAR',
                    zonaId: ctx.zonaId,
                    precioGalon: 9500,
                    subsidioGalon: 0,
                    vigenciaDesde: new Date().toISOString(),
                });
            expect(response.status).toBe(400);
        });

        it('Usuario sin precios:escribir recibe 403 al crear precio', async () => {
            const response = await request(app)
                .post('/api/precios')
                .set('Authorization', `Bearer ${ctx.noPermsToken}`)
                .send({
                    tipoCombustible: 'ACPM',
                    tipoServicio: 'PARTICULAR',
                    zonaId: ctx.zonaId,
                    precioGalon: 9500,
                    subsidioGalon: 0,
                    decretoId: ctx.decretoId,
                    vigenciaDesde: new Date().toISOString(),
                });
            expect(response.status).toBe(403);
        });
    });
});
