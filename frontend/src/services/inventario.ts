import api from './api';
import type { ApiResponse, Tanque, EntregaDistribuidor, TransaccionCombustible, CierreTurnoResult, TipoCombustible, TipoServicio } from '@/types';

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
    
    registrarTransaccion: (data: RegistrarTransaccionData) => 
        api.post<ApiResponse<TransaccionCombustible>>('/inventario/transacciones', data).then(r => r.data.data as TransaccionCombustible),
    
    cierreTurno: (data: CierreTurnoData) => 
        api.post<ApiResponse<CierreTurnoResult>>('/inventario/cierre-turno', data).then(r => r.data.data as CierreTurnoResult),
};
