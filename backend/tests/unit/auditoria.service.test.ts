import { auditoriaService } from '../../src/services/auditoria.service';
import { prisma } from '../../src/utils/prisma';

jest.mock('../../src/utils/prisma', () => ({
    prisma: {
        auditoriaLog: {
            create: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
            findUnique: jest.fn(),
        }
    }
}));

describe('Auditoria Service', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('registrarLog', () => {
        it('deberia crear un log de auditoria exitosamente', async () => {
            const mockData = {
                usuarioId: 'usr-1',
                modulo: 'auth',
                accion: 'LOGIN',
                entidad: 'Usuario'
            };

            const expectedLog = { id: 'log-1', ...mockData, createdAt: new Date() };
            (prisma.auditoriaLog.create as jest.Mock).mockResolvedValue(expectedLog);

            const result = await auditoriaService.registrarLog(mockData);

            expect(prisma.auditoriaLog.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    usuarioId: mockData.usuarioId,
                    modulo: 'AUTH',
                    accion: mockData.accion,
                    entidad: mockData.entidad,
                })
            });
            expect(result).toEqual(expectedLog);
        });
    });

    describe('obtenerLogs', () => {
        it('deberia retornar logs paginados con filtros', async () => {
            const mockLogs = [{ id: '1', accion: 'LOGIN' }, { id: '2', accion: 'UPDATE' }];
            (prisma.auditoriaLog.findMany as jest.Mock).mockResolvedValue(mockLogs);
            (prisma.auditoriaLog.count as jest.Mock).mockResolvedValue(2);

            const filtros = { usuarioId: 'usr-1', page: 1, limit: 10 };
            const result = await auditoriaService.obtenerLogs(filtros);

            expect(prisma.auditoriaLog.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ usuarioId: 'usr-1' }),
                skip: 0,
                take: 10
            }));
            expect(prisma.auditoriaLog.count).toHaveBeenCalledWith({
                where: expect.objectContaining({ usuarioId: 'usr-1' })
            });
            expect(result.data).toEqual(mockLogs);
            expect(result.pagination.total).toBe(2);
        });

        it('deberia aplicar filtros de fecha correctamente', async () => {
            (prisma.auditoriaLog.findMany as jest.Mock).mockResolvedValue([]);
            (prisma.auditoriaLog.count as jest.Mock).mockResolvedValue(0);

            const filtros = { desde: '2026-01-01', hasta: '2026-12-31' };
            await auditoriaService.obtenerLogs(filtros);

            expect(prisma.auditoriaLog.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    createdAt: {
                        gte: new Date('2026-01-01'),
                        lte: new Date('2026-12-31')
                    }
                })
            }));
        });
    });

    describe('obtenerLogPorId', () => {
        it('deberia retornar un log especifico por id', async () => {
            const mockLog = { id: 'log-1', accion: 'LOGIN' };
            (prisma.auditoriaLog.findUnique as jest.Mock).mockResolvedValue(mockLog);

            const result = await auditoriaService.obtenerLogPorId('log-1');

            expect(prisma.auditoriaLog.findUnique).toHaveBeenCalledWith({
                where: { id: 'log-1' },
                include: { usuario: { select: { id: true, email: true, nombre: true } } }
            });
            expect(result).toEqual(mockLog);
        });

        it('deberia lanzar error si el log no se encuentra', async () => {
            (prisma.auditoriaLog.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(auditoriaService.obtenerLogPorId('no-existe'))
                .rejects
                .toThrow('Log de auditoria no encontrado');
        });
    });
});
