import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

const REFRESH_TOKEN_KEY = 'refreshToken';
let refreshRequest: Promise<string | null> | null = null;

async function renewSession() {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
        return null;
    }

    if (!refreshRequest) {
        refreshRequest = axios
            .post(`${API_URL}/auth/refresh`, { refresh_token: refreshToken }, {
                headers: { 'Content-Type': 'application/json' },
            })
            .then((response) => {
                const payload = response.data?.data;
                const newToken = payload?.token as string | undefined;
                const newRefreshToken = payload?.refreshToken as string | undefined;

                if (!newToken || !newRefreshToken) {
                    throw new Error('La renovación de sesión no devolvió tokens válidos');
                }

                localStorage.setItem('token', newToken);
                localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);

                return newToken;
            })
            .catch(() => {
                localStorage.removeItem('token');
                localStorage.removeItem(REFRESH_TOKEN_KEY);
                return null;
            })
            .finally(() => {
                refreshRequest = null;
            });
    }

    return refreshRequest;
}

// ── Interceptor: añadir token JWT ──────────────────────
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ── Interceptor: manejar errores ───────────────────────
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            originalRequest &&
            !originalRequest._retry &&
            !String(originalRequest.url || '').includes('/auth/refresh') &&
            !String(originalRequest.url || '').includes('/auth/logout') &&
            !String(originalRequest.url || '').includes('/auth/login')
        ) {
            originalRequest._retry = true;
            const newToken = await renewSession();

            if (newToken) {
                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            }

            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

export default api;
