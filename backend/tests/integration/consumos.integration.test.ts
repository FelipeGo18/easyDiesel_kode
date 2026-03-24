import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/utils/prisma';
import bcrypt from 'bcryptjs';

describe('Consumos Integration Tests (TC-01)', () => {
    jest.setTimeout(30000); // Aumentar timeout a 30 segundos
    let testUser: any;
    let testRole: any;
    let testZona: any;
    let testDecreto: any;
    let testPrecio: any;
    let testEstacion: any;
    let testTanque: any;
    let authToken: string;

    beforeAll(async () => {
        // 1. Crear Rol con permisos necesarios
        testRole = await prisma.rol.create({
            data: {
                nombre: 'test-estacion-role-' + Date.now(),
                permisos: ['inventario:escribir', 'inventario:leer']
            }
        });

        // 2. Crear Usuario
        const passwordHash = await bcrypt.hash('TestPass123!', 10);
        testUser = await prisma.usuario.create({
            data: {
                email: `test-estacion-${Date.now()}@easydiesel.com`,
                nombre: 'Operario Test',
                passwordHash,
                rolId: testRole.id
            }
        });

        // 3. Crear Zona
        testZona = await prisma.zonaDistribucion.create({
            data: {
                nombre: 'Zona Test ' + Date.now(),
                municipios: ['Bogotá']
            }
        });

        // 4. Crear Decreto
        testDecreto = await prisma.decretoNormativo.create({
            data: {
                numero: 'DECRETO-TEST-' + Date.now(),
                titulo: 'Decreto de Prueba',
                fechaExpedicion: new Date(),
                fechaVigencia: new Date()
            }
        });

        // 5. Crear Precio Vigente
        testPrecio = await prisma.precioVigente.create({
            data: {
                tipoCombustible: 'ACPM',
                tipoServicio: 'PARTICULAR',
                zonaId: testZona.id,
                precioGalon: 9500,
                subsidioGalon: 0,
                decretoId: testDecreto.id,
                vigenciaDesde: new Date(),
                activo: true
            }
        });

        // 6. Crear Estación
        testEstacion = await prisma.estacionServicio.create({
            data: {
                nombre: 'EDS Test ' + Date.now(),
                nit: 'NIT-' + Date.now(),
                direccion: 'Calle Falsa 123',
                ciudad: 'Bogotá',
                departamento: 'Cundinamarca',
                codigoSicom: 'SICOM-' + Date.now(),
                zonaId: testZona.id,
                usuarioId: testUser.id
            }
        });

        // 7. Crear Tanque
        testTanque = await prisma.tanque.create({
            data: {
                nombre: 'Tanque Test',
                capacidadGalones: 5000,
                nivelActual: 1000,
                tipoCombustible: 'ACPM',
                estacionId: testEstacion.id
            }
        });

        // 8. Login
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: 'TestPass123!'
            });
        authToken = loginRes.body.data.token;
    });

    afterAll(async () => {
        await prisma.transaccionCombustible.deleteMany({ where: { estacionId: testEstacion.id } });
        await prisma.auditoriaLog.deleteMany({ where: { usuarioId: testUser.id } });
        await prisma.tanque.delete({ where: { id: testTanque.id } });
        await prisma.estacionServicio.delete({ where: { id: testEstacion.id } });
        await prisma.precioVigente.delete({ where: { id: testPrecio.id } });
        await prisma.decretoNormativo.delete({ where: { id: testDecreto.id } });
        await prisma.zonaDistribucion.delete({ where: { id: testZona.id } });
        await prisma.sessionToken.deleteMany({ where: { usuarioId: testUser.id } });
        await prisma.usuario.delete({ where: { id: testUser.id } });
        await prisma.rol.delete({ where: { id: testRole.id } });
        await prisma.$disconnect();
    });

    describe('POST /api/inventario/transacciones', () => {
        it('TC-01: Debería registrar un consumo exitosamente', async () => {
            const payload = {
                estacionId: testEstacion.id,
                tanqueId: testTanque.id,
                tipo: 'SALIDA',
                tipoCombustible: 'ACPM',
                tipoServicio: 'PARTICULAR',
                galones: 10,
                precioUnitario: 9500,
                placaVehiculo: 'ABC-123'
            };
            
            const response = await request(app)
                .post('/api/inventario/transacciones')
                .set('Authorization', `Bearer ${authToken}`)
                .send(payload);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            
            const t = await prisma.tanque.findUnique({ where: { id: testTanque.id } });
            expect(Number(t?.nivelActual)).toBe(990);
        });
    });
});
