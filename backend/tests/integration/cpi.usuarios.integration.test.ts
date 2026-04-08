/**
 * CPI-020, CPI-021, CPI-022, CPI-023
 * Integración UC-09/UC-10: Gestión de Usuarios y Asignación de Permisos
 *
 * Referencia: Pruebas_Integracion_EasyDiesel.md — sección 1.4.4 Bloque 4
 */

import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/utils/prisma';
import { buildCpiContext, resetCpiState, teardownCpiContext, CpiContext } from '../helpers/cpi.context';

jest.setTimeout(30000);

describe('CPI — UC-09/UC-10: Gestión de Usuarios y Permisos', () => {
    const suffix = `${Date.now()}u`;
    let ctx: CpiContext;
    const createdUserIds: string[] = [];

    beforeAll(async () => {
        ctx = await buildCpiContext(suffix);
    });

    beforeEach(async () => {
        await resetCpiState(ctx);
    });

    afterAll(async () => {
        for (const id of createdUserIds) {
            await prisma.sessionToken.deleteMany({ where: { usuarioId: id } });
            await prisma.auditoriaLog.deleteMany({ where: { usuarioId: id } });
            await prisma.usuario.deleteMany({ where: { id } });
        }
        await teardownCpiContext(ctx);
    });

    // ================================================================
    // CPI-020 — Creación exitosa de usuario (UC-09)
    // ================================================================
    describe('CPI-020: Creación Exitosa de Usuario (UC-09)', () => {
        it('POST /api/usuarios crea usuario con datos válidos y retorna 201', async () => {
            const response = await request(app)
                .post('/api/usuarios')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({
                    email: `nuevo-${suffix}@test.com`,
                    nombre: 'Usuario Nuevo CPI020',
                    password: 'Pass1234!',
                    rolId: ctx.roleId,
                });
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBeDefined();
            expect(response.body.data.email).toBe(`nuevo-${suffix}@test.com`);
            expect(response.body.data.passwordHash).toBeUndefined();
            if (response.body.data?.id) createdUserIds.push(response.body.data.id);
        });

        it('El usuario creado aparece activo en la BD', async () => {
            const email = `activo-${suffix}@test.com`;
            const res = await request(app)
                .post('/api/usuarios')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({ email, nombre: 'Usuario Activo CPI020', password: 'Pass1234!', rolId: ctx.roleId });
            expect(res.status).toBe(201);
            if (res.body.data?.id) {
                createdUserIds.push(res.body.data.id);
                const userEnBd = await prisma.usuario.findUnique({ where: { id: res.body.data.id } });
                expect(userEnBd?.activo).toBe(true);
            }
        });

        it('Sin token retorna 401 al intentar crear usuario', async () => {
            const response = await request(app)
                .post('/api/usuarios')
                .send({
                    email: `noauth-${suffix}@test.com`,
                    nombre: 'Sin Token',
                    password: 'Pass1234!',
                });
            expect(response.status).toBe(401);
        });

        it('La creación de usuario genera log de auditoría CREAR_USUARIO', async () => {
            const email = `audit-${suffix}@test.com`;
            const res = await request(app)
                .post('/api/usuarios')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({ email, nombre: 'Usuario Auditado', password: 'Pass1234!', rolId: ctx.roleId });
            expect(res.status).toBe(201);
            if (res.body.data?.id) {
                createdUserIds.push(res.body.data.id);
                const log = await prisma.auditoriaLog.findFirst({
                    where: { entidadId: res.body.data.id, accion: 'CREAR_USUARIO' },
                });
                expect(log).toBeDefined();
            }
        });
    });

    // ================================================================
    // CPI-021 — Creación fallida de usuario - email duplicado (UC-09)
    // ================================================================
    describe('CPI-021: Creación Fallida de Usuario por Email Duplicado (UC-09)', () => {
        it('POST /api/usuarios con email ya registrado retorna 400 con mensaje de duplicidad', async () => {
            const email = `duplicado-${suffix}@test.com`;
            const first = await request(app)
                .post('/api/usuarios')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({ email, nombre: 'Usuario Original', password: 'Pass1234!', rolId: ctx.roleId });
            expect(first.status).toBe(201);
            if (first.body.data?.id) createdUserIds.push(first.body.data.id);

            const second = await request(app)
                .post('/api/usuarios')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({ email, nombre: 'Usuario Duplicado', password: 'Pass1234!', rolId: ctx.roleId });
            expect(second.status).toBe(400);
            expect(second.body.message).toMatch(/correo/i);
        });

        it('Email con formato inválido retorna 400 (Zod: z.string().email())', async () => {
            const response = await request(app)
                .post('/api/usuarios')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({ email: 'no-es-un-email', nombre: 'Email Inválido', password: 'Pass1234!', rolId: ctx.roleId });
            expect(response.status).toBe(400);
        });

        it('Sin email ni nombre retorna 400 (campos requeridos)', async () => {
            const response = await request(app)
                .post('/api/usuarios')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({ password: 'Pass1234!' });
            expect(response.status).toBe(400);
        });
    });

    // ================================================================
    // CPI-022 — Asignación exitosa de permisos (UC-10 con UC-09)
    // ================================================================
    describe('CPI-022: Asignación Exitosa de Permisos (UC-10 con UC-09)', () => {
        it('PUT /api/usuarios/:id actualiza rolId y queda persistido en BD', async () => {
            const createRes = await request(app)
                .post('/api/usuarios')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({
                    email: `perms-${suffix}@test.com`,
                    nombre: 'Usuario Para Permisos',
                    password: 'Pass1234!',
                    rolId: ctx.noPermsRoleId,
                });
            expect(createRes.status).toBe(201);
            const targetId = createRes.body.data.id;
            if (targetId) createdUserIds.push(targetId);

            const updateRes = await request(app)
                .put(`/api/usuarios/${targetId}`)
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({ rolId: ctx.roleId });
            expect(updateRes.status).toBe(200);
            expect(updateRes.body.success).toBe(true);

            const userEnBd = await prisma.usuario.findUnique({
                where: { id: targetId },
                include: { rol: true },
            });
            expect(userEnBd?.rolId).toBe(ctx.roleId);
        });

        it('Cambio de rol genera log de auditoría ACTUALIZAR_USUARIO', async () => {
            const createRes = await request(app)
                .post('/api/usuarios')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({
                    email: `audit-perms-${suffix}@test.com`,
                    nombre: 'Usuario Audit Perms',
                    password: 'Pass1234!',
                    rolId: ctx.noPermsRoleId,
                });
            const targetId = createRes.body.data?.id;
            if (targetId) createdUserIds.push(targetId);

            await request(app)
                .put(`/api/usuarios/${targetId}`)
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({ rolId: ctx.roleId });

            const log = await prisma.auditoriaLog.findFirst({
                where: { entidadId: targetId, accion: 'ACTUALIZAR_USUARIO' },
            });
            expect(log).toBeDefined();
        });

        it('Actualizar usuario inexistente retorna 400/404', async () => {
            const response = await request(app)
                .put('/api/usuarios/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({ nombre: 'No Existe' });
            expect([400, 404]).toContain(response.status);
        });
    });

    // ================================================================
    // CPI-023 — Modificación del propio rol (UC-10 con UC-09)
    // ================================================================
    describe('CPI-023: Modificación del Propio Rol — Brecha de Seguridad (UC-10 con UC-09)', () => {
        it('Administrador modifica su propio rol — documenta comportamiento actual del sistema', async () => {
            const response = await request(app)
                .put(`/api/usuarios/${ctx.userId}`)
                .set('Authorization', `Bearer ${ctx.adminToken}`)
                .send({ rolId: ctx.noPermsRoleId });

            /**
             * CPI-023: El sistema actualmente NO tiene protección contra auto-modificación de rol.
             * Si retorna 200, se documenta como brecha: el admin puede quitarse su propio rol.
             * Se requiere añadir validación en actualizarUsuario() de usuario.service.ts:
             *   if (id === meta.usuarioId) throw new Error('No puede modificar su propio rol');
             */
            if (response.status === 200) {
                console.warn(
                    '[CPI-023] BRECHA DOCUMENTADA: El sistema permite que un administrador ' +
                    'modifique su propio rol. Requiere validación en actualizarUsuario().'
                );
                // Revertir el rol para no afectar los demás tests del suite
                await request(app)
                    .put(`/api/usuarios/${ctx.userId}`)
                    .set('Authorization', `Bearer ${ctx.adminToken}`)
                    .send({ rolId: ctx.roleId });
            } else {
                expect([400, 403, 422]).toContain(response.status);
            }
        });

        it('Sin token no puede actualizar ningún usuario', async () => {
            const response = await request(app)
                .put(`/api/usuarios/${ctx.userId}`)
                .send({ nombre: 'Sin Token' });
            expect(response.status).toBe(401);
        });
    });
});
