import { prismaMock, resetAllMocks } from './__mocks__/prisma.mock';
import { ZonaService } from '../../src/services/zona.service';

describe('ZonaService', () => {
    let service: ZonaService;

    beforeEach(() => {
        resetAllMocks();
        service = new ZonaService();
    });

    describe('obtenerZonas', () => {
        it('debe retornar lista de zonas', async () => {
            const mockZonas = [{ id: '1', nombre: 'Zona A' }];
            prismaMock.zonaDistribucion.findMany.mockResolvedValue(mockZonas);

            const result = await service.obtenerZonas();
            expect(result).toEqual(mockZonas);
        });
    });

    describe('obtenerZonaPorId', () => {
        it('debe retornar una zona por id', async () => {
            const mockZona = { id: '1', nombre: 'Zona A', estaciones: [], precios: [] };
            prismaMock.zonaDistribucion.findUnique.mockResolvedValue(mockZona);

            const result = await service.obtenerZonaPorId('1');
            expect(result).toEqual(mockZona);
        });

        it('debe lanzar error si no existe', async () => {
            prismaMock.zonaDistribucion.findUnique.mockResolvedValue(null);
            await expect(service.obtenerZonaPorId('99'))
                .rejects.toThrow('Zona no encontrada');
        });
    });

    describe('crearZona', () => {
        const data = {
            nombre: 'Z1',
            tipoZona: 'INTERCONECTADA' as const,
            departamentos: ['D1'],
            municipios: ['M1']
        };

        it('debe crear zona exitosamente', async () => {
            prismaMock.zonaDistribucion.findUnique.mockResolvedValue(null);
            prismaMock.zonaDistribucion.create.mockResolvedValue({ id: '1', ...data });

            const result = await service.crearZona(data);
            expect(result.id).toBe('1');
        });

        it('debe lanzar error si el nombre ya existe', async () => {
            prismaMock.zonaDistribucion.findUnique.mockResolvedValue({ id: '1', nombre: 'Z1' });
            await expect(service.crearZona(data))
                .rejects.toThrow('Ya existe una zona con este nombre');
        });
    });

    describe('actualizarZona', () => {
        it('debe actualizar zona exitosamente si el nombre no cambia', async () => {
            const existing = { id: '1', nombre: 'Z1' };
            prismaMock.zonaDistribucion.findUnique.mockResolvedValue(existing);
            prismaMock.zonaDistribucion.update.mockResolvedValue(existing);

            const result = await service.actualizarZona('1', { nombre: 'Z1' });
            expect(result.nombre).toBe('Z1');
            // No debería buscar duplicados si el nombre es el mismo
            expect(prismaMock.zonaDistribucion.findUnique).toHaveBeenCalledTimes(1);
        });

        it('debe actualizar zona exitosamente', async () => {
            const existing = { id: '1', nombre: 'Z1' };
            prismaMock.zonaDistribucion.findUnique
                .mockResolvedValueOnce(existing) // para const existe
                .mockResolvedValueOnce(null);    // para const duplicada (si cambia nombre)
            
            prismaMock.zonaDistribucion.update.mockResolvedValue({ ...existing, nombre: 'Z2' });

            const result = await service.actualizarZona('1', { nombre: 'Z2' });
            expect(result.nombre).toBe('Z2');
        });

        it('debe lanzar error si la zona no existe al actualizar', async () => {
            prismaMock.zonaDistribucion.findUnique.mockResolvedValue(null);
            await expect(service.actualizarZona('bad', { nombre: 'X' }))
                .rejects.toThrow('Zona no encontrada');
        });
    });
});
