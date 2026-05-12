/**
 * easyDiesel — Script de Carga y Estrés con k6
 *
 * USO:
 *   k6 run stress_test.js
 *   k6 run --env BASE_URL=http://localhost:3000 stress_test.js
 *
 * INSTALACION de k6 (Windows):
 *   winget install k6 --source winget
 *   o via Chocolatey: choco install k6
 *
 * INTERPRETACION DE RESULTADOS:
 *   http_req_duration p(95) < 500ms  → Aceptable
 *   http_req_duration p(95) < 1000ms → Limite
 *   http_req_duration p(95) > 2000ms → Punto de quiebre
 *   error_rate > 1%                  → Sistema bajo presion
 */

import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ─── Metricas personalizadas ────────────────────────────────────────────────
const errorRate       = new Rate('error_rate');
const loginDuration   = new Trend('login_duration',       true);
const ventaDuration   = new Trend('venta_duration',       true);
const consultaDuration= new Trend('consulta_duration',    true);

// ─── Configuracion de escenarios ────────────────────────────────────────────
export const options = {
    scenarios: {
        // Escenario 1: Carga normal sostenida
        carga_normal: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '1m', target: 20 },  // Rampa: 0 → 20 usuarios en 1 min
                { duration: '3m', target: 20 },  // Estabilidad: 20 usuarios por 3 min
                { duration: '30s', target: 0 },  // Bajada
            ],
            gracefulRampDown: '30s',
            tags: { scenario: 'carga_normal' },
        },

        // Escenario 2: Prueba de estrés (punto de quiebre)
        estres: {
            executor: 'ramping-vus',
            startVUs: 0,
            startTime: '5m', // Empieza cuando termina carga_normal
            stages: [
                { duration: '1m', target: 50  },  // Subida
                { duration: '2m', target: 100 },  // Estrés leve
                { duration: '2m', target: 200 },  // Estrés moderado
                { duration: '1m', target: 300 },  // Estrés extremo
                { duration: '2m', target: 0   },  // Recuperacion
            ],
            gracefulRampDown: '1m',
            tags: { scenario: 'estres' },
        },
    },

    thresholds: {
        // Criterios de aceptacion
        'http_req_duration':                    ['p(95)<800', 'p(99)<2000'],
        'http_req_duration{endpoint:login}':    ['p(95)<500'],
        'http_req_duration{endpoint:venta}':    ['p(95)<1000'],
        'http_req_duration{endpoint:consulta}': ['p(95)<300'],
        'error_rate':                           ['rate<0.05'],   // max 5% errores
        'http_req_failed':                      ['rate<0.05'],
    },
};

// ─── Variables de entorno ────────────────────────────────────────────────────
const BASE_URL      = __ENV.BASE_URL      || 'http://localhost:3000';
const ADMIN_EMAIL   = __ENV.ADMIN_EMAIL   || 'admin@easydiesel.co';
const ADMIN_PASS    = __ENV.ADMIN_PASS    || 'EasyDiesel2026!';
const ESTACION_ID   = __ENV.ESTACION_ID   || '';  // Rellenar con un ID real de la BD
const TANQUE_ID     = __ENV.TANQUE_ID     || '';  // Rellenar con un ID real de la BD
const ZONA_ID       = __ENV.ZONA_ID       || '';  // Rellenar con un ID real de la BD

// ─── Setup: obtiene token una sola vez antes de todas las iteraciones ────────
export function setup() {
    const res = http.post(
        `${BASE_URL}/api/auth/login`,
        JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS }),
        { headers: { 'Content-Type': 'application/json' } }
    );

    check(res, { 'setup: login exitoso (200)': (r) => r.status === 200 });

    if (res.status !== 200) {
        console.error(`[SETUP] Login fallido: ${res.status} — ${res.body}`);
        return { token: null };
    }

    const token = res.json('data.token');
    console.log(`[SETUP] Token obtenido. Iniciando pruebas sobre ${BASE_URL}`);
    return { token };
}

// ─── Funcion principal: ejecutada por cada VU en cada iteracion ─────────────
export default function (data) {
    const { token } = data;

    if (!token) {
        console.error('[VU] No hay token. Abortando iteracion.');
        return;
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };

    // ── Grupo 1: Consultas de lectura (alta frecuencia) ──────────────────────
    group('Lectura — Tanques y Precios', () => {

        // GET /api/tanques — lista de tanques
        const t1 = http.get(`${BASE_URL}/api/tanques`, { headers, tags: { endpoint: 'consulta' } });
        const ok1 = check(t1, {
            'GET /tanques → 200': (r) => r.status === 200,
            'Respuesta en < 500ms': (r) => r.timings.duration < 500,
        });
        errorRate.add(!ok1);
        consultaDuration.add(t1.timings.duration);

        // GET /api/precios/consultar — precio vigente (endpoint público crítico)
        const queryParams = ZONA_ID
            ? `?zonaId=${ZONA_ID}&tipoCombustible=GASOLINA_CORRIENTE&tipoServicio=PARTICULAR`
            : null;

        if (queryParams) {
            const t2 = http.get(
                `${BASE_URL}/api/precios/consultar${queryParams}`,
                { headers, tags: { endpoint: 'consulta' } }
            );
            const ok2 = check(t2, {
                'GET /precios/consultar → 200': (r) => r.status === 200,
                'precioGalon presente':         (r) => {
                    try { return r.json('data.precioGalon') > 0; }
                    catch (_) { return false; }
                },
            });
            errorRate.add(!ok2);
            consultaDuration.add(t2.timings.duration);
        }

        sleep(0.5);
    });

    // ── Grupo 2: Operaciones de escritura (transacciones) ────────────────────
    group('Escritura — Registrar Transaccion', () => {
        // Solo ejecutar si tenemos IDs configurados
        if (!ESTACION_ID || !TANQUE_ID) {
            sleep(1);
            return;
        }

        const payload = JSON.stringify({
            estacionId:     ESTACION_ID,
            tanqueId:       TANQUE_ID,
            tipoCombustible: 'GASOLINA_CORRIENTE',
            tipoServicio:   'PARTICULAR',
            galones:        10,
            precioUnitario: 11349,
            placaVehiculo:  `TEST-${Math.floor(Math.random() * 9000) + 1000}`,
        });

        const res = http.post(
            `${BASE_URL}/api/inventario/transacciones`,
            payload,
            { headers, tags: { endpoint: 'venta' } }
        );

        const ok = check(res, {
            'POST /transacciones → 201': (r) => r.status === 201,
            'success = true':            (r) => {
                try { return r.json('success') === true; }
                catch (_) { return false; }
            },
            'Respuesta en < 1000ms': (r) => r.timings.duration < 1000,
        });
        errorRate.add(!ok);
        ventaDuration.add(res.timings.duration);

        sleep(1);
    });

    // ── Grupo 3: Dashboard (lectura agregada — más costosa) ─────────────────
    group('Dashboard — KPIs', () => {
        const res = http.get(`${BASE_URL}/api/dashboard`, { headers, tags: { endpoint: 'consulta' } });
        check(res, { 'GET /dashboard → 200': (r) => r.status === 200 });
        consultaDuration.add(res.timings.duration);
        sleep(0.5);
    });

    sleep(1); // Pausa entre iteraciones del VU
}

// ─── Teardown: resumen al final ──────────────────────────────────────────────
export function teardown(data) {
    console.log('='.repeat(60));
    console.log('PRUEBA FINALIZADA');
    console.log('Revisar:');
    console.log('  - error_rate         (objetivo: < 5%)');
    console.log('  - http_req_duration  p(95) < 800ms');
    console.log('  - venta_duration     p(95) < 1000ms');
    console.log('  - consulta_duration  p(95) < 300ms');
    console.log('='.repeat(60));
}
