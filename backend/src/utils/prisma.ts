import path from 'node:path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Singleton de Prisma Client para evitar múltiples instancias en desarrollo
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log:
            process.env.NODE_ENV === 'development'
                ? ['query', 'error', 'warn']
                : ['error'],
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
