import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
    console.log('🌱 Iniciando seed de datos...\n');

    // ──────────────────────────────────────────
    // 1. ROLES
    // ──────────────────────────────────────────
    const roles = [
        { 
            nombre: 'admin', 
            descripcion: 'Administrador de plataforma — acceso completo',
            permisos: ['all']
        },
        { 
            nombre: 'estacion', 
            descripcion: 'Estación de servicio — inventario, transacciones, reportes propios',
            permisos: ['inventario:leer', 'inventario:escribir', 'transacciones:leer', 'transacciones:escribir', 'reportes:generar']
        },
        { 
            nombre: 'distribuidor', 
            descripcion: 'Distribuidor mayorista — registro de entregas, reportes',
            permisos: ['entregas:leer', 'entregas:escribir', 'reportes:generar']
        },
        { 
            nombre: 'regulador', 
            descripcion: 'Autoridad reguladora — solo lectura: normativa, reportes, dashboard',
            permisos: ['normativa:leer', 'reportes:leer', 'dashboard:leer']
        },
        { 
            nombre: 'auditor', 
            descripcion: 'Auditor — solo lectura: logs de auditoría',
            permisos: ['auditoria:leer', 'reportes:leer']
        },
        { 
            nombre: 'particular', 
            descripcion: 'Ciudadano — consulta precios, planifica viajes',
            permisos: ['precios:leer']
        },
        { 
            nombre: 'distribuidor_regulado', 
            descripcion: 'Distribuidor regulado — inventario y normativa',
            permisos: ['inventario:leer', 'normativa:leer', 'reportes:generar']
        },
    ];

    for (const rol of roles) {
        await prisma.rol.upsert({
            where: { nombre: rol.nombre },
            update: { 
                descripcion: rol.descripcion,
                permisos: rol.permisos
            },
            create: rol,
        });
    }
    console.log(`  ✅ ${roles.length} roles creados/actualizados`);

    // ──────────────────────────────────────────
    // 2. DECRETOS NORMATIVOS
    // ──────────────────────────────────────────
    const decretos = [
        {
            numero: '1428/2025',
            titulo: 'Mecanismo diferencial de estabilización de precios ACPM',
            descripcion: 'Precio diferencial ACPM: particulares sin subsidio, público y carga con subsidio FEPC.',
            entidad: 'Ministerio de Hacienda y Crédito Público',
            fechaExpedicion: new Date('2025-12-24'),
            fechaVigencia: new Date('2025-12-26'),
            activo: true,
        },
        {
            numero: '763/2024',
            titulo: 'Regulación de precios para Grandes Consumidores',
            descripcion: 'Aplica a consumidores de >20.000 galones ACPM/mes. Precio ajustado a paridad internacional.',
            entidad: 'Ministerio de Minas y Energía',
            fechaExpedicion: new Date('2024-06-18'),
            fechaVigencia: new Date('2024-06-18'),
            activo: true,
        },
        {
            numero: '318/2003',
            titulo: 'Regulación de distribución y control de combustibles líquidos',
            descripcion: 'Zonificación para precios diferenciales por región. Define zonas de distribución.',
            entidad: 'Ministerio de Minas y Energía',
            fechaExpedicion: new Date('2003-01-01'),
            fechaVigencia: new Date('2003-01-01'),
            activo: true,
        },
    ];

    for (const decreto of decretos) {
        await prisma.decretoNormativo.upsert({
            where: { numero: decreto.numero },
            update: {
                titulo: decreto.titulo,
                descripcion: decreto.descripcion,
                entidad: decreto.entidad,
            },
            create: decreto,
        });
    }
    console.log(`  ✅ ${decretos.length} decretos normativos creados/actualizados`);

    // ──────────────────────────────────────────
    // 3. USUARIO ADMIN POR DEFECTO
    // ──────────────────────────────────────────
    const adminRol = await prisma.rol.findUnique({ where: { nombre: 'admin' } });
    if (!adminRol) throw new Error('Rol admin no encontrado');

    const adminEmail = 'admin@easydiesel.co';
    const adminPassword = await bcrypt.hash('Admin2026!', 12);

    await prisma.usuario.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            passwordHash: adminPassword,
            nombre: 'Administrador EasyDiesel',
            rolId: adminRol.id,
            activo: true,
        },
    });
    console.log(`  ✅ Usuario admin creado (${adminEmail})`);

    // ──────────────────────────────────────────
    // 4. ZONAS DE DISTRIBUCIÓN BASE
    // ──────────────────────────────────────────
    const zonas = [
        {
            nombre: 'Zona Centro',
            tipoZona: 'INTERCONECTADA' as const,
            departamentos: ['Cundinamarca', 'Boyacá', 'Meta', 'Tolima', 'Huila'],
            descripcion: 'Zona central interconectada — incluye Bogotá y alrededores',
        },
        {
            nombre: 'Zona Caribe',
            tipoZona: 'INTERCONECTADA' as const,
            departamentos: ['Atlántico', 'Bolívar', 'Magdalena', 'Cesar', 'La Guajira', 'Sucre', 'Córdoba'],
            descripcion: 'Zona caribe interconectada',
        },
        {
            nombre: 'Zona Pacífico',
            tipoZona: 'INTERCONECTADA' as const,
            departamentos: ['Valle del Cauca', 'Cauca', 'Nariño', 'Chocó'],
            descripcion: 'Zona pacífica interconectada',
        },
        {
            nombre: 'Zona Orinoquia-Amazonia',
            tipoZona: 'NO_INTERCONECTADA' as const,
            departamentos: ['Amazonas', 'Guainía', 'Guaviare', 'Vaupés', 'Vichada', 'Putumayo', 'Caquetá'],
            descripcion: 'Zona no interconectada — precios diferenciales por aislamiento geográfico',
        },
    ];

    for (const zona of zonas) {
        await prisma.zonaDistribucion.upsert({
            where: { nombre: zona.nombre },
            update: {
                tipoZona: zona.tipoZona,
                departamentos: zona.departamentos,
                descripcion: zona.descripcion,
            },
            create: zona,
        });
    }
    console.log(`  ✅ ${zonas.length} zonas de distribución creadas/actualizadas`);

    console.log('\n🎉 Seed completado exitosamente');
}

seed()
    .catch((e) => {
        console.error('❌ Error en seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
