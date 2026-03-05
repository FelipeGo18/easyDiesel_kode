import { Request, Response } from 'express';
import {
    cierreTurnoHandler,
    registrarEntregaHandler,
    registrarTransaccionHandler
} from '../../src/controllers/inventario.controller';
import { inventarioService } from '../../src/services/inventario.service';

jest.mock('../../src/services/inventario.service');

describe('Inventario Controller', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        mockRequest = { body: {} };
        mockResponse = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    });

    afterEach(() => { jest.clearAllMocks(); });

    describe('cierreTurnoHandler', () => {
        const mockPayload = { 
            estacionId: '123e4567-e89b-12d3-a456-426614174000', 
            tanqueId: '123e4567-e89b-12d3-a456-426614174000', 
            nivelFisico: 1000,
            observaciones: 'Ok' 
        };

        it('deberia retornar 200 al hacer cierre de turno exitoso', async () => {
            mockRequest.body = mockPayload;
            (inventarioService.cierreTurno as jest.Mock).mockResolvedValue({ id: '1' });

            await cierreTurnoHandler(mockRequest as Request, mockResponse as Response);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('deberia retornar 400 por error zod validacion', async () => {
            mockRequest.body = { parking: 'invalid' };
            await cierreTurnoHandler(mockRequest as Request, mockResponse as Response);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, errors: expect.anything() }));
        });

        it('deberia retornar 400 por error en inventarioService', async () => {
            mockRequest.body = mockPayload;
            (inventarioService.cierreTurno as jest.Mock).mockRejectedValue(new Error('Diferencia enorme reportada'));
            await cierreTurnoHandler(mockRequest as Request, mockResponse as Response);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Diferencia enorme reportada' }));
        });
    });

    describe('registrarEntregaHandler', () => {
        const mockPayload = { 
            tanqueId: '123e4567-e89b-12d3-a456-426614174000', 
            estacionId: '123e4567-e89b-12d3-a456-426614174000',
            distribuidorId: '123e4567-e89b-12d3-a456-426614174000', 
            tipoCombustible: 'ACPM',
            galones: 500,
            precioUnitario: 10000,
            numeroRemision: 'REM-001',
            fechaEntrega: new Date().toISOString()
        };

        it('deberia retornar 201 al registrar la entrega exitosamente', async () => {
            mockRequest.body = mockPayload;
            (inventarioService.registrarEntrega as jest.Mock).mockResolvedValue({ id: 'e-1' });

            await registrarEntregaHandler(mockRequest as Request, mockResponse as Response);
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('deberia retornar 400 por error validacion entrega', async () => {
            mockRequest.body = { galones: -100 };
            await registrarEntregaHandler(mockRequest as Request, mockResponse as Response);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
        });

        it('deberia retornar 400 por rechazo logico en entrega', async () => {
            mockRequest.body = mockPayload;
            (inventarioService.registrarEntrega as jest.Mock).mockRejectedValue(new Error('Excede volumen máximo del tanque'));
            await registrarEntregaHandler(mockRequest as Request, mockResponse as Response);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Excede volumen máximo del tanque' }));
        });
    });

    describe('registrarTransaccionHandler', () => {
        const mockPayload = { 
            estacionId: '123e4567-e89b-12d3-a456-426614174000',
            tanqueId: '123e4567-e89b-12d3-a456-426614174000', 
            tipoCombustible: 'ACPM',
            tipoServicio: 'PARTICULAR',
            galones: 10, 
            precioUnitario: 12000,
            placaVehiculo: 'AAA123' 
        };

        it('deberia retornar 201 al despachar con exito y enviar alerta', async () => {
            mockRequest.body = mockPayload;
            (inventarioService.registrarTransaccion as jest.Mock).mockResolvedValue({ id: 'tr-1', _alertaNivelMinimo: true });

            await registrarTransaccionHandler(mockRequest as Request, mockResponse as Response);
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                alerta: 'ATENCIÓN: El tanque ha alcanzado o superado el nivel mínimo operativo'
            }));
        });

        it('deberia retornar 201 al despachar con exito y sin alerta', async () => {
            mockRequest.body = mockPayload;
            (inventarioService.registrarTransaccion as jest.Mock).mockResolvedValue({ id: 'tr-1', _alertaNivelMinimo: false });

            await registrarTransaccionHandler(mockRequest as Request, mockResponse as Response);
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.not.objectContaining({ alerta: expect.any(String) })
            );
        });

        it('deberia retornar 400 ante validacion zod fallida transaccion', async () => {
            mockRequest.body = { galones: 'texto' };
            await registrarTransaccionHandler(mockRequest as Request, mockResponse as Response);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
        });

        it('deberia retornar 400 ante excepcion negocio (sin volumen)', async () => {
            mockRequest.body = mockPayload;
            (inventarioService.registrarTransaccion as jest.Mock).mockRejectedValue(new Error('No hay sufiente volumen'));
            await registrarTransaccionHandler(mockRequest as Request, mockResponse as Response);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
        });
    });
});
