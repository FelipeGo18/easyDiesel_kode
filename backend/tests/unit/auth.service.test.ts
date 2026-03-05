import { prismaMock, resetAllMocks } from './__mocks__/prisma.mock';
import { AuthService } from '../../src/services/auth.service';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock bcryptjs
jest.mock('bcryptjs');
const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

// Mock jsonwebtoken — solo el sign
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
}));

describe('AuthService', () => {
    let service: AuthService;

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
});
