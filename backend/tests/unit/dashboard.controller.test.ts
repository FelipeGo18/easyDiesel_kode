import { Request, Response } from 'express';
import { obtenerResumenHandler } from '../../src/controllers/dashboard.controller';
import { dashboardService } from '../../src/services/dashboard.service';

jest.mock('../../src/services/dashboard.service');

describe('Dashboard Controller', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        mockRequest = {};
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('obtenerResumenHandler', () => {
        it('deberia retornar 200 y el resumen', async () => {
            const mockResumen = { totalTanques: 5, transaccionesHoy: 10 };
            (dashboardService.obtenerResumen as jest.Mock).mockResolvedValue(mockResumen);

            await obtenerResumenHandler(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.json).toHaveBeenCalledWith({ success: true, data: mockResumen });
        });

        it('deberia retornar 500 si el servicio falla', async () => {
            (dashboardService.obtenerResumen as jest.Mock).mockRejectedValue(new Error('Dashboard error'));

            await obtenerResumenHandler(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ success: false, message: 'Dashboard error' });
        });
    });
});
