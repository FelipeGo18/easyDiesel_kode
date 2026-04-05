import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/utils/prisma';
import bcrypt from 'bcryptjs';

describe('Auth Integration Tests', () => {
    let adminUser: any;
    let refreshToken: string;

    beforeAll(async () => {
        // Limpiar usuario previo si quedó de una ejecución anterior interrumpida
        const existing = await prisma.usuario.findUnique({ where: { email: 'admin-integration@test.com' } });
        if (existing) {
            await prisma.sessionToken.deleteMany({ where: { usuarioId: existing.id } });
            await prisma.auditoriaLog.deleteMany({ where: { usuarioId: existing.id } });
            await prisma.usuario.delete({ where: { id: existing.id } });
        }
        // Crear un usuario administrador para las pruebas
        const passwordHash = await bcrypt.hash('AdminPassword123!', 10);
        adminUser = await prisma.usuario.create({
            data: {
                email: 'admin-integration@test.com',
                nombre: 'Admin Integration',
                passwordHash,
                rol: {
                    connectOrCreate: {
                        where: { nombre: 'admin' },
                        create: { nombre: 'admin', permisos: ['all'] }
                    }
                }
            }
        });
    });

    afterAll(async () => {
        // Limpiar la base de datos respetando FK: sessions y auditoria primero
        await prisma.sessionToken.deleteMany({ where: { usuarioId: adminUser.id } });
        await prisma.auditoriaLog.deleteMany({ where: { usuarioId: adminUser.id } });
        await prisma.usuario.delete({ where: { id: adminUser.id } });
        await prisma.$disconnect();
    });

    describe('POST /api/auth/login', () => {
        it('debería autenticar al usuario y devolver un token JWT', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'admin-integration@test.com',
                    password: 'AdminPassword123!'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.token).toBeDefined();
            expect(response.body.data.refreshToken).toBeDefined();
        });

        it('debería retornar 401 con credenciales incorrectas', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'admin-integration@test.com',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
            expect(response.body.error.message).toBe('Credenciales inválidas');
        });
    });

    describe('GET /api/auth/me', () => {
        let token: string;

        beforeAll(async () => {
            // Iniciar sesión para obtener un token válido
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'admin-integration@test.com',
                    password: 'AdminPassword123!'
                });
            token = response.body.data.token;
            refreshToken = response.body.data.refreshToken;
        });

        it('debería retornar el perfil del usuario con un token válido', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.email).toBe('admin-integration@test.com');
        });

        it('debería retornar 401 sin un token de autenticación', async () => {
            const response = await request(app)
                .get('/api/auth/me');

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Token de autenticación requerido');
        });

        it('debería renovar la sesión con un refresh token válido', async () => {
            const response = await request(app)
                .post('/api/auth/refresh')
                .send({ refresh_token: refreshToken });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.token).toBeDefined();
            expect(response.body.data.refreshToken).toBeDefined();
            expect(response.body.data.refreshToken).not.toBe(refreshToken);

            refreshToken = response.body.data.refreshToken;
        });

        it('debería revocar la sesión al hacer logout', async () => {
            const logoutResponse = await request(app)
                .post('/api/auth/logout')
                .send({ refresh_token: refreshToken });

            expect(logoutResponse.status).toBe(200);
            expect(logoutResponse.body.success).toBe(true);

            const refreshResponse = await request(app)
                .post('/api/auth/refresh')
                .send({ refresh_token: refreshToken });

            expect(refreshResponse.status).toBe(401);
        });
    });
});