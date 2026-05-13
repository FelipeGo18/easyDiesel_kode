import { Request, Response } from 'express';
import {
    obtenerPreciosHandler,
    obtenerPrecioPorIdHandler,
    crearPrecioHandler,
    actualizarPrecioHandler,
    consultarPrecioActualHandler
} from '../../src/controllers/precio.controller';
import { precioService } from '../../src/services/precio.service';

jest.mock('../../src/services/precio.service');

describe('Precio Controller', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        mockRequest = { params: {}, body: {}, query: {}, ip: '127.0.0.1', get: jest.fn().mockReturnValue('test-agent') };
        mockResponse = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    });

    afterEach(() => { jest.clearAllMocks(); });

    describe('obtenerPreciosHandler', () => {
        it('deberia retornar 200 y una lista de precios', async () => {
            const mockPrecios = [{ id: '1', precio: 1000 }];
            (precioService.obtenerPrecios as jest.Mock).mockResolvedValue(mockPrecios);

            await obtenerPreciosHandler(mockRequest as Request, mockResponse as Response);
            expect(mockResponse.json).toHaveBeenCalledWith({ success: true, data: mockPrecios });
        });

        it('deberia retornar 500 en caso de error interno', async () => {
            (precioService.obtenerPrecios as jest.Mock).mockRejectedValue(new Error('Internal DB Error'));

            await obtenerPreciosHandler(mockRequest as Request, mockResponse as Response);
            expect(mockResponse.status).toHaveBeenCalledWith(500);
        });
    });

    describe('obtenerPrecioPorIdHandler', () => {
        it('deberia retornar 200 y el precio por id', async () => {
            mockRequest.params = { id: '1' };
            const mockPrecio = { id: '1', precio: 1000 };
            (precioService.obtenerPrecioPorId as jest.Mock).mockResolvedValue(mockPrecio);

            await obtenerPrecioPorIdHandler(mockRequest as Request, mockResponse as Response);
            expect(mockResponse.json).toHaveBeenCalledWith({ success: true, data: mockPrecio });
        });

        it('deberia retornar 404 si el precio no se encuentra', async () => {
            mockRequest.params = { id: '99' };
            (precioService.obtenerPrecioPorId as jest.Mock).mockRejectedValue(new Error('Precio no encontrado'));

            await obtenerPrecioPorIdHandler(mockRequest as Request, mockResponse as Response);
            expect(mockResponse.status).toHaveBeenCalledWith(404);
        });

        it('deberia retornar 500 para otro tipo de error service', async () => {
            mockRequest.params = { id: '99' };
            (precioService.obtenerPrecioPorId as jest.Mock).mockRejectedValue(new Error('SyntaxError db'));
            await obtenerPrecioPorIdHandler(mockRequest as Request, mockResponse as Response);
            expect(mockResponse.status).toHaveBeenCalledWith(500);
        });
    });

    describe('crearPrecioHandler', () => {
        const mockPayload = { 
            tipoCombustible: 'ACPM', 
            tipoServicio: 'PARTICULAR',
            zonaId: '123e4567-e89b-12d3-a456-426614174000', 
            precioGalon: 15000, 
            subsidioGalon: 2000,
            decretoId: '123e4567-e89b-12d3-a456-426614174000',
            vigenciaDesde: '2026-01-01T00:00:00Z'
        };

        it('deberia retornar 201 y crear precio', async () => {
            mockRequest.body = mockPayload;
            (precioService.crearPrecio as jest.Mock).mockResolvedValue({ id: '1', ...mockPayload });

            await crearPrecioHandler(mockRequest as Request, mockResponse as Response);
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('deberia retornar 400 por validacion fallida', async () => {
            mockRequest.body = { precioGalon: -5 };
            await crearPrecioHandler(mockRequest as Request, mockResponse as Response);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, errors: expect.anything() }));
        });

        it('deberia retornar 400 por error generico logico de negocio', async () => {
            mockRequest.body = mockPayload;
            (precioService.crearPrecio as jest.Mock).mockRejectedValue(new Error('El margen no es permitido'));
            await crearPrecioHandler(mockRequest as Request, mockResponse as Response);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
        });
    });

    describe('actualizarPrecioHandler', () => {
        it('deberia retornar 200 y actualizar precio', async () => {
            mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };
            mockRequest.body = { precioGalon: 16000 };
            (precioService.actualizarPrecio as jest.Mock).mockResolvedValue({ id: '1', precioGalon: 16000 });

            await actualizarPrecioHandler(mockRequest as Request, mockResponse as Response);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('deberia retornar 404 si precio a actualizar no existe', async () => {
            mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };
            mockRequest.body = { precioGalon: 16000 };
            (precioService.actualizarPrecio as jest.Mock).mockRejectedValue(new Error('Precio no encontrado'));

            await actualizarPrecioHandler(mockRequest as Request, mockResponse as Response);
            expect(mockResponse.status).toHaveBeenCalledWith(404);
        });

        it('deberia retornar 400 por validacion de zod de actualizacion', async () => {
            mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };
            mockRequest.body = { precioGalon: -999 };
            await actualizarPrecioHandler(mockRequest as Request, mockResponse as Response);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
        });

        it('deberia retornar 400 por otro error genérico de servicio', async () => {
            mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };
            mockRequest.body = { precioGalon: 16000 };
            (precioService.actualizarPrecio as jest.Mock).mockRejectedValue(new Error('Otro Error'));
            await actualizarPrecioHandler(mockRequest as Request, mockResponse as Response);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
        });
    });

    describe('consultarPrecioActualHandler', () => {
        it('deberia retornar 200 y el precio actual de un combustible', async () => {
            mockRequest.query = { tipoCombustible: 'ACPM', tipoServicio: 'ESTACION', zonaId: 'uuid' };
            (precioService.consultarPrecioActual as jest.Mock).mockResolvedValue({ precio: 2000 });

            await consultarPrecioActualHandler(mockRequest as Request, mockResponse as Response);
            expect(mockResponse.json).toHaveBeenCalledWith({ success: true, data: { precio: 2000 } });
        });

        it('deberia retornar 400 si faltan parametros querystring', async () => {
            mockRequest.query = { tipoCombustible: 'ACPM' };

            await consultarPrecioActualHandler(mockRequest as Request, mockResponse as Response);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
        });

        it('deberia retornar 404 si el precio no se encuentra', async () => {
            mockRequest.query = { tipoCombustible: 'ACPM', tipoServicio: 'ESTACION', zonaId: 'uuid' };
            (precioService.consultarPrecioActual as jest.Mock).mockRejectedValue(new Error('Precio no encontrado'));

            await consultarPrecioActualHandler(mockRequest as Request, mockResponse as Response);
            expect(mockResponse.status).toHaveBeenCalledWith(404);
        });
    });
});
