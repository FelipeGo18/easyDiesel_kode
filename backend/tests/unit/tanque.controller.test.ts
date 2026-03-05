import { Request, Response } from 'express';
import {
    obtenerTanquesHandler,
    obtenerTanquePorIdHandler,
    crearTanqueHandler,
    actualizarTanqueHandler
} from '../../src/controllers/tanque.controller';
import { tanqueService } from '../../src/services/tanque.service';
import { ZodError } from 'zod';

jest.mock('../../src/services/tanque.service');

describe('Tanque Controller', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        mockRequest = { params: {}, body: {}, query: {} };
        mockResponse = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    });

    afterEach(() => { jest.clearAllMocks(); });

    describe('obtenerTanquesHandler', () => {
        it('deberia retornar 200 y la lista de tanques', async () => {
            mockRequest.query = { estacionId: '123' };
            const mockTanques = [{ id: '1', codigo: 'T1' }];
            (tanqueService.obtenerTanques as jest.Mock).mockResolvedValue(mockTanques);

            await obtenerTanquesHandler(mockRequest as Request, mockResponse as Response);
            expect(mockResponse.json).toHaveBeenCalledWith({ success: true, data: mockTanques });
        });

        it('deberia retornar 500 en error', async () => {
            (tanqueService.obtenerTanques as jest.Mock).mockRejectedValue(new Error('Error db'));
            await obtenerTanquesHandler(mockRequest as Request, mockResponse as Response);
            expect(mockResponse.status).toHaveBeenCalledWith(500);
        });
    });

    describe('obtenerTanquePorIdHandler', () => {
        it('deberia retornar 200 y el tanque', async () => {
            mockRequest.params = { id: '1' };
            const mockTanque = { id: '1', codigo: 'T1' };
            (tanqueService.obtenerTanquePorId as jest.Mock).mockResolvedValue(mockTanque);

            await obtenerTanquePorIdHandler(mockRequest as Request, mockResponse as Response);
            expect(mockResponse.json).toHaveBeenCalledWith({ success: true, data: mockTanque });
        });

        it('deberia retornar 404 si no existe', async () => {
            mockRequest.params = { id: '99' };
            (tanqueService.obtenerTanquePorId as jest.Mock).mockRejectedValue(new Error('Tanque no encontrado'));
            await obtenerTanquePorIdHandler(mockRequest as Request, mockResponse as Response);
            expect(mockResponse.status).toHaveBeenCalledWith(404);
        });

        it('deberia retornar 500 si error es otro', async () => {
            mockRequest.params = { id: '99' };
            (tanqueService.obtenerTanquePorId as jest.Mock).mockRejectedValue(new Error('DB crash'));
            await obtenerTanquePorIdHandler(mockRequest as Request, mockResponse as Response);
            expect(mockResponse.status).toHaveBeenCalledWith(500);
        });
    });

    describe('crearTanqueHandler', () => {
        const mockPayload = {
            nombre: 'Tanque 01', 
            tipoCombustible: 'ACPM',
            capacidadGalones: 10000, 
            nivelMinimo: 1000,
            estacionId: '123e4567-e89b-12d3-a456-426614174000'
        };

        it('deberia retornar 201 y crearlo', async () => {
            mockRequest.body = mockPayload;
            const mockCreated = { id: '1', ...mockPayload };
            (tanqueService.crearTanque as jest.Mock).mockResolvedValue(mockCreated);

            await crearTanqueHandler(mockRequest as Request, mockResponse as Response);
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ data: mockCreated }));
        });

        it('deberia retornar 400 por validacion fallida', async () => {
            mockRequest.body = {};
            await crearTanqueHandler(mockRequest as Request, mockResponse as Response);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
        });

        it('deberia retornar 400 por error interno', async () => {
            mockRequest.body = mockPayload;
            (tanqueService.crearTanque as jest.Mock).mockRejectedValue(new Error('Error creando'));
            await crearTanqueHandler(mockRequest as Request, mockResponse as Response);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
        });
    });

    describe('actualizarTanqueHandler', () => {
        it('deberia retornar 200 y actualizarlo', async () => {
            mockRequest.params = { id: '1' };
            mockRequest.body = { nombre: 'Tanque Editado' };
            const mockUpdated = { id: '1', nombre: 'Tanque Editado' };
            (tanqueService.actualizarTanque as jest.Mock).mockResolvedValue(mockUpdated);

            await actualizarTanqueHandler(mockRequest as Request, mockResponse as Response);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ data: mockUpdated }));
        });

        it('deberia retornar 400 si body esta vacio', async () => {
            mockRequest.params = { id: '1' };
            mockRequest.body = {};
            await actualizarTanqueHandler(mockRequest as Request, mockResponse as Response);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'No hay datos para actualizar'
            });
            expect(tanqueService.actualizarTanque).not.toHaveBeenCalled();
        });

        it('deberia retornar 400 si tipoCombustible invalido', async () => {
            mockRequest.params = { id: '1' };
            mockRequest.body = { tipoCombustible: 'INVALIDO' };
            await actualizarTanqueHandler(mockRequest as Request, mockResponse as Response);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
        });

        it('deberia retornar 404 si no encontrado', async () => {
            mockRequest.params = { id: '99' };
            mockRequest.body = { nombre: 'Tanque Editado' };
            (tanqueService.actualizarTanque as jest.Mock).mockRejectedValue(new Error('Tanque no encontrado'));
            await actualizarTanqueHandler(mockRequest as Request, mockResponse as Response);
            expect(mockResponse.status).toHaveBeenCalledWith(404);
        });

        it('deberia retornar 400 por excepcion', async () => {
            mockRequest.params = { id: '99' };
            mockRequest.body = { nombre: 'Tanque Editado' };
            (tanqueService.actualizarTanque as jest.Mock).mockRejectedValue(new Error('Conflict'));
            await actualizarTanqueHandler(mockRequest as Request, mockResponse as Response);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
        });
    });
});
