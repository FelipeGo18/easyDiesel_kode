import { Request, Response, NextFunction } from 'express';
import {
    registerHandler, loginHandler, meHandler,
    googleCallbackHandler, supabaseLoginHandler,
    updateProfileHandler, refreshHandler, logoutHandler,
} from '../../src/controllers/auth.controller';
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

    describe('googleCallbackHandler', () => {
        it('deberia retornar 400 si no hay code', async () => {
            mockRequest.query = {};
            await googleCallbackHandler(mockRequest as Request, mockResponse as Response, mockNext);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
        });

        it('deberia retornar 200 con login de Google exitoso', async () => {
            mockRequest.query = { code: 'google-code-123' };
            const expectedResult = { user: { id: '1' }, token: 'jwt' };
            (authService.loginWithGoogle as jest.Mock).mockResolvedValue(expectedResult);

            await googleCallbackHandler(mockRequest as Request, mockResponse as Response, mockNext);

            expect(authService.loginWithGoogle).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true, data: expectedResult,
            }));
        });

        it('deberia llamar a next en caso de error', async () => {
            mockRequest.query = { code: 'google-code-123' };
            const error = new Error('Google auth failed');
            (authService.loginWithGoogle as jest.Mock).mockRejectedValue(error);

            await googleCallbackHandler(mockRequest as Request, mockResponse as Response, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });

    describe('supabaseLoginHandler', () => {
        it('deberia retornar 400 si no hay access_token', async () => {
            mockRequest.body = {};
            await supabaseLoginHandler(mockRequest as Request, mockResponse as Response, mockNext);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
        });

        it('deberia retornar 200 con login de Supabase exitoso', async () => {
            mockRequest.body = { access_token: 'sb-token-123' };
            const expectedResult = { user: { id: '1' }, token: 'jwt' };
            (authService.loginWithSupabaseToken as jest.Mock).mockResolvedValue(expectedResult);

            await supabaseLoginHandler(mockRequest as Request, mockResponse as Response, mockNext);

            expect(authService.loginWithSupabaseToken).toHaveBeenCalledWith('sb-token-123', expect.any(Object));
            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });

        it('deberia llamar a next en caso de error', async () => {
            mockRequest.body = { access_token: 'sb-token-123' };
            const error = new Error('Supabase auth failed');
            (authService.loginWithSupabaseToken as jest.Mock).mockRejectedValue(error);

            await supabaseLoginHandler(mockRequest as Request, mockResponse as Response, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });

    describe('updateProfileHandler', () => {
        it('deberia retornar 401 si no hay usuario', async () => {
            mockRequest.body = { nombre: 'New Name' };
            await updateProfileHandler(mockRequest as Request, mockResponse as Response, mockNext);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
        });

        it('deberia retornar 200 al actualizar perfil', async () => {
            mockRequest.user = { userId: '1', email: 'a@a.com', rol: 'admin' };
            mockRequest.body = { nombre: 'New Name' };
            const profile = { id: '1', nombre: 'New Name' };
            (authService.updateProfile as jest.Mock).mockResolvedValue(profile);

            await updateProfileHandler(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: profile }));
        });

        it('deberia retornar 400 si validacion falla', async () => {
            mockRequest.user = { userId: '1', email: 'a@a.com', rol: 'admin' };
            mockRequest.body = { nombre: 'A' };
            await updateProfileHandler(mockRequest as Request, mockResponse as Response, mockNext);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
        });

        it('deberia llamar a next en error general', async () => {
            mockRequest.user = { userId: '1', email: 'a@a.com', rol: 'admin' };
            mockRequest.body = { nombre: 'Valid Name' };
            const error = new Error('DB error');
            (authService.updateProfile as jest.Mock).mockRejectedValue(error);

            await updateProfileHandler(mockRequest as Request, mockResponse as Response, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });

    describe('refreshHandler', () => {
        it('deberia retornar 200 con nueva sesion', async () => {
            mockRequest.body = { refresh_token: 'valid-refresh-token-1234567890' };
            const result = { token: 'new-jwt', refresh_token: 'new-refresh' };
            (authService.refreshSession as jest.Mock).mockResolvedValue(result);

            await refreshHandler(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: result }));
        });

        it('deberia retornar 400 si refresh token invalido', async () => {
            mockRequest.body = { refresh_token: 'short' };
            await refreshHandler(mockRequest as Request, mockResponse as Response, mockNext);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
        });

        it('deberia llamar a next en error general', async () => {
            mockRequest.body = { refresh_token: 'valid-refresh-token-1234567890' };
            const error = new Error('Session expired');
            (authService.refreshSession as jest.Mock).mockRejectedValue(error);

            await refreshHandler(mockRequest as Request, mockResponse as Response, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });

    describe('logoutHandler', () => {
        it('deberia retornar 200 al cerrar sesion', async () => {
            mockRequest.body = { refresh_token: 'valid-refresh-token-1234567890' };
            (authService.logout as jest.Mock).mockResolvedValue(undefined);

            await logoutHandler(mockRequest as Request, mockResponse as Response, mockNext);

            expect(authService.logout).toHaveBeenCalledWith('valid-refresh-token-1234567890');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('deberia retornar 400 si refresh token invalido', async () => {
            mockRequest.body = { refresh_token: 'short' };
            await logoutHandler(mockRequest as Request, mockResponse as Response, mockNext);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
        });

        it('deberia llamar a next en error general', async () => {
            mockRequest.body = { refresh_token: 'valid-refresh-token-1234567890' };
            const error = new Error('Token not found');
            (authService.logout as jest.Mock).mockRejectedValue(error);

            await logoutHandler(mockRequest as Request, mockResponse as Response, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
});
