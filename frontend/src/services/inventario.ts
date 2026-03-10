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
}

export interface CierreTurnoData {
    estacionId: string;
    tanqueId: string;
    nivelFisico: number;
    observaciones?: string;
}

export const inventarioService = {
    registrarEntrega: (data: RegistrarEntregaData) => 
        api.post<ApiResponse<EntregaDistribuidor>>('/inventario/entregas', data).then(r => r.data.data as EntregaDistribuidor),

    listarEntregasPendientes: (estacionId: string) =>
        api.get<ApiResponse<EntregaDistribuidor[]>>('/inventario/entregas/pendientes', { params: { estacionId } }).then(r => r.data.data || []),

    confirmarEntrega: (entregaId: string, data: ConfirmarEntregaData) =>
        api.post<ApiResponse<ConfirmarEntregaResult> & { alerta?: string }>(`/inventario/entregas/${entregaId}/confirmar`, data)
            .then(r => ({
                ...(r.data.data as ConfirmarEntregaResult),
                alerta: r.data.alerta ?? r.data.data?.alerta,
            } as ConfirmarEntregaResult)),
    
    registrarTransaccion: (data: RegistrarTransaccionData) => 
        api.post<ApiResponse<TransaccionCombustible> & { alerta?: string; pricing?: ResolvedTransactionPricing }>('/inventario/transacciones', data)
            .then(r => ({
                transaccion: r.data.data as TransaccionCombustible,
                alerta: r.data.alerta,
                pricing: r.data.pricing,
            } as RegistrarTransaccionResult)),
    
    cierreTurno: (data: CierreTurnoData) => 
        api.post<ApiResponse<CierreTurnoResult>>('/inventario/cierre-turno', data).then(r => r.data.data as CierreTurnoResult),
};
