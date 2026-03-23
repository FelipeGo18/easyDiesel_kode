import { Request, Response } from 'express';
import { generarReporteHandler, obtenerReportesHandler } from '../../src/controllers/reporte.controller';
import { reporteService } from '../../src/services/reporte.service';

jest.mock('../../src/services/reporte.service');

describe('Reporte Controller', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        mockRequest = {
            body: {},
            query: {},
            user: { userId: 'usr-1', email: 'test@test.com', rol: 'admin' }
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            setHeader: jest.fn(),
            send: jest.fn(),
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('generarReporteHandler', () => {
        it('deberia retornar error 401 si no hay usuario', async () => {
            mockRequest.user = undefined;
            mockRequest.body = {
                tipo: 'INVENTARIO', formato: 'PDF', periodoInicio: '2026-01-01T00:00:00Z', periodoFin: '2026-12-31T23:59:59Z'
            };

            await generarReporteHandler(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ success: false, message: 'No autenticado' });
        });

        it('deberia retornar error 400 si validacion falla', async () => {
            mockRequest.body = { tipo: 'INVALID' };

            await generarReporteHandler(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
        });

        it('deberia retornar un archivo PDF', async () => {
            mockRequest.body = {
                tipo: 'TRANSACCIONES', formato: 'PDF', periodoInicio: '2026-01-01T00:00:00Z', periodoFin: '2026-12-31T23:59:59Z'
            };
            const mockBuffer = Buffer.from('pdf content');
            (reporteService.generarReporte as jest.Mock).mockResolvedValue({
                reporte: { id: 'rep-UUID-123' },
                fileBuffer: mockBuffer
            });

            await generarReporteHandler(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
            expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Disposition', expect.stringContaining('filename="Reporte_TRANSACCIONES_rep.pdf"'));
            expect(mockResponse.send).toHaveBeenCalledWith(mockBuffer);
        });

        it('deberia retornar un archivo CSV', async () => {
            mockRequest.body = {
                tipo: 'AUDITORIA', formato: 'CSV', periodoInicio: '2026-01-01T00:00:00Z', periodoFin: '2026-12-31T23:59:59Z'
            };
            const mockBuffer = Buffer.from('csv content');
            (reporteService.generarReporte as jest.Mock).mockResolvedValue({
                reporte: { id: 'rep-UUID-123' },
                fileBuffer: mockBuffer
            });

            await generarReporteHandler(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
            expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Disposition', expect.stringContaining('.csv"'));
            expect(mockResponse.send).toHaveBeenCalledWith(mockBuffer);
        });

        it('deberia retornar un archivo EXCEL', async () => {
            mockRequest.body = {
                tipo: 'INVENTARIO', formato: 'EXCEL', periodoInicio: '2026-01-01T00:00:00Z', periodoFin: '2026-12-31T23:59:59Z'
            };
            const mockBuffer = Buffer.from('excel content');
            (reporteService.generarReporte as jest.Mock).mockResolvedValue({
                reporte: { id: 'rep-UUID-123' },
                fileBuffer: mockBuffer
            });

            await generarReporteHandler(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Disposition', expect.stringContaining('.xlsx"'));
            expect(mockResponse.send).toHaveBeenCalledWith(mockBuffer);
        });
    });

    describe('obtenerReportesHandler', () => {
        it('deberia listar reportes paginados', async () => {
            mockRequest.query = { page: '2', limit: '10' };
            const mockResponseData = { data: [{ id: '1' }], pagination: { page: 2, limit: 10, total: 100 } };

            (reporteService.obtenerReportes as jest.Mock).mockResolvedValue(mockResponseData);

            await obtenerReportesHandler(mockRequest as Request, mockResponse as Response);

            expect(reporteService.obtenerReportes).toHaveBeenCalledWith(2, 10, undefined);
            expect(mockResponse.json).toHaveBeenCalledWith({ success: true, ...mockResponseData });
        });

        it('deberia manejar errores', async () => {
            (reporteService.obtenerReportes as jest.Mock).mockRejectedValue(new Error('DB Error'));

            await obtenerReportesHandler(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: 'DB Error' }));
        });
    });
});
