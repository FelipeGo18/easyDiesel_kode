import { prismaMock, resetAllMocks } from './__mocks__/prisma.mock';
import { pricingEngineService } from '../../src/services/pricing-engine.service';

describe('PricingEngineService', () => {
    beforeEach(() => {
        resetAllMocks();
    });

    const inputBase = {
        estacionId: 'e1',
        tipoCombustible: 'ACPM' as const,
        tipoServicio: 'PUBLICO' as const,
    };

    const mockEstacion = {
        id: 'e1',
        nombre: 'Estacion 1',
        zonaId: 'z1',
        zona: { id: 'z1', nombre: 'Zona 1', tipoZona: 'INTERCONECTADA' },
    };

    const mockPrecio = {
        id: 'p1',
        zonaId: 'z1',
        precioGalon: 10000,
        tipoCombustible: 'ACPM',
        tipoServicio: 'PUBLICO',
        vigenciaDesde: new Date('2026-01-01'),
        vigenciaHasta: null,
        decreto: { id: 'd1', numero: 'D-001', titulo: 'Decreto 1' },
        zona: { id: 'z1', nombre: 'Zona 1', tipoZona: 'INTERCONECTADA' },
    };

    it('debe resolver precio usando la fecha actual por defecto', async () => {
        prismaMock.estacionServicio.findUnique.mockResolvedValue(mockEstacion as any);
        prismaMock.precioVigente.findFirst.mockResolvedValue(mockPrecio as any);

        const result = await pricingEngineService.resolveCurrentFuelPrice({
            estacionId: 'e1',
            tipoCombustible: 'ACPM',
            tipoServicio: 'PUBLICO'
        });
        expect(result.precioId).toBe('p1');
    });

    it('debe lanzar error si la estacion no existe', async () => {
        prismaMock.estacionServicio.findUnique.mockResolvedValue(null);
        await expect(pricingEngineService.resolveCurrentFuelPrice(inputBase))
            .rejects.toThrow('Estación no encontrada');
    });

    it('debe resolver precio para servicio PUBLICO con subsidio', async () => {
        prismaMock.estacionServicio.findUnique.mockResolvedValue(mockEstacion as any);
        prismaMock.precioVigente.findFirst.mockResolvedValue(mockPrecio as any);

        const result = await pricingEngineService.resolveCurrentFuelPrice(inputBase);
        expect(result.subsidioGalon).toBe(2350);
        expect(result.subsidioAplicado).toBe(true);
        expect(result.precioUnitario).toBe(10000);
    });

    it('debe resolver precio para servicio PARTICULAR sin subsidio', async () => {
        prismaMock.estacionServicio.findUnique.mockResolvedValue(mockEstacion as any);
        prismaMock.precioVigente.findFirst.mockResolvedValue({ ...mockPrecio, tipoServicio: 'PARTICULAR' } as any);

        const result = await pricingEngineService.resolveCurrentFuelPrice({ ...inputBase, tipoServicio: 'PARTICULAR' });
        expect(result.subsidioGalon).toBe(0);
        expect(result.subsidioAplicado).toBe(false);
    });

    it('debe aplicar Decreto 763/2024 para Gran Consumidor de ACPM en zona INTERCONECTADA', async () => {
        prismaMock.estacionServicio.findUnique.mockResolvedValue(mockEstacion as any);
        // Debe buscar precio de PARTICULAR aunque el input sea PUBLICO
        prismaMock.precioVigente.findFirst.mockResolvedValue({ ...mockPrecio, tipoServicio: 'PARTICULAR', id: 'p-part' } as any);

        const result = await pricingEngineService.resolveCurrentFuelPrice({ 
            ...inputBase, 
            esGranConsumidor: true 
        });

        expect(result.granConsumidorAplicado).toBe(true);
        expect(result.decretoAplicado).toBe('763/2024');
        expect(prismaMock.precioVigente.findFirst).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({ tipoServicio: 'PARTICULAR' })
        }));
    });

    it('NO debe aplicar Decreto 763 si es zona NO_INTERCONECTADA', async () => {
        const mockEstacionZNI = { ...mockEstacion, zona: { ...mockEstacion.zona, tipoZona: 'NO_INTERCONECTADA' } };
        prismaMock.estacionServicio.findUnique.mockResolvedValue(mockEstacionZNI as any);
        prismaMock.precioVigente.findFirst.mockResolvedValue(mockPrecio as any);

        const result = await pricingEngineService.resolveCurrentFuelPrice({ 
            ...inputBase, 
            esGranConsumidor: true 
        });

        expect(result.granConsumidorAplicado).toBe(false);
        expect(result.decretoAplicado).toBe('D-001');
        expect(prismaMock.precioVigente.findFirst).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({ tipoServicio: 'PUBLICO' })
        }));
    });

    it('debe lanzar error si no existe precio vigente', async () => {
        prismaMock.estacionServicio.findUnique.mockResolvedValue(mockEstacion as any);
        prismaMock.precioVigente.findFirst.mockResolvedValue(null);

        await expect(pricingEngineService.resolveCurrentFuelPrice(inputBase))
            .rejects.toThrow('No existe un precio vigente');
    });
});
