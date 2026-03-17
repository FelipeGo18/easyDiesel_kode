import { prismaMock, resetAllMocks } from './__mocks__/prisma.mock';
import { DecretoService } from '../../src/services/decreto.service';

describe('DecretoService', () => {
    let service: DecretoService;

    beforeEach(() => {
        resetAllMocks();
        service = new DecretoService();
    });

    describe('obtenerDecretos', () => {
        it('debe retornar lista de decretos', async () => {
            const mockDecretos = [{ id: '1', numero: '123' }];
            prismaMock.decretoNormativo.findMany.mockResolvedValue(mockDecretos);

            const result = await service.obtenerDecretos();
            expect(result).toEqual(mockDecretos);
            expect(prismaMock.decretoNormativo.findMany).toHaveBeenCalled();
        });
    });

    describe('obtenerDecretoPorId', () => {
        it('debe retornar un decreto por id', async () => {
            const mockDecreto = { id: '1', numero: '123', precios: [] };
            prismaMock.decretoNormativo.findUnique.mockResolvedValue(mockDecreto);

            const result = await service.obtenerDecretoPorId('1');
            expect(result).toEqual(mockDecreto);
        });

        it('debe lanzar error si no existe', async () => {
            prismaMock.decretoNormativo.findUnique.mockResolvedValue(null);
            await expect(service.obtenerDecretoPorId('99'))
                .rejects.toThrow('Decreto no encontrado');
        });
    });

    describe('crearDecreto', () => {
        const data = {
            numero: '763/2024',
            titulo: 'Nuevo Decreto',
            descripcion: 'Desc',
            entidad: 'MinMinas',
            fechaExpedicion: '2024-01-01',
            fechaVigencia: '2024-01-01',
        };

        it('debe crear un decreto exitosamente', async () => {
            prismaMock.decretoNormativo.findUnique.mockResolvedValue(null);
            prismaMock.decretoNormativo.create.mockResolvedValue({ id: '1', ...data });

            const result = await service.crearDecreto(data);
            expect(result.id).toBe('1');
            expect(prismaMock.decretoNormativo.create).toHaveBeenCalled();
        });

        it('debe lanzar error si el numero ya existe', async () => {
            prismaMock.decretoNormativo.findUnique.mockResolvedValue({ id: '1', numero: data.numero });
            await expect(service.crearDecreto(data))
                .rejects.toThrow('Ya existe un decreto con este numero');
        });
    });

    describe('actualizarDecreto', () => {
        it('debe actualizar un decreto exitosamente', async () => {
            const existing = { id: '1', numero: '123' };
            const updateData = { titulo: 'Actualizado' };
            prismaMock.decretoNormativo.findUnique.mockResolvedValue(existing);
            prismaMock.decretoNormativo.update.mockResolvedValue({ ...existing, ...updateData });

            const result = await service.actualizarDecreto('1', updateData);
            expect(result.titulo).toBe('Actualizado');
        });

        it('debe validar duplicidad de numero al actualizar', async () => {
            const existing = { id: '1', numero: '123' };
            const updateData = { numero: '456' };
            prismaMock.decretoNormativo.findUnique
                .mockResolvedValueOnce(existing) // existe el que editamos
                .mockResolvedValueOnce({ id: '2', numero: '456' }); // existe otro con el nuevo numero

            await expect(service.actualizarDecreto('1', updateData))
                .rejects.toThrow('Ya existe un decreto con este numero');
        });

        it('debe lanzar error si el decreto a actualizar no existe', async () => {
            prismaMock.decretoNormativo.findUnique.mockResolvedValue(null);
            await expect(service.actualizarDecreto('99', { titulo: 'X' }))
                .rejects.toThrow('Decreto no encontrado');
        });
    });
});
