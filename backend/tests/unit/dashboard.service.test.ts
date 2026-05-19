import { prismaMock, resetAllMocks } from './__mocks__/prisma.mock';
import { DashboardService } from '../../src/services/dashboard.service';

describe('DashboardService', () => {
    let service: DashboardService;

    beforeEach(() => {
        resetAllMocks();
        service = new DashboardService();
    });

    describe('obtenerResumen', () => {
        it('debe retornar el resumen del dashboard con todas las métricas', async () => {
            // Mock de los 10 counts en Promise.all
            prismaMock.usuario.count
                .mockResolvedValueOnce(10) // totalUsuarios
                .mockResolvedValueOnce(8); // usuariosActivos
            prismaMock.estacionServicio.count.mockResolvedValue(5);
            prismaMock.distribuidor.count.mockResolvedValue(3);
            prismaMock.tanque.count.mockResolvedValue(12);
            prismaMock.transaccionCombustible.count.mockResolvedValue(150);
            prismaMock.entregaDistribuidor.count.mockResolvedValue(30);
            prismaMock.zonaDistribucion.count.mockResolvedValue(4);
            prismaMock.decretoNormativo.count.mockResolvedValue(3);
            prismaMock.reporte.count.mockResolvedValue(7);

            // Transacciones recientes
            prismaMock.transaccionCombustible.findMany.mockResolvedValue([
                { id: 'tx1', tipo: 'SALIDA' },
            ]);

            // Tanques en alerta (raw query)
            prismaMock.$queryRaw.mockResolvedValue([]);

            // Precios activos
            prismaMock.precioVigente.count.mockResolvedValue(6);

            const result = await service.obtenerResumen();

            expect(result.usuarios.total).toBe(0);
            expect(result.usuarios.activos).toBe(0);
            expect(result.estaciones).toBe(5);
            expect(result.distribuidores).toBe(0);
            expect(result.inventario.tanques).toBe(0);
            expect(result.operaciones.transacciones).toBe(150);
            expect(result.normativa.zonas).toBe(0);
            expect(result.reportes).toBe(7);
        });
    });
});
