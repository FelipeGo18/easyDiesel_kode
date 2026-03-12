import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const tanques = await prisma.tanque.findMany({
        select: { id: true, nombre: true, estacionId: true, nivelActual: true, tipoCombustible: true },
    });
    console.log('=== TANQUES ===');
    tanques.forEach((t: any) => {
        console.log(`${t.nombre} | id: ${t.id} | estacionId: ${t.estacionId} | nivel: ${t.nivelActual} | tipo: ${t.tipoCombustible}`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
