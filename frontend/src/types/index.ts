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
    | 'distribuidor_regulado';

export interface Usuario {
    id: string;
    email: string;
    nombre: string;
    fotoUrl?: string;
    activo: boolean;
    rol: RolUsuario;
}

/* ── Inventario ── */
export interface Tanque {
    id: string;
    estacionId: string;
    nombre: string;
    tipoCombustible: TipoCombustible;
    capacidadGalones: number;
    nivelActual: number;
    nivelMinimo: number;
    ultimaLectura?: string;
}

export interface EntregaDistribuidor {
    id: string;
    distribuidorId: string;
    estacionId: string;
    tanqueId: string;
    tipoCombustible: TipoCombustible;
    galones: number;
    precioUnitario: number;
    precioTotal: number;
    numeroRemision: string;
    fechaEntrega: string;
    confirmada: boolean;
}

export interface TransaccionCombustible {
    id: string;
    estacionId: string;
    tanqueId: string;
    tipo: 'ENTRADA' | 'SALIDA';
    tipoCombustible: TipoCombustible;
    tipoServicio: TipoServicio;
    galones: number;
    precioUnitario: number;
    precioTotal: number;
    placaVehiculo?: string;
    decretoAplicado?: string;
    subsidioAplicado?: boolean;
    estado: 'PENDIENTE' | 'COMPLETADA' | 'CANCELADA';
    fecha: string;
}

export interface CierreTurnoResult {
    tanqueId: string;
    nombreTanque: string;
    nivelTeorico: number;
    nivelFisico: number;
    diferencia: number;
    ajusteRealizado: boolean;
    fechaCierre?: string;
}

/* ── Actores ── */
export interface EstacionServicio {
    id: string;
    nombre: string;
    nit: string;
    direccion: string;
    ciudad: string;
    departamento: string;
    codigoSicom: string;
    latitud?: number;
    longitud?: number;
    zonaId: string;
    usuarioId: string;
    zona?: { id: string; nombre: string };
    usuario?: { id: string; nombre: string; email: string };
    createdAt: string;
}

export interface Distribuidor {
    id: string;
    nombre: string;
    nit: string;
    tipo: 'MAYORISTA' | 'REGULADO';
    direccion: string;
    ciudad: string;
    departamento: string;
    usuarioId: string;
    usuario?: { id: string; nombre: string; email: string };
    createdAt: string;
}
