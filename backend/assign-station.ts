import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const userId = '056190e9-f601-4769-a9b1-d7770c598e2a'; // pacomunos925@gmail.com
    const estacionId = '22bb61e5-bba9-45b1-81a2-b1fcdde43151'; // EDS Terpel Autopista Norte

    const updated = await prisma.estacionServicio.update({
        where: { id: estacionId },
        data: { usuarioId: userId },
        select: { id: true, nombre: true, usuarioId: true },
    });

    console.log('Estación asignada:', updated);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
