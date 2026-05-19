/**
 * easyDiesel — Prueba de Estres (Stress Testing)
 * Ajustada para Supabase Free Plan:
 *   - Max 30 VUs en pico (no excede el limite de 60 conexiones directas)
 *   - Duracion total ~7 min (~3,000-5,000 requests)
 *   - Ancho de banda estimado: ~15-25 MB
 *   - Umbral de error laxo (15%) tolera rechazos esperados en free plan
 *
 * ADVERTENCIA: Esta prueba genera ~15-25 MB de transferencia API.
 * NO ejecutar mas de 10-15 veces al mes o agotaras el free plan.
 *
 * USO:  k6 run stress-test.js
 */

import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate       = new Rate('error_rate');
const ventaDuration   = new Trend('venta_duration',       true);

export const options = {
    scenarios: {
        estres: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '1m',  target: 5  },   // Calentamiento suave
                { duration: '1m',  target: 15  },  // Carga moderada (inicio presion)
                { duration: '2m',  target: 30  },   // Pico de estres (limite free plan)
                { duration: '1m',  target: 10  },   // Recuperacion parcial
                { duration: '30s', target: 0   },    // Bajada completa
            ],
            gracefulRampDown: '30s',
        },
    },
    thresholds: {
        'http_req_duration':  ['p(95)<3000'],
        'error_rate':         ['rate<0.15'],
    },
};

const BASE_URL      = __ENV.BASE_URL      || 'http://localhost:8080';
const ADMIN_EMAIL   = __ENV.ADMIN_EMAIL   || 'admin@easydiesel.co';
const ADMIN_PASS    = __ENV.ADMIN_PASS    || 'EasyDiesel2026!';

export function setup() {
    const res = http.post(
        `${BASE_URL}/api/auth/login`,
        JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS }),
        { headers: { 'Content-Type': 'application/json' } }
    );
    return { token: res.status === 200 ? res.json('data.token') : null };
}

export default function (data) {
    const { token } = data;
    if (!token) { sleep(1); return; }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };

    group('Escritura — Estres en Transacciones', () => {
        const payload = JSON.stringify({
            estacionId:     '61467371-4e14-4781-aa35-3c66df79db46',
            tanqueId:       'tanque-acpm-61467371-4e14-4781-aa35-3c66df79db46',
            tipoCombustible: 'ACPM',
            tipoServicio:   'PARTICULAR',
            galones:        Math.floor(Math.random() * 50) + 5,
            precioUnitario: 12500,
            placaVehiculo:  `ESTR-${Math.floor(Math.random() * 9000) + 1000}`,
            subsidioAplicado: false,
        });

        const res = http.post(
            `${BASE_URL}/api/inventario/transacciones`,
            payload,
            { headers, tags: { endpoint: 'venta' } }
        );

        const ok = check(res, { 'POST /transacciones exitoso': (r) => r.status === 201 || r.status === 200 });
        errorRate.add(!ok);
        ventaDuration.add(res.timings.duration);
        sleep(1);
    });
}