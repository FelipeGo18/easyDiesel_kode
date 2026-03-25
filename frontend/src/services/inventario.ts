import api from './api';
import type { ApiResponse, Tanque, EntregaDistribuidor, TransaccionCombustible, CierreTurnoResult, TipoCombustible, TipoServicio } from '@/types';

export interface ResolvedTransactionPricing {
    precioId: string;
    zonaId: string;
    zona: {
        id: string;
        nombre: string;
        tipoZona: string;
    };
    precioUnitario: number;
    subsidioGalon: number;
    subsidioAplicado: boolean;
    decretoAplicado: string;
    decreto: {
        id: string;
        numero: string;
        titulo: string;
        fechaVigencia: string;
    };
    vigenciaDesde: string;
    vigenciaHasta: string | null;
}

export interface RegistrarTransaccionResult {
    transaccion: TransaccionCombustible;
    alerta?: string;
    pricing?: ResolvedTransactionPricing;
}

export interface ConfirmarEntregaData {
    estacionId: string;
    tanqueId: string;
    galonesRecibidos: number;
}

export interface ConfirmarEntregaResult {
    entrega: EntregaDistribuidor;
    transaccion: TransaccionCombustible;
    alerta?: string;
}

export interface ConfirmarEntregaMultiData {
    estacionId: string;
    distribuciones: { tanqueId: string; galones: number }[];
}

export interface ConfirmarEntregaMultiResult {
    entrega: EntregaDistribuidor;
    transacciones: { transaccion: TransaccionCombustible; tanqueNombre: string; galones: number }[];
    totalGalonesRecibidos: number;
    alerta?: string;
}

export interface PaginatedResult<T> {
    data: T[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
}

/* ── Tanques ── */
export const tanquesService = {
    getAll: (estacionId?: string) => 
        api.get<ApiResponse<Tanque[]>>('/tanques', { params: { estacionId } }).then(r => r.data.data || []),
    getById: (id: string) => 
        api.get<ApiResponse<Tanque>>(`/tanques/${id}`).then(r => r.data.data as Tanque),
    create: (data: Partial<Tanque>) => 
        api.post<ApiResponse<Tanque>>('/tanques', data).then(r => r.data.data as Tanque),
    update: (id: string, data: Partial<Tanque>) => 
        api.put<ApiResponse<Tanque>>(`/tanques/${id}`, data).then(r => r.data.data as Tanque),
    delete: (id: string) => 
        api.delete<ApiResponse<{ deleted: boolean }>>(`/tanques/${id}`).then(r => r.data.data?.deleted || false),
};

/* ── Inventario Operaciones ── */
export interface RegistrarEntregaData {
    distribuidorId: string;
    estacionId: string;
    tanqueId: string;
    tipoCombustible: TipoCombustible;
    galones: number;
    precioUnitario: number;
    numeroRemision: string;
    fechaEntrega: string;
}

export interface RegistrarTransaccionData {
    estacionId: string;
    tanqueId: string;
    tipo: 'SALIDA';
    tipoCombustible: TipoCombustible;
    tipoServicio: TipoServicio;
    galones: number;
    precioUnitario?: number;
    placaVehiculo?: string;
    decretoAplicado?: string;
    subsidioAplicado?: boolean;
    esGranConsumidor?: boolean;
}

export interface CierreTurnoData {
    estacionId: string;
    tanqueId: string;
    nivelFisico: number;
    observaciones?: string;
}

export interface EntradaDirectaData {
    estacionId: string;
    tanqueId: string;
    tipoCombustible: TipoCombustible;
    galones: number;
    precioUnitario: number;
    observaciones?: string;
}

export interface EntradaDirectaResult {
    transaccion: TransaccionCombustible;
    nivelAnterior: number;
    nivelNuevo: number;
}

export const inventarioService = {
    registrarEntrega: (data: RegistrarEntregaData) => 
        api.post<ApiResponse<EntregaDistribuidor>>('/inventario/entregas', data).then(r => r.data.data as EntregaDistribuidor),

    listarEntregasPendientes: (estacionId: string, opts?: { page?: number; limit?: number }) =>
        api.get<ApiResponse<EntregaDistribuidor[]> & { pagination?: PaginatedResult<EntregaDistribuidor>['pagination'] }>('/inventario/entregas/pendientes', { params: { estacionId, ...opts } })
            .then(r => ({ data: (r.data as any).data as EntregaDistribuidor[], pagination: (r.data as any).pagination as PaginatedResult<EntregaDistribuidor>['pagination'] | undefined })),

    listarEntregasPorDistribuidor: (distribuidorId: string, opts?: { page?: number; limit?: number }) =>
        api.get<ApiResponse<EntregaDistribuidor[]>>('/inventario/entregas', { params: { distribuidorId, ...opts } })
            .then(r => ({ data: (r.data as any).data as EntregaDistribuidor[], pagination: (r.data as any).pagination as PaginatedResult<EntregaDistribuidor>['pagination'] | undefined })),

    confirmarEntrega: (entregaId: string, data: ConfirmarEntregaData) =>
        api.post<ApiResponse<ConfirmarEntregaResult> & { alerta?: string }>(`/inventario/entregas/${entregaId}/confirmar`, data)
            .then(r => ({
                ...(r.data.data as ConfirmarEntregaResult),
                alerta: r.data.alerta ?? r.data.data?.alerta,
            } as ConfirmarEntregaResult)),

    confirmarEntregaMulti: (entregaId: string, data: ConfirmarEntregaMultiData) =>
        api.post<ApiResponse<ConfirmarEntregaMultiResult>>(`/inventario/entregas/${entregaId}/confirmar-multi`, data)
            .then(r => ({
                ...(r.data.data as ConfirmarEntregaMultiResult),
                alerta: (r.data as any).alerta ?? r.data.data?.alerta,
            } as ConfirmarEntregaMultiResult)),

    registrarEntradaDirecta: (data: EntradaDirectaData) =>
        api.post<ApiResponse<EntradaDirectaResult>>('/inventario/entregas/directa', data)
            .then(r => r.data.data as EntradaDirectaResult),
    
    registrarTransaccion: (data: RegistrarTransaccionData) => 
        api.post<ApiResponse<TransaccionCombustible> & { alerta?: string; pricing?: ResolvedTransactionPricing }>('/inventario/transacciones', data)
            .then(r => ({
                transaccion: r.data.data as TransaccionCombustible,
                alerta: r.data.alerta,
                pricing: r.data.pricing,
            } as RegistrarTransaccionResult)),
    
    cierreTurno: (data: CierreTurnoData) => 
        api.post<ApiResponse<CierreTurnoResult>>('/inventario/cierre-turno', data).then(r => r.data.data as CierreTurnoResult),

    listarTransacciones: (opts: { estacionId?: string; placaVehiculo?: string; page?: number; limit?: number }) =>
        api.get<any>('/inventario/transacciones', { params: opts })
            .then(r => ({
                data: (r.data.data ?? []) as TransaccionCombustible[],
                pagination: r.data.pagination as PaginatedResult<TransaccionCombustible>['pagination'] | undefined,
            })),

    cancelarEntrega: (entregaId: string) =>
        api.delete<ApiResponse<{ cancelada: boolean; entregaId: string }>>(`/inventario/entregas/${entregaId}`)
            .then(r => r.data.data as { cancelada: boolean; entregaId: string }),
};
