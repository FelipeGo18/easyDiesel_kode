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
            prismaMock.estacionServicio.count.mockResolvedValue(1);
            const result = await service.obtenerEstaciones();
            expect(result.data).toHaveLength(1);
            expect(result.pagination.total).toBe(1);
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
            prismaMock.distribuidor.count.mockResolvedValue(1);
            const result = await service.obtenerDistribuidores();
            expect(result.data).toHaveLength(1);
            expect(result.pagination.total).toBe(1);
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
        it('debe retornar un distribuidor por id', async () => {
            prismaMock.distribuidor.findUnique.mockResolvedValue({ id: 'd1', nombre: 'Dist 1' });
            const result = await service.obtenerDistribuidorPorId('d1');
            expect(result.nombre).toBe('Dist 1');
        });

        it('debe lanzar error si no existe', async () => {
            prismaMock.distribuidor.findUnique.mockResolvedValue(null);
            await expect(service.obtenerDistribuidorPorId('bad'))
                .rejects.toThrow('Distribuidor no encontrado');
        });
    });

    describe('crearEstacion', () => {
        const data = {
            nombre: 'E1', nit: '123', direccion: 'cll 1', ciudad: 'Cali',
            departamento: 'Valle', codigoSicom: 'S123', zonaId: 'z1', usuarioId: 'u1'
        };

        it('debe crear estacion exitosamente', async () => {
            prismaMock.estacionServicio.findUnique.mockResolvedValue(null);
            prismaMock.estacionServicio.create.mockResolvedValue({ id: 'e1', ...data });

            const result = await service.crearEstacion(data);
            expect(result.id).toBe('e1');
        });

        it('debe lanzar error si el NIT ya existe', async () => {
            prismaMock.estacionServicio.findUnique.mockResolvedValueOnce({ id: 'e-old' });
            await expect(service.crearEstacion(data))
                .rejects.toThrow('Ya existe una estación con este NIT');
        });

        it('debe lanzar error si el Código SICOM ya existe', async () => {
            prismaMock.estacionServicio.findUnique
                .mockResolvedValueOnce(null) // nit
                .mockResolvedValueOnce({ id: 'e-old' }); // sicom
            await expect(service.crearEstacion(data))
                .rejects.toThrow('Ya existe una estación con este Código SICOM');
        });

        it('debe lanzar error si el usuario ya tiene estación', async () => {
            prismaMock.estacionServicio.findUnique
                .mockResolvedValueOnce(null) // nit
                .mockResolvedValueOnce(null) // sicom
                .mockResolvedValueOnce({ id: 'e-old' }); // usuario
            await expect(service.crearEstacion(data))
                .rejects.toThrow('Este usuario ya está asignado a otra estación');
        });
    });

    describe('actualizarEstacion', () => {
        const dataUpdate = {
            nombre: 'Nuevo',
            nit: '123',
            codigoSicom: 'S1',
            direccion: 'X',
            ciudad: 'X',
            departamento: 'X',
            zonaId: 'z1',
            usuarioId: 'u1'
        };

        it('debe actualizar estacion exitosamente', async () => {
            const existing = { id: 'e1', nit: '123', codigoSicom: 'S1' };
            prismaMock.estacionServicio.findUnique.mockResolvedValue(existing);
            prismaMock.estacionServicio.update.mockResolvedValue({ ...existing, nombre: 'Nuevo' });

            const result = await service.actualizarEstacion('e1', dataUpdate);
            expect(result.nombre).toBe('Nuevo');
        });

        it('debe lanzar error si la estacion no existe', async () => {
            prismaMock.estacionServicio.findUnique.mockResolvedValue(null);
            await expect(service.actualizarEstacion('bad', dataUpdate)).rejects.toThrow('Estación no encontrada');
        });

        it('debe lanzar error si el nuevo NIT ya existe', async () => {
            const existing = { id: 'e1', nit: '123' };
            prismaMock.estacionServicio.findUnique
                .mockResolvedValueOnce(existing) // const existe
                .mockResolvedValueOnce({ id: 'e2' }); // const existeNit
            await expect(service.actualizarEstacion('e1', { ...dataUpdate, nit: '456' })).rejects.toThrow('NIT ya está registrado');
        });

        it('debe actualizar si el NIT es el mismo', async () => {
            const existing = { id: 'e1', nit: '123', codigoSicom: 'S1' };
            prismaMock.estacionServicio.findUnique.mockResolvedValue(existing);
            prismaMock.estacionServicio.update.mockResolvedValue(existing);
            await service.actualizarEstacion('e1', { ...dataUpdate, nit: '123' });
            // No debería buscar duplicados de NIT
            expect(prismaMock.estacionServicio.findUnique).toHaveBeenCalledTimes(1);
        });

        it('debe lanzar error si el nuevo SICOM ya existe', async () => {
            const existing = { id: 'e1', nit: '123', codigoSicom: 'S1' };
            // Forzamos el comportamiento del mock para que devuelva los valores exactos que esperamos
            prismaMock.estacionServicio.findUnique
                .mockImplementation((params: any) => {
                    if (params.where.id === 'e1') return Promise.resolve(existing as any);
                    if (params.where.nit === '123') return Promise.resolve(null);
                    if (params.where.codigoSicom === 'S2') return Promise.resolve({ id: 'e2', codigoSicom: 'S2' } as any);
                    return Promise.resolve(null);
                });
            
            await expect(service.actualizarEstacion('e1', { ...dataUpdate, codigoSicom: 'S2' }))
                .rejects.toThrow('El nuevo Código SICOM ya está registrado');
        });
    });

    describe('actualizarZonaEstacion', () => {
        it('debe actualizar la zona de una estacion', async () => {
            prismaMock.estacionServicio.findUnique.mockResolvedValue({ id: 'e1' });
            prismaMock.zonaDistribucion.findUnique.mockResolvedValue({ id: 'z2' });
            prismaMock.estacionServicio.update.mockResolvedValue({ id: 'e1', zonaId: 'z2' });

            const result = await service.actualizarZonaEstacion('e1', 'z2');
            expect(result.zonaId).toBe('z2');
        });

        it('debe lanzar error si la zona no existe', async () => {
            prismaMock.estacionServicio.findUnique.mockResolvedValue({ id: 'e1' });
            prismaMock.zonaDistribucion.findUnique.mockResolvedValue(null);
            await expect(service.actualizarZonaEstacion('e1', 'bad'))
                .rejects.toThrow('Zona no encontrada');
        });
    });

    describe('crearDistribuidor', () => {
        const data = { nombre: 'D1', nit: '456', tipo: 'MAYORISTA' as any, direccion: 'X', ciudad: 'Y', departamento: 'Z', usuarioId: 'u2' };
        it('debe crear distribuidor exitosamente', async () => {
            prismaMock.distribuidor.findUnique.mockResolvedValue(null);
            prismaMock.distribuidor.create.mockResolvedValue({ id: 'd1', ...data });

            const result = await service.crearDistribuidor(data);
            expect(result.id).toBe('d1');
        });

        it('debe lanzar error si NIT de distribuidor ya existe', async () => {
            prismaMock.distribuidor.findUnique.mockResolvedValueOnce({ id: 'd-old' });
            await expect(service.crearDistribuidor(data)).rejects.toThrow('Ya existe un distribuidor con este NIT');
        });

        it('debe lanzar error si usuario ya tiene distribuidor', async () => {
            prismaMock.distribuidor.findUnique
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce({ id: 'd-old' });
            await expect(service.crearDistribuidor(data)).rejects.toThrow('Este usuario ya está asignado a otro distribuidor');
        });
    });

    describe('actualizarDistribuidor', () => {
        it('debe actualizar distribuidor exitosamente', async () => {
            const existing = { id: 'd1', nit: '456' };
            prismaMock.distribuidor.findUnique.mockResolvedValue(existing);
            prismaMock.distribuidor.update.mockResolvedValue({ ...existing, nombre: 'Nuevo Dist' });

            const result = await service.actualizarDistribuidor('d1', { nombre: 'Nuevo Dist' });
            expect(result.nombre).toBe('Nuevo Dist');
        });

        it('debe lanzar error si el nuevo NIT de distribuidor ya existe', async () => {
            const existing = { id: 'd1', nit: '456' };
            prismaMock.distribuidor.findUnique
                .mockResolvedValueOnce(existing)
                .mockResolvedValueOnce({ id: 'd2' });
            await expect(service.actualizarDistribuidor('d1', { nit: '789' })).rejects.toThrow('NIT ya está registrado');
        });
    });

    describe('obtenerEstaciones con búsqueda', () => {
        it('debe filtrar estaciones por búsqueda', async () => {
            prismaMock.estacionServicio.findMany.mockResolvedValue([]);
            prismaMock.estacionServicio.count.mockResolvedValue(0);
            
            await service.obtenerEstaciones({ search: 'Test' });
            
            expect(prismaMock.estacionServicio.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        OR: expect.arrayContaining([
                            expect.objectContaining({ nombre: expect.any(Object) })
                        ])
                    })
                })
            );
        });
    });
});
