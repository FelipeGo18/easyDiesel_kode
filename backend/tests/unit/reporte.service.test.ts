import { reporteService } from '../../src/services/reporte.service';
import { prisma } from '../../src/utils/prisma';
import { generarPDF } from '../../src/utils/pdfGenerator';
import { generarExcel, generarCSV } from '../../src/utils/excelGenerator';
import { TipoReporte, FormatoReporte } from '@prisma/client';

jest.mock('../../src/utils/prisma', () => ({
    prisma: {
        reporte: {
            create: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
        },
        tanque: { findMany: jest.fn() },
        transaccionCombustible: { findMany: jest.fn() },
        precioVigente: { findMany: jest.fn() },
        auditoriaLog: { findMany: jest.fn() },
        decretoNormativo: { findMany: jest.fn() },
    }
}));

jest.mock('../../src/utils/pdfGenerator', () => ({
    generarPDF: jest.fn().mockResolvedValue(Buffer.from('pdf-data'))
}));

jest.mock('../../src/utils/excelGenerator', () => ({
    generarExcel: jest.fn().mockResolvedValue(Buffer.from('excel-data')),
    generarCSV: jest.fn().mockResolvedValue(Buffer.from('csv-data'))
}));

describe('Reporte Service', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('generarReporte', () => {
        it('deberia generar un reporte de inventario en PDF', async () => {
            const data = {
                tipo: 'INVENTARIO' as import('@prisma/client').TipoReporte,
                formato: 'PDF' as import('@prisma/client').FormatoReporte,
                periodoInicio: '2026-01-01',
                periodoFin: '2026-01-31',
                parametros: { estacionId: 'est-1' }
            };

            const mockReporteAgregado = { id: 'rep-1', ...data };
            (prisma.reporte.create as jest.Mock).mockResolvedValue(mockReporteAgregado);
            (prisma.tanque.findMany as jest.Mock).mockResolvedValue([{ id: 'tanq-1' }]);

            const result = await reporteService.generarReporte(data, 'usr-1');

            expect(prisma.reporte.create).toHaveBeenCalled();
            expect(prisma.tanque.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ estacionId: 'est-1' })
            }));
            expect(generarPDF).toHaveBeenCalled();
            expect(result.fileBuffer.toString()).toBe('pdf-data');
            expect(result.reporte).toEqual(mockReporteAgregado);
        });

        it('deberia generar un reporte de transacciones en EXCEL', async () => {
            const data = {
                tipo: 'TRANSACCIONES' as import('@prisma/client').TipoReporte,
                formato: 'EXCEL' as import('@prisma/client').FormatoReporte,
                periodoInicio: '2026-01-01',
                periodoFin: '2026-01-31',
                parametros: {}
            };

            (prisma.reporte.create as jest.Mock).mockResolvedValue({ id: 'rep-2' });
            (prisma.transaccionCombustible.findMany as jest.Mock).mockResolvedValue([]);

            const result = await reporteService.generarReporte(data, 'usr-1');

            expect(prisma.transaccionCombustible.findMany).toHaveBeenCalled();
            expect(generarExcel).toHaveBeenCalled();
            expect(result.fileBuffer.toString()).toBe('excel-data');
        });

        it('deberia generar un reporte de auditoria en CSV', async () => {
            const data = {
                tipo: 'AUDITORIA' as import('@prisma/client').TipoReporte,
                formato: 'CSV' as import('@prisma/client').FormatoReporte,
                periodoInicio: '2026-01-01',
                periodoFin: '2026-01-31',
                parametros: { fechaDesde: '2026-01-01' } as any
            };

            (prisma.reporte.create as jest.Mock).mockResolvedValue({ id: 'rep-3' });
            (prisma.auditoriaLog.findMany as jest.Mock).mockResolvedValue([]);

            const result = await reporteService.generarReporte(data, 'usr-1');

            expect(prisma.auditoriaLog.findMany).toHaveBeenCalled();
            expect(generarCSV).toHaveBeenCalled();
            expect(result.fileBuffer.toString()).toBe('csv-data');
        });

        it('deberia consultar precios y noramtivo correctamente', async () => {
            const data = {
                tipo: 'PRECIOS' as import('@prisma/client').TipoReporte,
                formato: 'PDF' as import('@prisma/client').FormatoReporte,
                periodoInicio: '2026-01-01',
                periodoFin: '2026-01-31',
                parametros: {}
            };

            (prisma.reporte.create as jest.Mock).mockResolvedValue({ id: 'rep-4' });
            (prisma.precioVigente.findMany as jest.Mock).mockResolvedValue([]);

            await reporteService.generarReporte(data, 'usr-1');
            expect(prisma.precioVigente.findMany).toHaveBeenCalled();

            const dataNormativo = { ...data, tipo: 'NORMATIVO' as import('@prisma/client').TipoReporte };
            await reporteService.generarReporte(dataNormativo, 'usr-1');
            expect(prisma.decretoNormativo.findMany).toHaveBeenCalled();
        });
    });

    describe('obtenerReportes', () => {
        it('deberia retornar lista paginada de reportes', async () => {
            const mockReportes = [{ id: '1' }];
            (prisma.reporte.findMany as jest.Mock).mockResolvedValue(mockReportes);
            (prisma.reporte.count as jest.Mock).mockResolvedValue(1);

            const result = await reporteService.obtenerReportes(2, 5);

            expect(prisma.reporte.findMany).toHaveBeenCalledWith(expect.objectContaining({
                skip: 5,
                take: 5
            }));
            expect(result.data).toEqual(mockReportes);
            expect(result.pagination.total).toBe(1);
            expect(result.pagination.page).toBe(2);
        });
    });
});
