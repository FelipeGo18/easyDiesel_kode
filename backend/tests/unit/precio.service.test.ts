import { prismaMock, resetAllMocks } from './__mocks__/prisma.mock';
import { PrecioService } from '../../src/services/precio.service';

describe('PrecioService', () => {
    let service: PrecioService;

    beforeEach(() => {
        resetAllMocks();
        service = new PrecioService();
    });

    describe('obtenerPrecios', () => {
        it('debe retornar precios activos por defecto', async () => {
            prismaMock.precioVigente.findMany.mockResolvedValue([
                { id: 'p1', tipoCombustible: 'ACPM', activo: true },
            ]);

            const result = await service.obtenerPrecios();
            expect(result).toHaveLength(1);
            expect(prismaMock.precioVigente.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: expect.objectContaining({ activo: true }) })
            );
        });

        it('debe filtrar por zona y tipo de combustible', async () => {
            prismaMock.precioVigente.findMany.mockResolvedValue([]);
            await service.obtenerPrecios({ zonaId: 'z1', tipoCombustible: 'ACPM' });

            expect(prismaMock.precioVigente.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ zonaId: 'z1', tipoCombustible: 'ACPM' })
                })
            );
        });
    });

    describe('obtenerPrecioPorId', () => {
        it('debe retornar un precio', async () => {
            prismaMock.precioVigente.findUnique.mockResolvedValue({ id: 'p1', precioGalon: 10200 });
            const result = await service.obtenerPrecioPorId('p1');
            expect(result.precioGalon).toBe(10200);
        });

        it('debe lanzar error si no existe', async () => {
            prismaMock.precioVigente.findUnique.mockResolvedValue(null);
            await expect(service.obtenerPrecioPorId('bad'))
                .rejects.toThrow('Precio no encontrado');
        });
    });

    describe('crearPrecio', () => {
        const data = {
            tipoCombustible: 'ACPM' as any,
            tipoServicio: 'PARTICULAR' as any,
            zonaId: 'z1',
            precioGalon: 10500,
            subsidioGalon: 0,
            decretoId: 'd1',
            vigenciaDesde: new Date().toISOString(),
        };

        it('debe crear precio y desactivar el anterior', async () => {
            prismaMock.zonaDistribucion.findUnique.mockResolvedValue({ id: 'z1' });
            prismaMock.decretoNormativo.findUnique.mockResolvedValue({ id: 'd1' });
            prismaMock.precioVigente.updateMany.mockResolvedValue({ count: 1 });
            prismaMock.precioVigente.create.mockResolvedValue({ id: 'p-new', ...data });

            const result = await service.crearPrecio(data);
            expect(result.id).toBe('p-new');
            expect(prismaMock.$transaction).toHaveBeenCalled();
        });

        it('debe lanzar error si la zona no existe', async () => {
            prismaMock.zonaDistribucion.findUnique.mockResolvedValue(null);
            await expect(service.crearPrecio(data))
                .rejects.toThrow('Zona no encontrada');
        });

        it('debe lanzar error si el decreto no existe', async () => {
            prismaMock.zonaDistribucion.findUnique.mockResolvedValue({ id: 'z1' });
            prismaMock.decretoNormativo.findUnique.mockResolvedValue(null);
            await expect(service.crearPrecio(data))
                .rejects.toThrow('Decreto no encontrado');
        });
    });

    describe('consultarPrecioActual', () => {
        it('debe retornar el precio vigente', async () => {
            prismaMock.precioVigente.findFirst.mockResolvedValue({
                id: 'p1', precioGalon: 10200, activo: true,
            });

            const result = await service.consultarPrecioActual('ACPM', 'PARTICULAR', 'z1');
            expect(result.precioGalon).toBe(10200);
        });

        it('debe lanzar error si no hay precio vigente', async () => {
            prismaMock.precioVigente.findFirst.mockResolvedValue(null);
            await expect(service.consultarPrecioActual('ACPM', 'PARTICULAR', 'z1'))
                .rejects.toThrow('No hay precio vigente');
        });
    });
});
