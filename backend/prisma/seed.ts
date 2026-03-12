/**
 * Seed — easyDiesel DB
 * Run: cd backend && pnpm prisma:seed
 *
 * - Upserts all 7 application roles with their default permissions
 * - Creates the initial admin user (idempotent)
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ── Role definitions (mirrors backend/src/utils/permissions.ts) ──────────────

const ALL_PERMISSIONS = [
    'usuarios:leer', 'usuarios:escribir',
    'actores:leer', 'actores:escribir',
    'tanques:leer', 'tanques:escribir',
    'inventario:leer', 'inventario:escribir',
    'zonas:leer', 'zonas:escribir',
    'precios:leer', 'precios:escribir',
    'decretos:leer', 'decretos:escribir',
    'auditoria:leer',
    'reportes:leer', 'reportes:generar',
    'dashboard:leer',
];

const ROLES: Array<{ nombre: string; descripcion: string; permisos: string[] }> = [
    {
        nombre: 'admin',
        descripcion: 'Administrador del sistema. Acceso total a todos los módulos.',
        permisos: ALL_PERMISSIONS,
    },
    {
        nombre: 'estacion',
        descripcion: 'Operador de estación de servicio. Gestiona inventario, tanques y despachos.',
        permisos: [
            'tanques:leer', 'inventario:leer', 'inventario:escribir',
            'precios:leer', 'decretos:leer',
            'auditoria:leer', 'reportes:leer', 'reportes:generar', 'dashboard:leer',
        ],
    },
    {
        nombre: 'distribuidor',
        descripcion: 'Distribuidor mayorista. Registra entregas y consulta inventario de estaciones.',
        permisos: [
            'actores:leer', 'inventario:leer', 'inventario:escribir',
            'precios:leer', 'decretos:leer',
            'auditoria:leer', 'reportes:leer', 'reportes:generar', 'dashboard:leer',
        ],
    },
    {
        nombre: 'distribuidor_regulado',
        descripcion: 'Distribuidor sujeto a precio de paridad (Decreto 763/2024, >20.000 gal/mes).',
        permisos: [
            'inventario:leer', 'inventario:escribir',
            'precios:leer', 'decretos:leer',
            'auditoria:leer', 'reportes:leer', 'reportes:generar', 'dashboard:leer',
        ],
    },
    {
        nombre: 'regulador',
        descripcion: 'Autoridad reguladora. Consulta precios, zonas, decretos y genera reportes.',
        permisos: [
            'precios:leer', 'zonas:leer', 'decretos:leer',
            'reportes:leer', 'auditoria:leer', 'dashboard:leer',
        ],
    },
    {
        nombre: 'auditor',
        descripcion: 'Auditor interno. Ve trazabilidad de operaciones y exporta reportes.',
        permisos: ['auditoria:leer', 'reportes:leer', 'dashboard:leer'],
    },
    {
        nombre: 'particular',
        descripcion: 'Usuario particular. Consulta precios vigentes por zona y tipo de combustible.',
        permisos: ['precios:leer', 'dashboard:leer'],
    },
];

// ── Admin user ────────────────────────────────────────────────────────────────

const ADMIN_EMAIL    = 'admin@easydiesel.co';
const ADMIN_PASSWORD = 'EasyDiesel2026!';
const ADMIN_NOMBRE   = 'Administrador easyDiesel';

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
    console.log('🌱  Starting seed...\n');

    // 1. Upsert roles
    for (const role of ROLES) {
        await prisma.rol.upsert({
            where:  { nombre: role.nombre },
            update: { descripcion: role.descripcion, permisos: role.permisos },
            create: { nombre: role.nombre, descripcion: role.descripcion, permisos: role.permisos },
        });
        console.log(`  ✔  rol: ${role.nombre}`);
    }

    // 2. Resolve admin role id
    const adminRol = await prisma.rol.findUniqueOrThrow({ where: { nombre: 'admin' } });

    // 3. Upsert admin user (idempotent by email)
    const existingAdmin = await prisma.usuario.findUnique({ where: { email: ADMIN_EMAIL } });

    if (existingAdmin) {
        // Keep existing user, just ensure role is admin
        await prisma.usuario.update({
            where: { email: ADMIN_EMAIL },
            data:  { rolId: adminRol.id, activo: true },
        });
        console.log(`\n  ✔  admin user already exists — role ensured: ${ADMIN_EMAIL}`);
    } else {
        const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
        await prisma.usuario.create({
            data: {
                email:        ADMIN_EMAIL,
                nombre:       ADMIN_NOMBRE,
                passwordHash,
                rolId:        adminRol.id,
                activo:       true,
                authProvider: 'LOCAL',
            },
        });
        console.log(`\n  ✔  admin user created: ${ADMIN_EMAIL}`);
    }

    console.log('\n✅  Seed completed.\n');
}

main()
    .catch((e) => {
        console.error('❌  Seed failed:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
