import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.usuario.findMany({
        include: {
            rol: { select: { nombre: true } },
            estacionGestionada: { select: { id: true, nombre: true } },
        },
    });
    console.log('=== USUARIOS ===');
    users.forEach((u: any) => {
        console.log(`${u.email} | rol: ${u.rol.nombre} | estacion: ${u.estacionGestionada?.nombre ?? 'SIN ESTACION'} | id: ${u.id}`);
    });

    const estaciones = await prisma.estacionServicio.findMany({
        select: { id: true, nombre: true, usuarioId: true },
    });
    console.log('\n=== ESTACIONES ===');
    estaciones.forEach((e: any) => {
        console.log(`${e.nombre} | id: ${e.id} | usuarioId: ${e.usuarioId ?? 'sin usuario'}`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
