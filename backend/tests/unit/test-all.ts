/**
 * EasyDiesel — Comprehensive Backend Test Script
 * Tests all modules: M1 Auth, M2 Users/Actors, M3 Inventory, M4 Prices, M5 Audit, M6 Reports, M7 Dashboard
 */

const BASE = 'http://localhost:3000/api';
let TOKEN = '';
let ZONA_ID = '';
let ESTACION_ID = '';
let DISTRIBUIDOR_ID = '';
let TANQUE_ID = '';
let DECRETO_ID = '';
let PRECIO_ID = '';

const results: { test: string; status: string; detail: string }[] = [];

async function req(method: string, path: string, body?: any, expectError = false) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;

    const opts: RequestInit = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${BASE}${path}`, opts);
    const text = await res.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = text; }

    return { status: res.status, data, ok: res.ok };
}

function log(test: string, passed: boolean, detail: string) {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    results.push({ test, status, detail });
    console.log(`  ${status}  ${test}  — ${detail}`);
}

async function testM1_Auth() {
    console.log('\n══════════════════════════════════════');
    console.log('  M1: AUTH');
    console.log('══════════════════════════════════════');

    // Login
    const loginRes = await req('POST', '/auth/login', { email: 'admin@easydiesel.co', password: 'Admin2026!' });
    const loginOk = loginRes.ok && loginRes.data?.data?.token;
    if (loginOk) TOKEN = loginRes.data.data.token;
    log('POST /auth/login', !!loginOk, loginOk ? `Token obtained (${TOKEN.substring(0, 20)}...)` : `Error: ${JSON.stringify(loginRes.data)}`);

    // Me
    const meRes = await req('GET', '/auth/me');
    log('GET /auth/me', meRes.ok && meRes.data?.data?.email === 'admin@easydiesel.co', `User: ${meRes.data?.data?.email || JSON.stringify(meRes.data)}`);

    // Invalid Login
    const badLogin = await req('POST', '/auth/login', { email: 'bad@bad.com', password: 'wrong' });
    log('POST /auth/login (invalid)', !badLogin.ok, `Status ${badLogin.status} (expected 4xx)`);

    // No token
    const saved = TOKEN; TOKEN = '';
    const noAuth = await req('GET', '/auth/me');
    log('GET /auth/me (no token)', !noAuth.ok, `Status ${noAuth.status}`);
    TOKEN = saved;
}

async function testM2_UsersActors() {
    console.log('\n══════════════════════════════════════');
    console.log('  M2: USUARIOS & ACTORES');
    console.log('══════════════════════════════════════');

    // List users
    const users = await req('GET', '/usuarios');
    log('GET /usuarios', users.ok, `Count: ${users.data?.data?.length ?? '?'}`);

    // List estaciones
    const estaciones = await req('GET', '/actores/estaciones');
    log('GET /actores/estaciones', estaciones.ok, `Count: ${estaciones.data?.data?.length ?? '?'}`);

    // List distribuidores
    const distribuidores = await req('GET', '/actores/distribuidores');
    log('GET /actores/distribuidores', distribuidores.ok, `Count: ${distribuidores.data?.data?.length ?? '?'}`);

    // Need a Zona to create estación
    const zonas = await req('GET', '/zonas');
    if (zonas.ok && zonas.data?.data?.length > 0) {
        ZONA_ID = zonas.data.data[0].id;
    }

    // Create estación
    if (ZONA_ID) {
        const crearEst = await req('POST', '/actores/estaciones', {
            nombre: 'Estación Test',
            nit: '900999888-1',
            direccion: 'Calle 123 #45-67',
            ciudad: 'Bogotá',
            departamento: 'Cundinamarca',
            codigoSicom: 'SICOM-TEST-001',
            zonaId: ZONA_ID,
            latitud: 4.6097,
            longitud: -74.0817,
        });
        if (crearEst.ok) ESTACION_ID = crearEst.data?.data?.id;
        log('POST /actores/estaciones', crearEst.ok || crearEst.status === 409, `ID: ${ESTACION_ID || crearEst.data?.message || crearEst.status}`);
    }

    // Create distribuidor
    const crearDist = await req('POST', '/actores/distribuidores', {
        nombre: 'Distribuidor Test',
        nit: '800111222-3',
        tipo: 'MAYORISTA',
        direccion: 'Cra 10 #20-30',
        ciudad: 'Medellín',
        departamento: 'Antioquia',
    });
    if (crearDist.ok) DISTRIBUIDOR_ID = crearDist.data?.data?.id;
    log('POST /actores/distribuidores', crearDist.ok || crearDist.status === 409, `ID: ${DISTRIBUIDOR_ID || crearDist.data?.message || crearDist.status}`);
}

async function testM3_Inventory() {
    console.log('\n══════════════════════════════════════');
    console.log('  M3: INVENTARIO (TANQUES)');
    console.log('══════════════════════════════════════');

    // List tanques
    const tanques = await req('GET', '/tanques');
    log('GET /tanques', tanques.ok, `Count: ${tanques.data?.data?.length ?? '?'}`);

    // Create tanque (needs estación)
    if (ESTACION_ID) {
        const crearTanque = await req('POST', '/tanques', {
            nombre: 'Tanque Principal ACPM',
            capacidadGalones: 10000,
            nivelMinimo: 500,
            tipoCombustible: 'ACPM',
            estacionId: ESTACION_ID,
        });
        if (crearTanque.ok) TANQUE_ID = crearTanque.data?.data?.id;
        log('POST /tanques', crearTanque.ok, `ID: ${TANQUE_ID || JSON.stringify(crearTanque.data?.message || crearTanque.status)}`);
    } else {
        log('POST /tanques', false, 'Skipped — no ESTACION_ID');
    }

    // Registrar entrega (abastecimiento)
    if (TANQUE_ID && DISTRIBUIDOR_ID && ESTACION_ID) {
        const entrega = await req('POST', '/inventario/entregas', {
            distribuidorId: DISTRIBUIDOR_ID,
            estacionId: ESTACION_ID,
            tanqueId: TANQUE_ID,
            tipoCombustible: 'ACPM',
            galones: 5000,
            precioUnitario: 9500,
            numeroRemision: 'REM-TEST-001',
            fechaEntrega: new Date().toISOString(),
        });
        log('POST /inventario/entregas', entrega.ok, `Status: ${entrega.status} — ${entrega.data?.message || 'OK'}`);
    } else {
        log('POST /inventario/entregas', false, 'Skipped — missing IDs');
    }

    // Registrar transacción (venta)
    if (TANQUE_ID && ESTACION_ID) {
        const transaccion = await req('POST', '/inventario/transacciones', {
            estacionId: ESTACION_ID,
            tanqueId: TANQUE_ID,
            tipo: 'SALIDA',
            tipoCombustible: 'ACPM',
            tipoServicio: 'PARTICULAR',
            galones: 50,
            precioUnitario: 10200,
            placaVehiculo: 'ABC123',
        });
        log('POST /inventario/transacciones', transaccion.ok, `Status: ${transaccion.status} — ${transaccion.data?.message || 'OK'}`);
    }
}

async function testM4_PricesRegulations() {
    console.log('\n══════════════════════════════════════');
    console.log('  M4: PRECIOS & NORMATIVA');
    console.log('══════════════════════════════════════');

    // Zonas
    const zonas = await req('GET', '/zonas');
    log('GET /zonas', zonas.ok, `Count: ${zonas.data?.data?.length ?? '?'}`);
    if (zonas.ok && zonas.data?.data?.length > 0 && !ZONA_ID) ZONA_ID = zonas.data.data[0].id;

    // Decretos
    const decretos = await req('GET', '/decretos');
    log('GET /decretos', decretos.ok, `Count: ${decretos.data?.data?.length ?? '?'}`);
    if (decretos.ok && decretos.data?.data?.length > 0) DECRETO_ID = decretos.data.data[0].id;

    // Precios
    const precios = await req('GET', '/precios');
    log('GET /precios', precios.ok, `Count: ${precios.data?.data?.length ?? '?'}`);

    // Crear precio
    if (ZONA_ID && DECRETO_ID) {
        const crearPrecio = await req('POST', '/precios', {
            tipoCombustible: 'ACPM',
            tipoServicio: 'PARTICULAR',
            zonaId: ZONA_ID,
            precioGalon: 10200,
            subsidioGalon: 0,
            decretoId: DECRETO_ID,
            vigenciaDesde: new Date().toISOString(),
            activo: true,
        });
        if (crearPrecio.ok) PRECIO_ID = crearPrecio.data?.data?.id;
        log('POST /precios', crearPrecio.ok, `ID: ${PRECIO_ID || JSON.stringify(crearPrecio.data?.message || crearPrecio.status)}`);
    }

    // Consulta publica
    const consulta = await req('GET', `/precios/consultar?zonaId=${ZONA_ID || ''}&tipoCombustible=ACPM`);
    log('GET /precios/consultar', consulta.ok || consulta.status === 404, `Status: ${consulta.status}`);
}

async function testM5_Audit() {
    console.log('\n══════════════════════════════════════');
    console.log('  M5: AUDITORÍA');
    console.log('══════════════════════════════════════');

    const logs = await req('GET', '/auditoria');
    log('GET /auditoria', logs.ok, `Count: ${logs.data?.data?.length ?? '?'}`);

    const logsPaginated = await req('GET', '/auditoria?page=1&limit=5');
    log('GET /auditoria (paginated)', logsPaginated.ok, `Status: ${logsPaginated.status}`);
}

async function testM6_Reports() {
    console.log('\n══════════════════════════════════════');
    console.log('  M6: REPORTES');
    console.log('══════════════════════════════════════');

    // Get reportes
    const reportes = await req('GET', '/reportes');
    log('GET /reportes', reportes.ok, `Count: ${reportes.data?.data?.length ?? '?'}`);

    // Generar reporte PDF
    const pdfReport = await req('POST', '/reportes', {
        tipo: 'INVENTARIO',
        formato: 'PDF',
    });
    log('POST /reportes (PDF)', pdfReport.ok || pdfReport.status === 200, `Status: ${pdfReport.status} — Content received: ${typeof pdfReport.data === 'string' ? pdfReport.data.length + ' chars' : JSON.stringify(pdfReport.data).substring(0, 80)}`);

    // Generar reporte EXCEL
    const excelReport = await req('POST', '/reportes', {
        tipo: 'TRANSACCIONES',
        formato: 'EXCEL',
    });
    log('POST /reportes (EXCEL)', excelReport.ok || excelReport.status === 200, `Status: ${excelReport.status}`);

    // Generar reporte CSV
    const csvReport = await req('POST', '/reportes', {
        tipo: 'PRECIOS',
        formato: 'CSV',
    });
    log('POST /reportes (CSV)', csvReport.ok || csvReport.status === 200, `Status: ${csvReport.status}`);
}

async function testM7_Dashboard() {
    console.log('\n══════════════════════════════════════');
    console.log('  M7: DASHBOARD');
    console.log('══════════════════════════════════════');

    const dashboard = await req('GET', '/dashboard');
    log('GET /dashboard', dashboard.ok, `Data keys: ${dashboard.data?.data ? Object.keys(dashboard.data.data).join(', ') : JSON.stringify(dashboard.data).substring(0, 80)}`);
}

async function testSwagger() {
    console.log('\n══════════════════════════════════════');
    console.log('  SWAGGER UI');
    console.log('══════════════════════════════════════');

    const res = await fetch('http://localhost:3000/api-docs/');
    log('GET /api-docs/', res.ok, `Status: ${res.status} — Content-Type: ${res.headers.get('content-type')}`);
}

// ─── MAIN ───
async function main() {
    console.log('╔════════════════════════════════════════════╗');
    console.log('║  EasyDiesel — Full Backend Test Suite      ║');
    console.log('╚════════════════════════════════════════════╝');

    await testM1_Auth();
    await testM2_UsersActors();
    await testM3_Inventory();
    await testM4_PricesRegulations();
    await testM5_Audit();
    await testM6_Reports();
    await testM7_Dashboard();
    await testSwagger();

    // Summary
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║           TEST SUMMARY                     ║');
    console.log('╚════════════════════════════════════════════╝');
    const passed = results.filter(r => r.status.includes('PASS')).length;
    const failed = results.filter(r => r.status.includes('FAIL')).length;
    console.log(`\n  Total: ${results.length}  |  ✅ Passed: ${passed}  |  ❌ Failed: ${failed}\n`);

    if (failed > 0) {
        console.log('  Failed tests:');
        results.filter(r => r.status.includes('FAIL')).forEach(r => {
            console.log(`    ❌ ${r.test}: ${r.detail}`);
        });
    }
}

main().catch(console.error);
