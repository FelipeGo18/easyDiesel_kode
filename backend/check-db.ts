import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    const zones = await prisma.zonaDistribucion.count();
    const stations = await prisma.estacionServicio.count();
    const prices = await prisma.precioVigente.count();
    
    console.log({
        zones,
        stations,
        prices
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
