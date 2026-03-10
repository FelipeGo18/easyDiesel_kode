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

        if (Array.isArray(data?.errors) && data.errors.length > 0) {
            return data.errors.map((issue) => issue.message || issue.mensaje).filter(Boolean).join(', ');
        }

        if (typeof data?.error === 'string') {
            return data.error;
        }

        if (typeof data?.error === 'object' && data.error?.message) {
            return data.error.message;
        }

        if (data?.message) {
            return data.message;
        }

        if (error.message) {
            return error.message;
        }
    }

    if (error instanceof Error) {
        return error.message;
    }

    return fallback;
}