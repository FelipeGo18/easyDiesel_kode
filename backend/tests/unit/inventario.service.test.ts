import { prismaMock, resetAllMocks } from './__mocks__/prisma.mock';
import { InventarioService } from '../../src/services/inventario.service';

describe('InventarioService', () => {
    let service: InventarioService;

    const tanqueMock = {
        id: 't1', estacionId: 'e1', tipoCombustible: 'ACPM',
        capacidadGalones: 10000, nivelActual: 3000, nivelMinimo: 500,
    };

    beforeEach(() => {
        resetAllMocks();
        service = new InventarioService();
    });

    // ─── ENTREGAS ───

    describe('registrarEntrega', () => {
        const data = {
            distribuidorId: 'd1', estacionId: 'e1', tanqueId: 't1',
            tipoCombustible: 'ACPM' as const, galones: 2000, precioUnitario: 9500,
            numeroRemision: 'REM-001', fechaEntrega: new Date().toISOString(),
        };

        it('debe registrar una entrega exitosamente', async () => {
            prismaMock.tanque.findUnique.mockResolvedValue(tanqueMock);
            // $transaction ejecuta la callback con prismaMock
            prismaMock.entregaDistribuidor.create.mockResolvedValue({ id: 'ent-1', ...data });
            prismaMock.transaccionCombustible.create.mockResolvedValue({ id: 'tx-1' });
            prismaMock.tanque.update.mockResolvedValue({ ...tanqueMock, nivelActual: 5000 });

            const result = await service.registrarEntrega(data);
            expect(result.id).toBe('ent-1');
            expect(prismaMock.$transaction).toHaveBeenCalled();
        });

        it('debe lanzar error si el tanque no existe', async () => {
            prismaMock.tanque.findUnique.mockResolvedValue(null);
            await expect(service.registrarEntrega(data))
                .rejects.toThrow('Tanque no encontrado');
        });

        it('debe lanzar error si el tanque no pertenece a la estación', async () => {
            prismaMock.tanque.findUnique.mockResolvedValue({ ...tanqueMock, estacionId: 'otra' });
            await expect(service.registrarEntrega(data))
                .rejects.toThrow('El tanque no pertenece a la estación indicada');
        });

        it('debe lanzar error si el tipo de combustible no coincide', async () => {
            prismaMock.tanque.findUnique.mockResolvedValue({ ...tanqueMock, tipoCombustible: 'GASOLINA_CORRIENTE' });
            await expect(service.registrarEntrega(data))
                .rejects.toThrow('El tanque es de GASOLINA_CORRIENTE');
        });

        it('debe lanzar error si la entrega excede la capacidad', async () => {
            prismaMock.tanque.findUnique.mockResolvedValue({ ...tanqueMock, nivelActual: 9500 });
            await expect(service.registrarEntrega({ ...data, galones: 1000 }))
                .rejects.toThrow('excede la capacidad');
        });
    });

    // ─── TRANSACCIONES (VENTAS) ───

    describe('registrarTransaccion', () => {
        const data = {
            estacionId: 'e1', tanqueId: 't1', tipo: 'SALIDA' as const,
            tipoCombustible: 'ACPM' as const, tipoServicio: 'PARTICULAR' as const,
            galones: 50, precioUnitario: 10200,
            subsidioAplicado: false,
        };

        it('debe registrar una venta exitosamente', async () => {
            prismaMock.tanque.findUnique.mockResolvedValue(tanqueMock);
            prismaMock.$transaction.mockImplementation(async (fn: any) => {
                prismaMock.tanque.update.mockResolvedValue({ ...tanqueMock, nivelActual: 2950 });
                prismaMock.transaccionCombustible.create.mockResolvedValue({ id: 'tx-1' });
                return fn(prismaMock);
            });

            const result = await service.registrarTransaccion(data);
            expect(prismaMock.$transaction).toHaveBeenCalled();
        });

        it('debe lanzar error si no hay suficiente combustible', async () => {
            prismaMock.tanque.findUnique.mockResolvedValue({ ...tanqueMock, nivelActual: 10 });
            await expect(service.registrarTransaccion({ ...data, galones: 100 }))
                .rejects.toThrow('No hay suficiente combustible');
        });

        it('debe lanzar error si el tanque no existe', async () => {
            prismaMock.tanque.findUnique.mockResolvedValue(null);
            await expect(service.registrarTransaccion(data))
                .rejects.toThrow('Tanque no encontrado');
        });
    });
});
