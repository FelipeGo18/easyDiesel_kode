/**
 * easyDiesel — Prueba de Carga y Estres combinada (Script principal)
 * Ajustada para Supabase Free Plan:
 *   - Escenario 1 (carga): max 8 VUs, ~2 min (~800 requests, ~4 MB)
 *   - Escenario 2 (estres): max 25 VUs, ~5 min (~2,000 requests, ~10 MB)
 *   - Duracion total: ~9 min (escenarios secuenciales)
 *   - Ancho de banda combinado estimado: ~15 MB
 *
 * LIMITES FREE PLAN:
 *   - 500 MB transferencia/mes (REST API)
 *   - 60 conexiones directas DB / 2-15 pool (Supavisor)
 *   - Ejecutar este script MAXIMO 5-6 veces al mes para no agotar cuota
 *
 * USO:  k6 run stress_test.js
 */

import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate       = new Rate('error_rate');
const loginDuration   = new Trend('login_duration',       true);
const ventaDuration   = new Trend('venta_duration',       true);
const consultaDuration= new Trend('consulta_duration',    true);

export const options = {
    scenarios: {
        carga_normal: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 5  },  // Rampa suave
                { duration: '1m',  target: 8  },  // Carga sostenida moderada
                { duration: '30s', target: 0  },  // Bajada
            ],
            gracefulRampDown: '30s',
            tags: { scenario: 'carga_normal' },
        },

        estres: {
            executor: 'ramping-vus',
            startVUs: 0,
            startTime: '2m',
            stages: [
                { duration: '1m',  target: 10  },  // Subida gradual
                { duration: '1m',  target: 20  },  // Estres leve
                { duration: '1m',  target: 25  },  // Estres moderado-alto (limite free plan)
                { duration: '1m',  target: 10  },  // Recuperacion
                { duration: '1m',  target: 0   },   // Bajada completa
            ],
            gracefulRampDown: '1m',
            tags: { scenario: 'estres' },
        },
    },

    thresholds: {
        'http_req_duration':                    ['p(95)<2000', 'p(99)<4000'],
        'http_req_duration{endpoint:login}':    ['p(95)<1000'],
        'http_req_duration{endpoint:venta}':    ['p(95)<2000'],
        'http_req_duration{endpoint:consulta}': ['p(95)<600'],
        'error_rate':                           ['rate<0.10'],
        'http_req_failed':                      ['rate<0.10'],
    },
};

const BASE_URL      = __ENV.BASE_URL      || 'http://localhost:3000';
const ADMIN_EMAIL   = __ENV.ADMIN_EMAIL   || 'admin@easydiesel.co';
const ADMIN_PASS    = __ENV.ADMIN_PASS    || 'EasyDiesel2026!';
const ESTACION_ID   = __ENV.ESTACION_ID   || '61467371-4e14-4781-aa35-3c66df79db46';
const TANQUE_ID     = __ENV.TANQUE_ID     || 'tanque-acpm-61467371-4e14-4781-aa35-3c66df79db46';
const ZONA_ID       = __ENV.ZONA_ID       || '1';

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

    group('Lectura — Tanques y Precios', () => {
        const t1 = http.get(`${BASE_URL}/api/tanques`, { headers, tags: { endpoint: 'consulta' } });
        const ok1 = check(t1, {
            'GET /tanques → 200': (r) => r.status === 200,
            'Respuesta en < 1000ms': (r) => r.timings.duration < 1000,
        });
        errorRate.add(!ok1);
        consultaDuration.add(t1.timings.duration);

        const queryParams = ZONA_ID
            ? `?zonaId=${ZONA_ID}&tipoCombustible=ACPM&tipoServicio=PARTICULAR`
            : null;

        if (queryParams) {
            const t2 = http.get(
                `${BASE_URL}/api/precios/consultar${queryParams}`,
                { tags: { endpoint: 'consulta' } }
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

        sleep(1);
    });

    group('Escritura — Registrar Transaccion', () => {
        if (!ESTACION_ID || !TANQUE_ID) {
            sleep(1.5);
            return;
        }

        const payload = JSON.stringify({
            estacionId:     ESTACION_ID,
            tanqueId:       TANQUE_ID,
            tipoCombustible: 'ACPM',
            tipoServicio:   'PARTICULAR',
            galones:        10,
            precioUnitario: 12500,
            placaVehiculo:  `TEST-${Math.floor(Math.random() * 9000) + 1000}`,
            subsidioAplicado: false,
        });

        const res = http.post(
            `${BASE_URL}/api/inventario/transacciones`,
            payload,
            { headers, tags: { endpoint: 'venta' } }
        );

        const ok = check(res, {
            'POST /transacciones → 201/200': (r) => r.status === 201 || r.status === 200,
            'Respuesta en < 2000ms': (r) => r.timings.duration < 2000,
        });
        errorRate.add(!ok);
        ventaDuration.add(res.timings.duration);

        sleep(1.5);
    });

    group('Dashboard — KPIs', () => {
        const res = http.get(`${BASE_URL}/api/dashboard`, { headers, tags: { endpoint: 'consulta' } });
        check(res, { 'GET /dashboard → 200': (r) => r.status === 200 });
        consultaDuration.add(res.timings.duration);
        sleep(1);
    });

    sleep(1);
}

export function teardown(data) {
    console.log('='.repeat(60));
    console.log('PRUEBA FINALIZADA — AJUSTADA PARA SUPABASE FREE PLAN');
    console.log('Revisar:');
    console.log('  - error_rate         (objetivo: < 10%)');
    console.log('  - http_req_duration  p(95) < 2000ms');
    console.log('  - venta_duration     p(95) < 2000ms');
    console.log('  - consulta_duration  p(95) < 600ms');
    console.log('=.repeat(60)');
}