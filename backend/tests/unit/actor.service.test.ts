import { prismaMock, resetAllMocks } from './__mocks__/prisma.mock';
import { ActorService } from '../../src/services/actor.service';

describe('ActorService', () => {
    let service: ActorService;

    beforeEach(() => {
        resetAllMocks();
        service = new ActorService();
    });

    // ─── ESTACIONES ───

    describe('obtenerEstaciones', () => {
        it('debe retornar lista de estaciones', async () => {
            prismaMock.estacionServicio.findMany.mockResolvedValue([{ id: '1', nombre: 'E1' }]);
            const result = await service.obtenerEstaciones();
            expect(result).toHaveLength(1);
        });
    });

    describe('obtenerEstacionPorId', () => {
        it('debe retornar una estación', async () => {
            prismaMock.estacionServicio.findUnique.mockResolvedValue({ id: '1', nombre: 'E1' });
            const result = await service.obtenerEstacionPorId('1');
            expect(result.nombre).toBe('E1');
        });

        it('debe lanzar error si no existe', async () => {
            prismaMock.estacionServicio.findUnique.mockResolvedValue(null);
            await expect(service.obtenerEstacionPorId('bad'))
                .rejects.toThrow('Estación no encontrada');
        });
    });

    describe('crearEstacion', () => {
        const data = {
            nombre: 'Estación Test', nit: '999-1', direccion: 'C1', ciudad: 'Bogotá',
            departamento: 'Cundinamarca', codigoSicom: 'S1', zonaId: 'z1',
            usuarioId: 'u1',
        };

        it('debe crear una estación', async () => {
            prismaMock.estacionServicio.findUnique.mockResolvedValue(null); // NIT check
            prismaMock.estacionServicio.create.mockResolvedValue({ id: 'new', ...data });

            const result = await service.crearEstacion(data);
            expect(result.nombre).toBe(data.nombre);
        });

        it('debe lanzar error si NIT ya existe', async () => {
            prismaMock.estacionServicio.findUnique.mockResolvedValueOnce({ id: 'dup' }); // NIT check

            await expect(service.crearEstacion(data))
                .rejects.toThrow('Ya existe una estación con este NIT');
        });

        it('debe lanzar error si SICOM ya existe', async () => {
            prismaMock.estacionServicio.findUnique
                .mockResolvedValueOnce(null) // NIT ok
                .mockResolvedValueOnce({ id: 'dup' }); // SICOM check

            await expect(service.crearEstacion(data))
                .rejects.toThrow('Ya existe una estación con este Código SICOM');
        });
    });

    // ─── DISTRIBUIDORES ───

    describe('obtenerDistribuidores', () => {
        it('debe retornar lista de distribuidores', async () => {
            prismaMock.distribuidor.findMany.mockResolvedValue([{ id: '1' }]);
            const result = await service.obtenerDistribuidores();
            expect(result).toHaveLength(1);
        });
    });

    describe('crearDistribuidor', () => {
        const data = {
            nombre: 'Dist1', nit: '111-2', tipo: 'MAYORISTA' as const,
            direccion: 'C2', ciudad: 'Medellín', departamento: 'Antioquia',
            usuarioId: 'u2',
        };

        it('debe crear un distribuidor', async () => {
            prismaMock.distribuidor.findUnique.mockResolvedValue(null);
            prismaMock.distribuidor.create.mockResolvedValue({ id: 'd1', ...data });

            const result = await service.crearDistribuidor(data);
            expect(result.nombre).toBe(data.nombre);
        });

        it('debe lanzar error si NIT ya existe', async () => {
            prismaMock.distribuidor.findUnique.mockResolvedValue({ id: 'dup' });
            await expect(service.crearDistribuidor(data))
                .rejects.toThrow('Ya existe un distribuidor con este NIT');
        });
    });

    describe('obtenerDistribuidorPorId', () => {
        it('debe lanzar error si no existe', async () => {
            prismaMock.distribuidor.findUnique.mockResolvedValue(null);
            await expect(service.obtenerDistribuidorPorId('bad'))
                .rejects.toThrow('Distribuidor no encontrado');
        });
    });
});
