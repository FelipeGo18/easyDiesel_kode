import bcrypt from 'bcryptjs';
import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/utils/prisma';

jest.setTimeout(30000);

describe('Inventario Integration Tests', () => {
    const suffix = Date.now().toString();

    let token: string;
    let roleId: string;
    let userId: string;
    let zonaId: string;
    let estacionId: string;
    let distribuidorId: string;
    let tanqueId: string;
    let decretoId: string;
    let precioId: string;

    beforeAll(async () => {
        const passwordHash = await bcrypt.hash('InventarioPassword123!', 10);

        const role = await prisma.rol.create({
            data: {
                nombre: `inventario_test_${suffix}`,
                descripcion: 'Rol temporal para pruebas de integración de inventario',
                permisos: ['inventario:leer', 'inventario:escribir', 'tanques:leer'],
            },
        });
        roleId = role.id;

        const user = await prisma.usuario.create({
            data: {
                email: `inventario-${suffix}@test.com`,
                nombre: 'Inventario Integration',
                passwordHash,
                rolId: roleId,
            },
        });
        userId = user.id;

        const zona = await prisma.zonaDistribucion.create({
            data: {
                nombre: `Zona Integracion ${suffix}`,
                tipoZona: 'INTERCONECTADA',
                departamentos: ['Cundinamarca'],
                municipios: ['Bogota'],
                descripcion: 'Zona para pruebas automáticas',
            },
        });
        zonaId = zona.id;

        const estacion = await prisma.estacionServicio.create({
            data: {
                nombre: `Estacion Integracion ${suffix}`,
                nit: `900${suffix.slice(-7)}`,
                direccion: 'Calle 123 #45-67',
                ciudad: 'Bogota',
                departamento: 'Cundinamarca',
                codigoSicom: `SICOM-${suffix}`,
                zonaId,
            },
        });
        estacionId = estacion.id;

        const distribuidor = await prisma.distribuidor.create({
            data: {
                nombre: `Distribuidor Integracion ${suffix}`,
                nit: `800${suffix.slice(-7)}`,
                tipo: 'MAYORISTA',
                direccion: 'Zona industrial',
                ciudad: 'Bogota',
                departamento: 'Cundinamarca',
            },
        });
        distribuidorId = distribuidor.id;

        const tanque = await prisma.tanque.create({
            data: {
                nombre: 'Tanque ACPM Integracion',
                capacidadGalones: 1000,
                nivelActual: 500,
                nivelMinimo: 100,
                tipoCombustible: 'ACPM',
                estacionId,
            },
        });
        tanqueId = tanque.id;

        const decreto = await prisma.decretoNormativo.create({
            data: {
                numero: `DEC-INV-${suffix}`,
                titulo: 'Decreto Inventario Test',
                fechaExpedicion: new Date(),
                fechaVigencia: new Date(),
            },
        });
        decretoId = decreto.id;

        const precio = await prisma.precioVigente.create({
            data: {
                tipoCombustible: 'ACPM',
                tipoServicio: 'PARTICULAR',
                zonaId,
                precioGalon: 11800,
                subsidioGalon: 0,
                decretoId: decreto.id,
                vigenciaDesde: new Date(),
                activo: true,
            },
        });
        precioId = precio.id;

        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: `inventario-${suffix}@test.com`,
                password: 'InventarioPassword123!',
            });

        token = loginResponse.body.data.token;
    });

    beforeEach(async () => {
        await prisma.transaccionCombustible.deleteMany({ where: { tanqueId } });
        await prisma.entregaDistribuidor.deleteMany({ where: { tanqueId } });
        await prisma.tanque.update({
            where: { id: tanqueId },
            data: { nivelActual: 500 },
        });
    });

    afterAll(async () => {
        await prisma.transaccionCombustible.deleteMany({ where: { tanqueId } });
        await prisma.entregaDistribuidor.deleteMany({ where: { tanqueId } });
        await prisma.auditoriaLog.deleteMany({ where: { usuarioId: userId } });
        await prisma.tanque.delete({ where: { id: tanqueId } });
        await prisma.estacionServicio.delete({ where: { id: estacionId } });
        await prisma.distribuidor.delete({ where: { id: distribuidorId } });
        await prisma.precioVigente.deleteMany({ where: { decretoId } });
        await prisma.decretoNormativo.delete({ where: { id: decretoId } });
        await prisma.zonaDistribucion.delete({ where: { id: zonaId } });
        await prisma.sessionToken.deleteMany({ where: { usuarioId: userId } });
        await prisma.usuario.delete({ where: { id: userId } });
        await prisma.rol.delete({ where: { id: roleId } });
        await prisma.$disconnect();
    });

    it('registra una entrega y aumenta el nivel del tanque tras confirmarla', async () => {
        const entregaRes = await request(app)
            .post('/api/inventario/entregas')
            .set('Authorization', `Bearer ${token}`)
            .send({
                distribuidorId,
                estacionId,
                tanqueId,
                tipoCombustible: 'ACPM',
                galones: 150,
                precioUnitario: 10250,
                numeroRemision: `REM-${suffix}-1`,
                fechaEntrega: new Date().toISOString(),
            });

        expect(entregaRes.status).toBe(201);
        expect(entregaRes.body.success).toBe(true);
        const entregaId = entregaRes.body.data.id;
        expect(entregaId).toBeDefined();

        // Confirmar la entrega para que actualice el nivel del tanque
        const confirmRes = await request(app)
            .post(`/api/inventario/entregas/${entregaId}/confirmar`)
            .set('Authorization', `Bearer ${token}`)
            .send({ estacionId, tanqueId, galonesRecibidos: 150 });

        expect(confirmRes.status).toBe(200);

        const tanque = await prisma.tanque.findUniqueOrThrow({ where: { id: tanqueId } });
        expect(Number(tanque.nivelActual)).toBe(650);

        const transacciones = await prisma.transaccionCombustible.findMany({ where: { tanqueId } });
        expect(transacciones).toHaveLength(1);
        expect(transacciones[0].tipo).toBe('ENTRADA');
    });

    it('registra una salida y avisa cuando el tanque cae al mínimo operativo', async () => {
        await prisma.tanque.update({
            where: { id: tanqueId },
            data: { nivelActual: 120 },
        });

        const response = await request(app)
            .post('/api/inventario/transacciones')
            .set('Authorization', `Bearer ${token}`)
            .send({
                estacionId,
                tanqueId,
                tipoCombustible: 'ACPM',
                tipoServicio: 'PARTICULAR',
                galones: 30,
                precioUnitario: 11800,
                placaVehiculo: 'ABC123',
                subsidioAplicado: false,
            });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.alerta).toContain('nivel mínimo operativo');

        const tanque = await prisma.tanque.findUniqueOrThrow({ where: { id: tanqueId } });
        expect(Number(tanque.nivelActual)).toBe(90);

        const transaccion = await prisma.transaccionCombustible.findFirstOrThrow({
            where: { tanqueId, tipo: 'SALIDA' },
            orderBy: { createdAt: 'desc' },
        });
        expect(Number(transaccion.precioTotal)).toBe(354000);
    });

    it('realiza cierre de turno y ajusta el nivel físico del tanque', async () => {
        await prisma.tanque.update({
            where: { id: tanqueId },
            data: { nivelActual: 400 },
        });

        const response = await request(app)
            .post('/api/inventario/cierre-turno')
            .set('Authorization', `Bearer ${token}`)
            .send({
                estacionId,
                tanqueId,
                nivelFisico: 385,
                observaciones: 'Ajuste por arqueo nocturno',
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.diferencia).toBe(-15);

        const tanque = await prisma.tanque.findUniqueOrThrow({ where: { id: tanqueId } });
        expect(Number(tanque.nivelActual)).toBe(385);

        const ajuste = await prisma.transaccionCombustible.findFirstOrThrow({
            where: { tanqueId, decretoAplicado: { contains: 'Ajuste Cierre Turno' } },
            orderBy: { createdAt: 'desc' },
        });
        expect(ajuste.tipo).toBe('SALIDA');
        expect(Number(ajuste.galones)).toBe(15);
    });
});