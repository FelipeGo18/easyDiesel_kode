import { prismaMock, resetAllMocks } from './__mocks__/prisma.mock';
import { UsuarioService } from '../../src/services/usuario.service';
import bcrypt from 'bcryptjs';

jest.mock('bcryptjs');
const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UsuarioService', () => {
    let service: UsuarioService;

    beforeEach(() => {
        resetAllMocks();
        service = new UsuarioService();
        bcryptMock.hash = jest.fn().mockResolvedValue('hashed') as any;
    });

    describe('obtenerUsuarios', () => {
        it('debe retornar usuarios sin passwordHash', async () => {
            prismaMock.usuario.findMany.mockResolvedValue([
                { id: '1', email: 'a@b.co', nombre: 'A', passwordHash: 'xxx', rol: { nombre: 'admin' } },
            ]);
            const result = await service.obtenerUsuarios();
            expect(result).toHaveLength(1);
            expect(result[0]).not.toHaveProperty('passwordHash');
        });
    });

    describe('obtenerUsuarioPorId', () => {
        it('debe retornar un usuario por ID', async () => {
            prismaMock.usuario.findUnique.mockResolvedValue({
                id: '1', email: 'a@b.co', passwordHash: 'xxx', nombre: 'A', rol: {},
            });
            const result = await service.obtenerUsuarioPorId('1');
            expect(result.email).toBe('a@b.co');
            expect(result).not.toHaveProperty('passwordHash');
        });

        it('debe lanzar error si no existe', async () => {
            prismaMock.usuario.findUnique.mockResolvedValue(null);
            await expect(service.obtenerUsuarioPorId('bad'))
                .rejects.toThrow('Usuario no encontrado');
        });
    });

    describe('crearUsuario', () => {
        const data = { email: 'new@test.co', nombre: 'Nombre Usuario' } as any;

        it('debe crear un usuario asignando rol particular por defecto', async () => {
            prismaMock.usuario.findUnique.mockResolvedValue(null);
            prismaMock.rol.findUnique.mockResolvedValue({ id: 'r1', nombre: 'particular' });
            prismaMock.usuario.create.mockResolvedValue({
                id: '2', email: data.email, nombre: data.nombre, passwordHash: 'h', rol: { nombre: 'particular' },
            });

            const result = await service.crearUsuario(data);
            expect(result.email).toBe(data.email);
            expect(result).not.toHaveProperty('passwordHash');
        });

        it('debe lanzar error si email ya existe', async () => {
            prismaMock.usuario.findUnique.mockResolvedValue({ id: 'existing' });
            await expect(service.crearUsuario(data))
                .rejects.toThrow('El correo electrónico ya está registrado');
        });
    });

    describe('desactivarUsuario', () => {
        it('debe desactivar un usuario', async () => {
            prismaMock.usuario.findUnique.mockResolvedValue({ id: '1' });
            prismaMock.usuario.update.mockResolvedValue({ id: '1', email: 'a@b.co', activo: false });

            const result = await service.desactivarUsuario('1');
            expect(result.activo).toBe(false);
        });

        it('debe lanzar error si no existe', async () => {
            prismaMock.usuario.findUnique.mockResolvedValue(null);
            await expect(service.desactivarUsuario('bad'))
                .rejects.toThrow('Usuario no encontrado');
        });
    });
});
