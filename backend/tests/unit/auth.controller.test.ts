import { Request, Response, NextFunction } from 'express';
import { registerHandler, loginHandler, meHandler } from '../../src/controllers/auth.controller';
import { authService } from '../../src/services/auth.service';
import { ZodError } from 'zod';

jest.mock('../../src/services/auth.service');

describe('Auth Controller', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: jest.Mock;

    beforeEach(() => {
        mockRequest = {
            body: {}
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockNext = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('registerHandler', () => {
        it('deberia retornar 201 y el resultado en caso de éxito', async () => {
            const mockData = { email: 'test@test.com', password: 'Password1!', nombre: 'Test', rolId: '123e4567-e89b-12d3-a456-426614174000' };
            mockRequest.body = mockData;

            const expectedResult = { user: { id: '1', email: 'test@test.com' }, token: 'jwt-token' };
            (authService.register as jest.Mock).mockResolvedValue(expectedResult as any);

            await registerHandler(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Usuario registrado exitosamente',
                data: expectedResult,
            });
        });

        it('deberia retornar 400 si la validacion falla (ZodError)', async () => {
            mockRequest.body = { email: 'invalid' }; // missing required fields

            await registerHandler(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: 'Datos de registro inválidos',
            }));
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('deberia llamar a next(error) si ocurre un error general', async () => {
            const mockData = { email: 'test@test.com', password: 'Password1!', nombre: 'Test', rolId: '123e4567-e89b-12d3-a456-426614174000' };
            mockRequest.body = mockData;
            const error = new Error('Database error');
            (authService.register as jest.Mock).mockRejectedValue(error);

            await registerHandler(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });

    describe('loginHandler', () => {
        it('deberia retornar 200 y el token en caso de exito', async () => {
            const mockData = { email: 'test@test.com', password: 'Password1!' };
            mockRequest.body = mockData;

            const expectedResult = { user: { id: '1', email: 'test@test.com' }, token: 'jwt-token' };
            (authService.login as jest.Mock).mockResolvedValue(expectedResult as any);

            await loginHandler(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Login exitoso',
                data: expectedResult,
            });
        });

        it('deberia retornar 400 si la validacion falla', async () => {
            mockRequest.body = { email: 'invalid' };

            await loginHandler(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
        });
    });

    describe('meHandler', () => {
        it('deberia retornar 401 si no hay usuario en request', async () => {
            mockRequest.user = undefined;

            await meHandler(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'No autenticado'
            });
        });

        it('deberia retornar 200 y el perfil del usuario', async () => {
            mockRequest.user = { userId: '1', email: 'test@test.com', rol: 'admin' };

            const expectedProfile = { id: '1', email: 'test@test.com', nombre: 'Test' };
            (authService.getProfile as jest.Mock).mockResolvedValue(expectedProfile as any);

            await meHandler(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: expectedProfile,
            });
        });
    });
});
