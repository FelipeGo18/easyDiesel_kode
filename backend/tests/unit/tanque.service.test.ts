import { prismaMock, resetAllMocks } from './__mocks__/prisma.mock';
import { TanqueService } from '../../src/services/tanque.service';

describe('TanqueService', () => {
    let service: TanqueService;

    beforeEach(() => {
        resetAllMocks();
        service = new TanqueService();
    });

    describe('obtenerTanques', () => {
        it('debe retornar todos los tanques', async () => {
            prismaMock.tanque.findMany.mockResolvedValue([{ id: 't1' }, { id: 't2' }]);
            const result = await service.obtenerTanques();
            expect(result).toHaveLength(2);
        });

        it('debe filtrar por estacionId', async () => {
            prismaMock.tanque.findMany.mockResolvedValue([{ id: 't1' }]);
            await service.obtenerTanques('e1');
            expect(prismaMock.tanque.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: { estacionId: 'e1' } })
            );
        });
    });

    describe('obtenerTanquePorId', () => {
        it('debe retornar un tanque', async () => {
            prismaMock.tanque.findUnique.mockResolvedValue({ id: 't1', nombre: 'Tank 1' });
            const result = await service.obtenerTanquePorId('t1');
            expect(result.nombre).toBe('Tank 1');
        });

        it('debe lanzar error si no existe', async () => {
            prismaMock.tanque.findUnique.mockResolvedValue(null);
            await expect(service.obtenerTanquePorId('bad'))
                .rejects.toThrow('Tanque no encontrado');
        });
    });

    describe('crearTanque', () => {
        const data = {
            nombre: 'Tanque ACPM 1', capacidadGalones: 10000,
            nivelMinimo: 500, tipoCombustible: 'ACPM' as any, estacionId: 'e1',
        };

        it('debe crear tanque con nivelActual = 0', async () => {
            prismaMock.estacionServicio.findUnique.mockResolvedValue({ id: 'e1' });
            prismaMock.tanque.create.mockResolvedValue({ id: 't-new', ...data, nivelActual: 0 });

            const result = await service.crearTanque(data);
            expect(result.nivelActual).toBe(0);
            expect(prismaMock.tanque.create).toHaveBeenCalledWith(
                expect.objectContaining({ data: expect.objectContaining({ nivelActual: 0 }) })
            );
        });

        it('debe lanzar error si la estación no existe', async () => {
            prismaMock.estacionServicio.findUnique.mockResolvedValue(null);
            await expect(service.crearTanque(data))
                .rejects.toThrow('La estación seleccionada no existe');
        });
    });

    describe('actualizarTanque', () => {
        it('debe actualizar un tanque existente', async () => {
            prismaMock.tanque.findUnique.mockResolvedValue({ id: 't1' });
            prismaMock.tanque.update.mockResolvedValue({ id: 't1', nombre: 'Updated' });

            const result = await service.actualizarTanque('t1', { nombre: 'Updated' });
            expect(result.nombre).toBe('Updated');
        });

        it('debe lanzar error si no existe', async () => {
            prismaMock.tanque.findUnique.mockResolvedValue(null);
            await expect(service.actualizarTanque('bad', {}))
                .rejects.toThrow('Tanque no encontrado');
        });
    });
});
