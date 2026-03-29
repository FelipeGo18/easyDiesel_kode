import { AxiosError } from 'axios';

interface ErrorIssue {
    message?: string;
    mensaje?: string;
}

interface ApiErrorBody {
    message?: string;
    error?: string | { message?: string };
    errors?: ErrorIssue[];
}

export function getErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado') {
    if (error instanceof AxiosError) {
        const data = error.response?.data as ApiErrorBody | undefined;

        // 1. Errores de validación (Zod devuelto como 'details' o 'errors')
        const details = (data as any)?.details;
        if (Array.isArray(details) && details.length > 0) {
            return details
                .map((issue: any) => {
                    if (typeof issue === 'string') return issue;
                    return issue.mensaje || issue.message || null;
                })
                .filter(Boolean)
                .join(', ');
        }

        const errors = (data as any)?.errors;
        if (Array.isArray(errors) && errors.length > 0) {
            return errors
                .map((issue: any) => {
                    if (typeof issue === 'string') return issue;
                    return issue.mensaje || issue.message || null;
                })
                .filter(Boolean)
                .join(', ');
        }

        // 2. Errores con campo 'message' directo (Estructura estándar)
        if (data?.message) {
            return data.message;
        }

        // 3. Errores anidados en campo 'error'
        if (typeof data?.error === 'string') {
            return data.error;
        }

        if (typeof data?.error === 'object' && data.error?.message) {
            return data.error.message;
        }

        // 4. Mensaje de error de Axios (si no hay respuesta del servidor o estructura desconocida)
        // Solo si no hay respuesta del servidor, mostramos el mensaje de error de red/axios
        if (!error.response) {
            if (error.code === 'ECONNABORTED') return 'La conexión ha expirado. Intente de nuevo.';
            if (error.message === 'Network Error') return 'Error de red. Verifique su conexión.';
            return error.message || fallback;
        }

        // Si hay respuesta pero no pudimos extraer el mensaje, usamos el fallback
        return fallback;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return fallback;
}