/**
 * easyDiesel — Prueba rapida de humo (Smoke Test)
 * Ajustada para Supabase Free Plan:
 *   - Max 5 VUs (respeta limite de ~2 conexiones pool)
 *   - 10s de duracion (~25 requests totales)
 *   - Ancho de banda estimado: < 1 MB
 *
 * USO:  k6 run quick-test.js
 */

import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
    vus: 3,
    duration: '10s',
    thresholds: {
        http_req_duration: ['p(95)<2000'],
        http_req_failed:   ['rate<0.10'],
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

    if (res.status !== 200) {
        console.error(`[SETUP] Login fallido: ${res.status} - ${res.body}`);
        return { token: null };
    }

    return { token: res.json('data.token') };
}

export default function (data) {
    const { token } = data;
    if (!token) {
        console.error('Sin token, abortando iteracion');
        sleep(1);
        return;
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };

    const res = http.get(`${BASE_URL}/api/tanques`, { headers });
    check(res, {
        'GET /tanques responde 200': (r) => r.status === 200,
    });
    sleep(1);
}
