
import { prismaMock, resetAllMocks } from './__mocks__/prisma.mock';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock bcryptjs
jest.mock('bcryptjs');
const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

// Mock jsonwebtoken — solo el sign
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
}));

const mockSupabase = {
    auth: {
        getUser: jest.fn()
    }
};

jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => mockSupabase)
}));

import { AuthService } from '../../src/services/auth.service';

describe('AuthService', () => {
    let service: AuthService;
    const supabase = mockSupabase;

    beforeEach(() => {
        resetAllMocks();
        service = new AuthService();
        bcryptMock.hash = jest.fn().mockResolvedValue('hashed-password') as any;
        bcryptMock.compare = jest.fn().mockResolvedValue(true) as any;
    });

    // ─── REGISTER ───

    describe('register', () => {
        const registerData = {
            email: 'test@easydiesel.co',
            password: 'Test123!',
            nombre: 'Juan Pérez',
        };

        it('debe registrar un usuario exitosamente con rol por defecto', async () => {
            prismaMock.usuario.findUnique.mockResolvedValue(null); // no existe
            prismaMock.rol.findUnique.mockResolvedValue({ id: 'rol-1', nombre: 'particular' });
            prismaMock.usuario.create.mockResolvedValue({
                id: 'user-1',
                email: registerData.email,
                nombre: registerData.nombre,
                rol: { nombre: 'particular' },
            });

            const result = await service.register(registerData);

            expect(result.token).toBe('mock-jwt-token');
            expect(result.usuario.email).toBe(registerData.email);
            expect(prismaMock.usuario.create).toHaveBeenCalledTimes(1);
        });

        it('debe lanzar error si el email ya está registrado', async () => {
            prismaMock.usuario.findUnique.mockResolvedValue({ id: 'existing' });

            await expect(service.register(registerData))
                .rejects.toThrow('El email ya está registrado');
        });

        it('debe lanzar error si el rol por defecto no existe', async () => {
            prismaMock.usuario.findUnique.mockResolvedValue(null);
            prismaMock.rol.findUnique.mockResolvedValue(null);

            await expect(service.register(registerData))
                .rejects.toThrow('No se encontró el rol por defecto');
        });

        it('debe lanzar error si el rol especificado no existe', async () => {
            prismaMock.usuario.findUnique.mockResolvedValue(null);
            prismaMock.rol.findUnique.mockResolvedValue(null);

            await expect(service.register({ ...registerData, rolId: 'bad-id' }))
                .rejects.toThrow('El rol especificado no existe');
        });
    });

    // ─── LOGIN ───

    describe('login', () => {
        const loginData = { email: 'admin@easydiesel.co', password: 'Admin2026!' };

        it('debe autenticar exitosamente', async () => {
            prismaMock.usuario.findUnique.mockResolvedValue({
                id: 'user-1',
                email: loginData.email,
                passwordHash: 'hashed',
                activo: true,
                nombre: 'Admin Test',
                rol: { nombre: 'admin' },
            });

            const result = await service.login(loginData);

            expect(result.token).toBe('mock-jwt-token');
            expect(result.usuario.email).toBe(loginData.email);
        });

        it('debe lanzar error con credenciales inválidas (usuario no existe)', async () => {
            prismaMock.usuario.findUnique.mockResolvedValue(null);

            await expect(service.login(loginData))
                .rejects.toThrow('Credenciales inválidas');
        });

        it('debe lanzar error si la cuenta está desactivada', async () => {
            prismaMock.usuario.findUnique.mockResolvedValue({
                id: 'user-1', email: loginData.email, activo: false,
                passwordHash: 'hash', rol: { nombre: 'admin' },
            });

            await expect(service.login(loginData))
                .rejects.toThrow('Cuenta desactivada');
        });

        it('debe lanzar error con contraseña incorrecta', async () => {
            prismaMock.usuario.findUnique.mockResolvedValue({
                id: 'user-1', email: loginData.email, activo: true,
                passwordHash: 'real-hash', rol: { nombre: 'admin' },
            });
            bcryptMock.compare = jest.fn().mockResolvedValue(false) as any;

            await expect(service.login(loginData))
                .rejects.toThrow('Credenciales inválidas');
        });
    });

    // ─── GET PROFILE ───

    describe('getProfile', () => {
        it('debe retornar el perfil del usuario', async () => {
            prismaMock.usuario.findUnique.mockResolvedValue({
                id: 'user-1', email: 'test@test.co', nombre: 'T U',
                activo: true, createdAt: new Date(),
                rol: { id: 'r1', nombre: 'admin', descripcion: '', permisos: [] },
                estacionGestionada: null, distribuidorGestionado: null,
            });

            const result = await service.getProfile('user-1');
            expect(result.email).toBe('test@test.co');
        });

        it('debe lanzar error si el usuario no existe', async () => {
            prismaMock.usuario.findUnique.mockResolvedValue(null);

            await expect(service.getProfile('bad-id'))
                .rejects.toThrow('Usuario no encontrado');
        });
    });

    // ─── GOOGLE LOGIN ───

    describe('loginWithGoogle', () => {
        const googleData = { email: 'google@test.co', nombre: 'G User', googleId: 'g123' };

        it('debe loguear usuario existente de Google y NO actualizar si ya es GOOGLE', async () => {
            prismaMock.usuario.findUnique.mockResolvedValue({
                id: 'u1', email: googleData.email, googleId: googleData.googleId, authProvider: 'GOOGLE', activo: true, rol: { nombre: 'particular' }
            } as any);

            await service.loginWithGoogle(googleData);
            expect(prismaMock.usuario.update).not.toHaveBeenCalled();
        });

        it('debe loguear usuario existente de Google', async () => {
            prismaMock.usuario.findUnique.mockResolvedValue({
                id: 'u1', email: googleData.email, activo: true, rol: { nombre: 'particular' },
                googleId: googleData.googleId, authProvider: 'GOOGLE'
            });

            const result = await service.loginWithGoogle(googleData);
            expect(result.usuario.email).toBe(googleData.email);
        });

        it('debe registrar nuevo usuario de Google', async () => {
            prismaMock.usuario.findUnique.mockResolvedValue(null);
            prismaMock.rol.findUnique.mockResolvedValue({ id: 'r1', nombre: 'particular' });
            prismaMock.usuario.create.mockResolvedValue({
                id: 'u2', email: googleData.email, activo: true, rol: { nombre: 'particular' },
            });

            const result = await service.loginWithGoogle(googleData);
            expect(result.usuario.email).toBe(googleData.email);
        });

        it('debe lanzar error si el email ya existe con otro metodo', async () => {
            prismaMock.usuario.findUnique.mockResolvedValue({
                id: 'u1', email: googleData.email, googleId: 'other', activo: true, rol: { nombre: 'particular' }
            } as any);

            await expect(service.loginWithGoogle({ ...googleData, googleId: 'mismatch' }))
                .rejects.toThrow('Este correo ya está registrado con otro método');
        });

        it('debe lanzar error si el usuario de google no tiene rol', async () => {
            const userData = {
                id: 'u1', email: googleData.email, googleId: googleData.googleId, activo: true, rol: null
            };
            prismaMock.usuario.findUnique.mockResolvedValue(userData as any);
            // Si intenta actualizar porque authProvider no es GOOGLE, devolvemos lo mismo
            prismaMock.usuario.update.mockResolvedValue(userData as any);

            await expect(service.loginWithGoogle(googleData))
                .rejects.toThrow('Usuario sin rol asignado');
        });

        it('debe lanzar error si la cuenta esta desactivada', async () => {
            const googleData = { email: 'google@test.co', nombre: 'G User', googleId: 'g123' };
            prismaMock.usuario.findUnique.mockResolvedValue({
                id: 'u1', email: googleData.email, activo: false, rol: { nombre: 'particular' },
                googleId: 'g123', authProvider: 'GOOGLE'
            } as any);

            await expect(service.loginWithGoogle(googleData))
                .rejects.toThrow('Cuenta desactivada');
        });
    });

    // ─── SUPABASE LOGIN ───

    describe('loginWithSupabaseToken', () => {
        it('debe loguear via Supabase exitosamente', async () => {
            (supabase.auth.getUser as jest.Mock).mockResolvedValue({
                data: { user: { email: 's@t.co', id: 's123', user_metadata: { full_name: 'S' } } },
                error: null
            });
            prismaMock.usuario.findUnique.mockResolvedValue({
                id: 'u1', email: 's@t.co', activo: true, rol: { nombre: 'particular' },
                googleId: 's123', authProvider: 'GOOGLE'
            } as any);

            const result = await service.loginWithSupabaseToken('token');
            expect(result.usuario.email).toBe('s@t.co');
        });

        it('debe lanzar error si el token es invalido', async () => {
            (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: null }, error: new Error('Bad') });
            await expect(service.loginWithSupabaseToken('bad'))
                .rejects.toThrow('Token de Supabase inválido');
        });
    });

    // ─── REFRESH SESSION ───

    describe('refreshSession', () => {
        it('debe renovar sesion exitosamente', async () => {
            const mockSession = {
                id: 's1', revokedAt: null, expiresAt: new Date(Date.now() + 10000),
                usuario: { id: 'u1', activo: true, rol: { nombre: 'admin' } }
            };
            prismaMock.sessionToken.findUnique.mockResolvedValue(mockSession);
            prismaMock.sessionToken.update.mockResolvedValue({ ...mockSession, revokedAt: new Date() });

            const result = await service.refreshSession('valid-token');
            expect(result.token).toBeDefined();
        });

        it('debe lanzar error si el token expiro', async () => {
            prismaMock.sessionToken.findUnique.mockResolvedValue({
                expiresAt: new Date(Date.now() - 10000),
                revokedAt: null,
            });
            await expect(service.refreshSession('expired'))
                .rejects.toThrow('expirado');
        });
    });

    // ─── LOGOUT ───

    describe('logout', () => {
        it('debe invalidar el token de sesion', async () => {
            prismaMock.sessionToken.updateMany.mockResolvedValue({ count: 1 });
            await service.logout('some-token');
            expect(prismaMock.sessionToken.updateMany).toHaveBeenCalled();
        });
    });

    // ─── UPDATE PROFILE ───

    describe('updateProfile', () => {
        it('debe actualizar perfil exitosamente', async () => {
            prismaMock.usuario.update.mockResolvedValue({
                id: 'u1', email: 'new@test.co', nombre: 'New', activo: true,
                rol: { nombre: 'admin' },
            });

            const result = await service.updateProfile('u1', { nombre: 'New' });
            expect(result.nombre).toBe('New');
        });

        it('debe lanzar error si el email ya esta en uso', async () => {
            prismaMock.usuario.findFirst.mockResolvedValue({ id: 'other' });
            await expect(service.updateProfile('u1', { email: 'dup@test.co' }))
                .rejects.toThrow('ya está en uso');
        });
    });
});
