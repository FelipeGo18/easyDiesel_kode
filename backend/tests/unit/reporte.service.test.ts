import { prisma } from '../../src/utils/prisma';
import { reporteService } from '../../src/services/reporte.service';
import { generarPDF } from '../../src/utils/pdfGenerator';
import { generarExcel, generarCSV } from '../../src/utils/excelGenerator';

jest.mock('../../src/utils/pdfGenerator', () => ({
    generarPDF: jest.fn().mockResolvedValue(Buffer.from('pdf'))
}));

jest.mock('../../src/utils/excelGenerator', () => ({
    generarExcel: jest.fn().mockResolvedValue(Buffer.from('excel')),
    generarCSV: jest.fn().mockResolvedValue(Buffer.from('csv'))
}));

jest.mock('../../src/utils/prisma', () => ({
    prisma: {
        reporte: {
            create: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
        },
        tanque: { findMany: jest.fn().mockResolvedValue([]) },
        transaccionCombustible: { findMany: jest.fn().mockResolvedValue([]) },
        precioVigente: { findMany: jest.fn().mockResolvedValue([]) },
        auditoriaLog: { findMany: jest.fn().mockResolvedValue([]) },
        decretoNormativo: { findMany: jest.fn().mockResolvedValue([]) },
    }
}));

describe('ReporteService', () => {
    const usuarioId = 'usr-123';
    const dataBase = {
        tipo: 'INVENTARIO' as const,
        formato: 'PDF' as const,
        periodoInicio: '2026-01-01',
        periodoFin: '2026-01-31',
        parametros: { estacionId: 'e1' }
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('generarReporte', () => {
        it('debe generar un reporte de inventario en PDF', async () => {
            (prisma.reporte.create as jest.Mock).mockResolvedValue({ id: 'rep-1' });
            
            const result = await reporteService.generarReporte(dataBase, usuarioId);
            
            expect(result.reporte.id).toBe('rep-1');
            expect(generarPDF).toHaveBeenCalled();
            expect(prisma.tanque.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: { estacionId: 'e1' }
            }));
        });

        it('debe generar un reporte de transacciones en EXCEL con filtros de fecha', async () => {
            (prisma.reporte.create as jest.Mock).mockResolvedValue({ id: 'rep-2' });
            const dataTx = { 
                ...dataBase, 
                tipo: 'TRANSACCIONES' as const, 
                formato: 'EXCEL' as const,
                periodoInicio: '2026-01-01T00:00:00.000Z',
                periodoFin: '2026-01-31T23:59:59.000Z',
                parametros: { estacionId: 'e1' }
            };

            await reporteService.generarReporte(dataTx, usuarioId);
            
            expect(generarExcel).toHaveBeenCalled();
            expect(prisma.transaccionCombustible.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    createdAt: expect.any(Object)
                })
            }));
        });

        it('debe generar un reporte de auditoria en CSV', async () => {
            (prisma.reporte.create as jest.Mock).mockResolvedValue({ id: 'rep-3' });
            const dataAud = { ...dataBase, tipo: 'AUDITORIA' as const, formato: 'CSV' as const };

            await reporteService.generarReporte(dataAud, usuarioId);
            expect(generarCSV).toHaveBeenCalled();
        });

        it('debe generar un reporte de precios con filtros', async () => {
            (prisma.reporte.create as jest.Mock).mockResolvedValue({ id: 'rep-pre' });
            const dataPre = { 
                ...dataBase, 
                tipo: 'PRECIOS' as const, 
                parametros: { zonaId: 'z1', tipoCombustible: 'ACPM' as const } 
            };

            await reporteService.generarReporte(dataPre, usuarioId);
            expect(prisma.precioVigente.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: { zonaId: 'z1', tipoCombustible: 'ACPM' }
            }));
        });

        it('debe manejar decretos sin precios y sin entidad en reporte NORMATIVO', async () => {
            (prisma.reporte.create as jest.Mock).mockResolvedValue({ id: 'rep-4' });
            (prisma.decretoNormativo.findMany as jest.Mock).mockResolvedValue([
                { 
                    id: 'd1', numero: '123', titulo: 'T', entidad: null, fechaExpedicion: new Date(), fechaVigencia: new Date(),
                    precios: [] 
                }
            ]);

            const result = await reporteService.generarReporte({ ...dataBase, tipo: 'NORMATIVO' as const }, usuarioId);
            expect(result.reporte).toBeDefined();
        });

        it('debe generar un reporte de inventario SIN estacionId', async () => {
            (prisma.reporte.create as jest.Mock).mockResolvedValue({ id: 'rep-inv-no-est' });
            await reporteService.generarReporte({ ...dataBase, parametros: {} }, usuarioId);
            expect(prisma.tanque.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
        });

        it('debe generar un reporte de transacciones en EXCEL con filtro de fechaDesde solo', async () => {
            (prisma.reporte.create as jest.Mock).mockResolvedValue({ id: 'rep-tx-desde' });
            const dataTx = { 
                ...dataBase, 
                tipo: 'TRANSACCIONES' as const, 
                periodoInicio: '2026-01-01',
                periodoFin: undefined as any,
                parametros: {}
            };
            await reporteService.generarReporte(dataTx, usuarioId);
            expect(prisma.transaccionCombustible.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    createdAt: { gte: expect.any(Date) }
                })
            }));
        });

        it('debe generar un reporte de transacciones en EXCEL con filtro de fechaHasta solo', async () => {
            (prisma.reporte.create as jest.Mock).mockResolvedValue({ id: 'rep-tx-hasta' });
            const dataTx = { 
                ...dataBase, 
                tipo: 'TRANSACCIONES' as const, 
                periodoInicio: undefined as any,
                periodoFin: '2026-01-31',
                parametros: { tipoCombustible: 'ACPM' as const }
            };
            await reporteService.generarReporte(dataTx, usuarioId);
            expect(prisma.transaccionCombustible.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    tipoCombustible: 'ACPM',
                    createdAt: { lte: expect.any(Date) }
                })
            }));
        });

        it('debe filtrar auditoria por usuarioId y modulo', async () => {
            (prisma.reporte.create as jest.Mock).mockResolvedValue({ id: 'rep-aud-filt' });
            const dataAud = { 
                ...dataBase, 
                tipo: 'AUDITORIA' as const, 
                parametros: { usuarioId: 'u1', modulo: 'M1' } as any
            };
            await reporteService.generarReporte(dataAud, usuarioId);
            expect(prisma.auditoriaLog.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ usuarioId: 'u1', modulo: 'M1' })
            }));
        });

        it('debe filtrar auditoria por estacionId', async () => {
            (prisma.reporte.create as jest.Mock).mockResolvedValue({ id: 'rep-aud-est' });
            const dataAud = { 
                ...dataBase, 
                tipo: 'AUDITORIA' as const, 
                parametros: { estacionId: 'e1' } as any
            };
            await reporteService.generarReporte(dataAud, usuarioId);
            expect(prisma.auditoriaLog.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ 
                    usuario: { estacionGestionada: { id: 'e1' } }
                })
            }));
        });

        it('debe filtrar auditoria por modulo sin estacionId', async () => {
            (prisma.reporte.create as jest.Mock).mockResolvedValue({ id: 'rep-aud-mod' });
            const dataAud = { 
                ...dataBase, 
                tipo: 'AUDITORIA' as const, 
                periodoInicio: '2026-01-01',
                periodoFin: '2026-01-31',
                parametros: { modulo: 'M1', entidad: 'E1', accion: 'A1' } as any
            };
            await reporteService.generarReporte(dataAud, usuarioId);
            expect(prisma.auditoriaLog.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ 
                    modulo: 'M1', 
                    entidad: 'E1', 
                    accion: 'A1',
                    createdAt: { 
                        gte: expect.any(Date),
                        lte: expect.any(Date)
                    }
                })
            }));
        });

        it('debe filtrar auditoria por usuarioId sin otros filtros', async () => {
            (prisma.reporte.create as jest.Mock).mockResolvedValue({ id: 'rep-aud-user' });
            const dataAud = { ...dataBase, tipo: 'AUDITORIA' as const, parametros: { usuarioId: 'u1' } as any };
            await reporteService.generarReporte(dataAud, usuarioId);
            expect(prisma.auditoriaLog.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ usuarioId: 'u1' })
            }));
        });

        it('debe filtrar auditoria por fechaDesde solo', async () => {
            (prisma.reporte.create as jest.Mock).mockResolvedValue({ id: 'rep-aud-date' });
            const dataAud = { 
                ...dataBase, 
                tipo: 'AUDITORIA' as const, 
                periodoInicio: '2026-01-01',
                periodoFin: undefined as any,
                parametros: {} 
            };
            await reporteService.generarReporte(dataAud, usuarioId);
            expect(prisma.auditoriaLog.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ createdAt: { gte: expect.any(Date) } })
            }));
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
        });

        it('deberia filtrar reportes por usuarioId', async () => {
            (prisma.reporte.findMany as jest.Mock).mockResolvedValue([]);
            (prisma.reporte.count as jest.Mock).mockResolvedValue(0);

            await reporteService.obtenerReportes(1, 10, 'usr-1');
            expect(prisma.reporte.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: { generadoPor: 'usr-1' } })
            );
        });
    });
});
