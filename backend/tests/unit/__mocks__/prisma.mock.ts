/**
 * Mock global de Prisma Client para pruebas unitarias.
 * Cada modelo expone sus métodos CRUD como jest.fn().
 */

export const prismaMock: any = {
    usuario: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
    },
    rol: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn(),
    },
    estacionServicio: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
    },
    distribuidor: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
    },
    tanque: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
    },
    transaccionCombustible: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        count: jest.fn(),
    },
    entregaDistribuidor: {
        findMany: jest.fn(),
        create: jest.fn(),
        count: jest.fn(),
    },
    zonaDistribucion: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        upsert: jest.fn(),
    },
    precioVigente: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
    },
    decretoNormativo: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        upsert: jest.fn(),
    },
    auditoriaLog: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        count: jest.fn(),
    },
    reporte: {
        findMany: jest.fn(),
        create: jest.fn(),
        count: jest.fn(),
    },
    $transaction: jest.fn((fn: any) => fn(prismaMock)),
    $queryRaw: jest.fn().mockResolvedValue([]),
};

// Mock del módulo utils/prisma
jest.mock('../../../src/utils/prisma', () => ({
    prisma: prismaMock,
}));

export function resetAllMocks() {
    Object.values(prismaMock).forEach((model: any) => {
        if (typeof model === 'object' && model !== null) {
            Object.values(model).forEach((fn: any) => {
                if (typeof fn?.mockReset === 'function') fn.mockReset();
            });
        } else if (typeof model?.mockReset === 'function') {
            model.mockReset();
        }
    });
    prismaMock.$transaction.mockImplementation((fn: any) => fn(prismaMock));
    prismaMock.$queryRaw.mockResolvedValue([]);
}
