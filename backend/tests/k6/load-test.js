/**
 * easyDiesel — Prueba de Carga (Load Testing)
 * Ajustada para Supabase Free Plan:
 *   - Max 10 VUs simultaneas (respeta ~15 pool connections)
 *   - Duracion total ~3 min (~1,500-2,500 requests)
 *   - Ancho de banda estimado: ~10-15 MB
 *   - Sleeps generosos para no saturar conexiones
 *
 * LIMITES FREE PLAN A CONSIDERAR:
 *   - 500 MB transferencia/mes (REST API)
 *   - 60 conexiones directas DB / 2-15 pool (Supavisor)
 *   - Evitar ejecutar multiples veces al dia sin monitorear uso
 *
 * USO:  k6 run load-test.js
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
                { duration: '30s', target: 5 },   // Rampa suave: 0 -> 5 VUs
                { duration: '2m',  target: 10 },  // Carga sostenida moderada: 10 VUs
                { duration: '30s', target: 0 },   // Bajada progresiva
            ],
            gracefulRampDown: '30s',
        },
    },
    thresholds: {
        'http_req_duration':                    ['p(95)<1500', 'p(99)<3000'],
        'http_req_duration{endpoint:login}':    ['p(95)<800'],
        'http_req_duration{endpoint:venta}':    ['p(95)<1500'],
        'http_req_duration{endpoint:consulta}': ['p(95)<500'],
        'error_rate':                           ['rate<0.05'],
    },
};

const BASE_URL      = __ENV.BASE_URL      || 'http://localhost:8080';
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
        console.error(`[SETUP] Login fallido: ${res.status}`);
        return { token: null };
    }

    return { token: res.json('data.token') };
}

export default function (data) {
    const { token } = data;
    if (!token) { sleep(1); return; }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };

    group('Lectura — Tanques y Precios', () => {
        const t1 = http.get(`${BASE_URL}/api/tanques`, { headers, tags: { endpoint: 'consulta' } });
        const ok1 = check(t1, { 'GET /tanques → 200': (r) => r.status === 200 });
        errorRate.add(!ok1);
        consultaDuration.add(t1.timings.duration);
        sleep(1);
    });

    group('Escritura — Registrar Transaccion', () => {
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

        const ok = check(res, { 'POST /transacciones → 201/200': (r) => r.status === 201 || r.status === 200 });
        errorRate.add(!ok);
        ventaDuration.add(res.timings.duration);
        sleep(1.5);
    });
}