// ──────────────────────────────────────────
// Tipos del dominio — Plataforma de Combustibles
// ──────────────────────────────────────────

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface JwtPayload {
    userId: string;
    email: string;
    rol: string;
}
