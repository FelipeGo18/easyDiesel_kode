/**
 * Helper compartido para las pruebas de integración CPI.
 * Encapsula el ciclo completo de setup / reset / teardown de datos de prueba.
 * Referencia: Pruebas_Integracion_EasyDiesel.md
 */

import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/utils/prisma';
import bcrypt from 'bcryptjs';

export interface CpiContext {
    suffix: string;
    adminToken: string;
    noPermsToken: string;
    roleId: string;
    noPermsRoleId: string;
    userId: string;
    noPermsUserId: string;
    zonaId: string;
    decretoId: string;
    precioId: string;
    estacionId: string;
    tanqueId: string;
}

/**
 * Crea todos los datos de prueba necesarios para los CPIs y devuelve el contexto.
 * @param suffix  Discriminador único por archivo de prueba (ej. Date.now().toString())
 */
export async function buildCpiContext(suffix: string): Promise<CpiContext> {
    const hash = await bcrypt.hash('CpiTestPass123!', 10);

    const role = await prisma.rol.create({
        data: {
            nombre: `cpi_admin_${suffix}`,
            permisos: [
                'inventario:leer', 'inventario:escribir',
                'auditoria:leer',
                'reportes:generar',
                'actores:leer', 'actores:escribir',
                'usuarios:leer', 'usuarios:escribir',
                'precios:leer', 'precios:escribir',
                'zonas:leer', 'zonas:escribir',
                'decretos:leer', 'decretos:escribir',
                'tanques:leer', 'tanques:escribir',
                'dashboard:leer',
            ],
        },
    });

    const noPermsRole = await prisma.rol.create({
        data: { nombre: `cpi_noperms_${suffix}`, permisos: [] },
    });

    const user = await prisma.usuario.create({
        data: {
            email: `cpi-admin-${suffix}@test.com`,
            nombre: 'CPI Admin Test',
            passwordHash: hash,
            rolId: role.id,
        },
    });

    const noPermsUser = await prisma.usuario.create({
        data: {
            email: `cpi-noperms-${suffix}@test.com`,
            nombre: 'CPI NoPerms Test',
            passwordHash: hash,
            rolId: noPermsRole.id,
        },
    });

    const zona = await prisma.zonaDistribucion.create({
        data: {
            nombre: `Zona CPI ${suffix}`,
            tipoZona: 'INTERCONECTADA',
            departamentos: ['Cundinamarca'],
            municipios: ['Bogota'],
        },
    });

    const decreto = await prisma.decretoNormativo.create({
        data: {
            numero: `DEC-CPI-${suffix}`,
            titulo: 'Decreto CPI Test — Decreto 1428',
            fechaExpedicion: new Date(),
            fechaVigencia: new Date(),
        },
    });

    const precio = await prisma.precioVigente.create({
        data: {
            tipoCombustible: 'ACPM',
            tipoServicio: 'PARTICULAR',
            zonaId: zona.id,
            precioGalon: 9500,
            subsidioGalon: 0,
            decretoId: decreto.id,
            vigenciaDesde: new Date(),
            activo: true,
        },
    });

    const estacion = await prisma.estacionServicio.create({
        data: {
            nombre: `EDS CPI ${suffix}`,
            nit: `901${suffix.slice(-7)}`,
            direccion: 'Cra 7 #32-16',
            ciudad: 'Bogota',
            departamento: 'Cundinamarca',
            codigoSicom: `SC-CPI-${suffix}`,
            zonaId: zona.id,
        },
    });

    const tanque = await prisma.tanque.create({
        data: {
            nombre: 'Tanque ACPM CPI',
            capacidadGalones: 2000,
            nivelActual: 1000,
            nivelMinimo: 50,
            tipoCombustible: 'ACPM',
            estacionId: estacion.id,
        },
    });

    const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: `cpi-admin-${suffix}@test.com`, password: 'CpiTestPass123!' });
    const adminToken: string = adminLogin.body.data.token;

    const noPermsLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: `cpi-noperms-${suffix}@test.com`, password: 'CpiTestPass123!' });
    const noPermsToken: string = noPermsLogin.body.data.token;

    return {
        suffix,
        adminToken,
        noPermsToken,
        roleId: role.id,
        noPermsRoleId: noPermsRole.id,
        userId: user.id,
        noPermsUserId: noPermsUser.id,
        zonaId: zona.id,
        decretoId: decreto.id,
        precioId: precio.id,
        estacionId: estacion.id,
        tanqueId: tanque.id,
    };
}

/**
 * Restaura el estado mutable entre tests: nivel del tanque, estación activa, precio activo.
 */
export async function resetCpiState(ctx: CpiContext): Promise<void> {
    await prisma.tanque.update({
        where: { id: ctx.tanqueId },
        data: { nivelActual: 1000 },
    });
    await prisma.estacionServicio.update({
        where: { id: ctx.estacionId },
        data: { activa: true },
    });
    await prisma.precioVigente.update({
        where: { id: ctx.precioId },
        data: { activo: true },
    });
}

/**
 * Elimina todos los datos de prueba creados por buildCpiContext.
 */
export async function teardownCpiContext(ctx: CpiContext): Promise<void> {
    await prisma.transaccionCombustible.deleteMany({ where: { estacionId: ctx.estacionId } });
    await prisma.auditoriaLog.deleteMany({ where: { usuarioId: ctx.userId } });
    await prisma.reporte.deleteMany({ where: { generadoPor: ctx.userId } });
    await prisma.tanque.delete({ where: { id: ctx.tanqueId } });
    await prisma.estacionServicio.delete({ where: { id: ctx.estacionId } });
    await prisma.precioVigente.deleteMany({ where: { decretoId: ctx.decretoId } });
    await prisma.decretoNormativo.delete({ where: { id: ctx.decretoId } });
    await prisma.zonaDistribucion.delete({ where: { id: ctx.zonaId } });
    await prisma.sessionToken.deleteMany({ where: { usuarioId: ctx.userId } });
    await prisma.sessionToken.deleteMany({ where: { usuarioId: ctx.noPermsUserId } });
    await prisma.usuario.delete({ where: { id: ctx.userId } });
    await prisma.usuario.delete({ where: { id: ctx.noPermsUserId } });
    await prisma.rol.delete({ where: { id: ctx.roleId } });
    await prisma.rol.delete({ where: { id: ctx.noPermsRoleId } });
    await prisma.$disconnect();
}
