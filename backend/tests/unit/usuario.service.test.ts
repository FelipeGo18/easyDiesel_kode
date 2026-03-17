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
            prismaMock.usuario.count.mockResolvedValue(1);
            const result = await service.obtenerUsuarios({ search: 'A' });
            expect(result.data).toHaveLength(1);
            expect(result.data[0]).not.toHaveProperty('passwordHash');
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
                id: '2', email: data.email, nombre: data.nombre, passwordHash: 'h', rolId: 'r1', rol: { nombre: 'particular' },
            });

            const result = await service.crearUsuario(data);
            expect(result.email).toBe(data.email);
            expect(result).not.toHaveProperty('passwordHash');
        });

        it('debe crear usuario con estacionId', async () => {
            prismaMock.usuario.findUnique.mockResolvedValue(null);
            prismaMock.rol.findUnique.mockResolvedValue({ id: 'r1', nombre: 'particular' });
            prismaMock.usuario.create.mockResolvedValue({ id: 'u1', rolId: 'r1', email: data.email, rol: {} });
            prismaMock.estacionServicio.update.mockResolvedValue({ id: 'e1' });

            const result = await service.crearUsuario({ ...data, estacionId: 'e1' });
            expect(result.id).toBe('u1');
            expect(prismaMock.estacionServicio.update).toHaveBeenCalled();
        });

        it('debe lanzar error si email ya existe', async () => {
            prismaMock.usuario.findUnique.mockResolvedValue({ id: 'existing' });
            await expect(service.crearUsuario(data))
                .rejects.toThrow('El correo electrónico ya está registrado');
        });

        it('debe lanzar error si rol particular no existe', async () => {
            prismaMock.usuario.findUnique.mockResolvedValue(null);
            prismaMock.rol.findUnique.mockResolvedValue(null);
            await expect(service.crearUsuario(data)).rejects.toThrow('Rol base "particular" no encontrado');
        });
    });

    describe('actualizarUsuario', () => {
        const updateData = { nombre: 'Nuevo', email: 'new@a.co', estacionId: 'e2' };
        it('debe actualizar exitosamente', async () => {
            prismaMock.usuario.findUnique.mockResolvedValueOnce({ id: '1', email: 'old@a.co' }); // existe
            prismaMock.usuario.findUnique.mockResolvedValueOnce(null); // email libre
            prismaMock.usuario.update.mockResolvedValue({ id: '1', nombre: 'Nuevo', rol: {} });
            prismaMock.estacionServicio.updateMany.mockResolvedValue({ count: 1 });
            prismaMock.estacionServicio.update.mockResolvedValue({ id: 'e2' });

            const result = await service.actualizarUsuario('1', updateData);
            expect(result.nombre).toBe('Nuevo');
        });

        it('debe lanzar error si email en uso por otro', async () => {
            prismaMock.usuario.findUnique.mockResolvedValueOnce({ id: '1', email: 'old@a.co' });
            prismaMock.usuario.findUnique.mockResolvedValueOnce({ id: '2', email: 'new@a.co' });
            await expect(service.actualizarUsuario('1', { email: 'new@a.co' })).rejects.toThrow('en uso');
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

    describe('obtenerRoles', () => {
        it('debe listar roles', async () => {
            prismaMock.rol.findMany.mockResolvedValue([{ id: '1', nombre: 'A' }]);
            const res = await service.obtenerRoles();
            expect(res).toHaveLength(1);
        });
    });
});
