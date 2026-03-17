import { Request, Response } from 'express';
import {
    obtenerUsuariosHandler,
    obtenerUsuarioPorIdHandler,
    crearUsuarioHandler,
    actualizarUsuarioHandler,
    desactivarUsuarioHandler
} from '../../src/controllers/usuario.controller';
import { usuarioService } from '../../src/services/usuario.service';
import { ZodError } from 'zod';

jest.mock('../../src/services/usuario.service');

describe('Usuario Controller', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        mockRequest = {
            params: {},
            body: {},
            query: {}
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('obtenerUsuariosHandler', () => {
        it('deberia retornar 200 y una lista de usuarios', async () => {
            const mockUsers = [{ id: '1', nombre: 'Test 1' }, { id: '2', nombre: 'Test 2' }];
            const mockResult = { data: mockUsers, pagination: { page: 1, limit: 50, total: 2, totalPages: 1 } };
            (usuarioService.obtenerUsuarios as jest.Mock).mockResolvedValue(mockResult);

            await obtenerUsuariosHandler(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.json).toHaveBeenCalledWith({ success: true, ...mockResult });
        });

        it('deberia retornar 500 en caso de error', async () => {
            (usuarioService.obtenerUsuarios as jest.Mock).mockRejectedValue(new Error('DB Error'));

            await obtenerUsuariosHandler(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
        });
    });

    describe('obtenerUsuarioPorIdHandler', () => {
        it('deberia retornar 200 y el usuario correspondiente', async () => {
            const mockUser = { id: '1', nombre: 'Test 1' };
            mockRequest.params = { id: '1' };
            (usuarioService.obtenerUsuarioPorId as jest.Mock).mockResolvedValue(mockUser);

            await obtenerUsuarioPorIdHandler(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.json).toHaveBeenCalledWith({ success: true, data: mockUser });
        });

        it('deberia retornar 404 si el usuario no existe (error service)', async () => {
            mockRequest.params = { id: '99' };
            (usuarioService.obtenerUsuarioPorId as jest.Mock).mockRejectedValue(new Error('No encontrado'));

            await obtenerUsuarioPorIdHandler(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
        });
    });

    describe('crearUsuarioHandler', () => {
        it('deberia retornar 201 al crear exitosamente', async () => {
            const mockBody = { email: 'test@test.com', nombre: 'Test', password: 'Password1!', rolId: '123e4567-e89b-12d3-a456-426614174000' };
            mockRequest.body = mockBody;
            const mockCreated = { id: '1', ...mockBody };
            (usuarioService.crearUsuario as jest.Mock).mockResolvedValue(mockCreated);

            await crearUsuarioHandler(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: mockCreated }));
        });

        it('deberia retornar 400 si falla validacion', async () => {
            mockRequest.body = { email: 'invalid' }; // Missing required fields

            await crearUsuarioHandler(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
        });
    });

    describe('actualizarUsuarioHandler', () => {
        it('deberia retornar 200 al actualizar', async () => {
            mockRequest.params = { id: '1' };
            mockRequest.body = { nombre: 'Renamed' };
            const mockUpdated = { id: '1', nombre: 'Renamed' };
            (usuarioService.actualizarUsuario as jest.Mock).mockResolvedValue(mockUpdated);

            await actualizarUsuarioHandler(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: mockUpdated }));
        });

        it('deberia retornar 400 si el payload es vácio', async () => {
            mockRequest.params = { id: '1' };
            mockRequest.body = {};

            await actualizarUsuarioHandler(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ success: false, message: 'No hay datos válidos para actualizar' });
        });
    });

    describe('desactivarUsuarioHandler', () => {
        it('deberia retornar 200 al desactivar', async () => {
            mockRequest.params = { id: '1' };
            (usuarioService.desactivarUsuario as jest.Mock).mockResolvedValue({ id: '1', activo: false });

            await desactivarUsuarioHandler(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });
});
