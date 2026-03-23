import { prismaMock, resetAllMocks } from './__mocks__/prisma.mock';
import { InventarioService } from '../../src/services/inventario.service';
import { pricingEngineService } from '../../src/services/pricing-engine.service';

jest.mock('../../src/services/pricing-engine.service', () => ({
    pricingEngineService: {
        resolveCurrentFuelPrice: jest.fn()
    }
}));

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
            (pricingEngineService.resolveCurrentFuelPrice as jest.Mock).mockResolvedValue({
                precioUnitario: 10200,
                decretoAplicado: 'D-001',
                subsidioAplicado: false
            });

            prismaMock.$transaction.mockImplementation(async (fn: any) => {
                prismaMock.tanque.update.mockResolvedValue({ ...tanqueMock, nivelActual: 2950 });
                prismaMock.transaccionCombustible.create.mockResolvedValue({ id: 'tx-1' });
                return fn(prismaMock);
            });

            const result = await service.registrarTransaccion(data);
            expect(prismaMock.$transaction).toHaveBeenCalled();
            expect(pricingEngineService.resolveCurrentFuelPrice).toHaveBeenCalled();
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

        it('debe lanzar error si la estacion del tanque no coincide', async () => {
            prismaMock.tanque.findUnique.mockResolvedValue({ ...tanqueMock, estacionId: 'otra' });
            await expect(service.registrarTransaccion(data))
                .rejects.toThrow('El tanque no pertenece a la estación indicada');
        });
    });

    // ─── CIERRE DE TURNO ───

    describe('cierreTurno', () => {
        const data = {
            estacionId: 'e1', tanqueId: 't1', nivelFisico: 3500, observaciones: 'Ajuste'
        };

        it('debe realizar cierre de turno con ajuste positivo', async () => {
            prismaMock.tanque.findUnique.mockResolvedValue(tanqueMock);
            prismaMock.$transaction.mockImplementation(async (fn: any) => {
                prismaMock.tanque.update.mockResolvedValue({ ...tanqueMock, nivelActual: 3500 });
                prismaMock.transaccionCombustible.create.mockResolvedValue({ id: 'adj-1' });
                return fn(prismaMock);
            });

            const result = await service.cierreTurno(data, { usuarioId: 'u1' });
            expect(result.ajusteRealizado).toBe(true);
            expect(result.diferencia).toBe(500);
        });

        it('debe lanzar error si el tanque no existe', async () => {
            prismaMock.tanque.findUnique.mockResolvedValue(null);
            await expect(service.cierreTurno(data)).rejects.toThrow('Tanque no encontrado');
        });
    });

    // ─── CONFIRMAR ENTREGA ───

    describe('confirmarEntrega', () => {
        const data = {
            entregaId: 'ent-1', estacionId: 'e1', tanqueId: 't1', galonesRecibidos: 2000
        };
        const mockEntrega = {
            id: 'ent-1', estacionId: 'e1', confirmada: false, tipoCombustible: 'ACPM',
            galones: 2000, precioUnitario: 9500, distribuidorId: 'd1'
        };

        it('debe confirmar entrega exitosamente', async () => {
            prismaMock.entregaDistribuidor.findUnique.mockResolvedValue(mockEntrega as any);
            prismaMock.tanque.findUnique.mockResolvedValue(tanqueMock);
            prismaMock.$transaction.mockImplementation(async (fn: any) => {
                prismaMock.entregaDistribuidor.update.mockResolvedValue({ ...mockEntrega, confirmada: true });
                prismaMock.transaccionCombustible.create.mockResolvedValue({ id: 'tx-1' });
                prismaMock.tanque.update.mockResolvedValue({ ...tanqueMock, nivelActual: 5000 });
                return fn(prismaMock);
            });

            const result = await service.confirmarEntrega(data);
            expect(result.entrega.confirmada).toBe(true);
        });

        it('debe lanzar error si ya fue confirmada', async () => {
            prismaMock.entregaDistribuidor.findUnique.mockResolvedValue({ ...mockEntrega, confirmada: true } as any);
            await expect(service.confirmarEntrega(data)).rejects.toThrow('ya fue confirmada');
        });
    });

    // ─── LISTAR ───

    describe('listarEntregas', () => {
        it('debe listar entregas pendientes', async () => {
            prismaMock.entregaDistribuidor.findMany.mockResolvedValue([]);
            prismaMock.entregaDistribuidor.count.mockResolvedValue(0);
            const result = await service.listarEntregasPendientes('e1');
            expect(result.data).toBeDefined();
        });

        it('debe listar entregas por distribuidor', async () => {
            prismaMock.entregaDistribuidor.findMany.mockResolvedValue([]);
            prismaMock.entregaDistribuidor.count.mockResolvedValue(0);
            const result = await service.listarEntregasPorDistribuidor('d1');
            expect(result.data).toBeDefined();
        });
    });

    // ─── ENTRADA DIRECTA ───

    describe('registrarEntradaDirecta', () => {
        const data = {
            estacionId: 'e1', tanqueId: 't1', tipoCombustible: 'ACPM' as const,
            galones: 500, precioUnitario: 9000, observaciones: 'Directa'
        };

        it('debe registrar entrada directa exitosamente', async () => {
            prismaMock.tanque.findUnique.mockResolvedValue(tanqueMock);
            prismaMock.$transaction.mockImplementation(async (fn: any) => {
                prismaMock.tanque.update.mockResolvedValue({ ...tanqueMock, nivelActual: 3500 });
                prismaMock.transaccionCombustible.create.mockResolvedValue({ id: 'tx-dir' });
                return fn(prismaMock);
            });

            const result = await service.registrarEntradaDirecta(data, { usuarioId: 'u1' });
            expect(result.nivelNuevo).toBe(3500);
        });

        it('debe lanzar error si excede capacidad', async () => {
            prismaMock.tanque.findUnique.mockResolvedValue({ ...tanqueMock, nivelActual: 9800 });
            await expect(service.registrarEntradaDirecta(data)).rejects.toThrow('supera la capacidad');
        });
    });

    // ─── LISTAR TRANSACCIONES ───

    describe('listarTransacciones', () => {
        it('debe listar por estacionId', async () => {
            prismaMock.transaccionCombustible.findMany.mockResolvedValue([]);
            prismaMock.transaccionCombustible.count.mockResolvedValue(0);
            const result = await service.listarTransacciones({ estacionId: 'e1' });
            expect(result.data).toEqual([]);
        });

        it('debe lanzar error si no hay filtros', async () => {
            await expect(service.listarTransacciones({})).rejects.toThrow('Se requiere al menos');
        });
    });

    // ─── CANCELAR ENTREGA ───

    describe('cancelarEntrega', () => {
        it('debe cancelar exitosamente', async () => {
            const mockEnt = { id: 'ent-1', confirmada: false, distribuidorId: 'd1' };
            prismaMock.entregaDistribuidor.findUnique.mockResolvedValue(mockEnt as any);
            prismaMock.$transaction.mockImplementation(async (fn: any) => {
                prismaMock.entregaDistribuidor.delete.mockResolvedValue(mockEnt);
                return fn(prismaMock);
            });

            await service.cancelarEntrega('ent-1', { distribuidorId: 'd1', usuarioId: 'u1' });
            expect(prismaMock.entregaDistribuidor.delete).toHaveBeenCalled();
        });

        it('debe lanzar error si ya esta confirmada', async () => {
            prismaMock.entregaDistribuidor.findUnique.mockResolvedValue({ id: 'e1', confirmada: true } as any);
            await expect(service.cancelarEntrega('e1')).rejects.toThrow('No se puede cancelar');
        });

        it('debe lanzar error si el distribuidor no coincide', async () => {
            prismaMock.entregaDistribuidor.findUnique.mockResolvedValue({ id: 'e1', confirmada: false, distribuidorId: 'd1' } as any);
            await expect(service.cancelarEntrega('e1', { distribuidorId: 'otro' })).rejects.toThrow('No tienes permiso');
        });
    });
});
