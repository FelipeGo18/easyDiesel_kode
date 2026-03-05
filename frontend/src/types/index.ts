// ──────────────────────────────────────────
// Tipos del dominio — Frontend
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

export type TipoCombustible = 'ACPM' | 'GASOLINA_CORRIENTE' | 'GASOLINA_EXTRA';

export type TipoServicio =
    | 'PARTICULAR'
    | 'PUBLICO'
    | 'DIPLOMATICO'
    | 'OFICIAL'
    | 'CARGA';

export type RolUsuario =
    | 'admin'
    | 'estacion'
    | 'distribuidor'
    | 'regulador'
    | 'auditor'
    | 'particular'
    | 'subsidiado'
    | 'distribuidor_regulado';

export interface Usuario {
    id: string;
    email: string;
    nombre: string;
    fotoUrl?: string;
    activo: boolean;
    rol: RolUsuario;
}
