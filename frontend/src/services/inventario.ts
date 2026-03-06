import api from './api';
import type { Tanque, EntregaDistribuidor, TransaccionCombustible, CierreTurnoResult, TipoCombustible, TipoServicio } from '@/types';

/* ── Tanques ── */
export const tanquesService = {
    getAll: (estacionId?: string) => 
        api.get<any>('/tanques', { params: { estacionId } }).then(r => (r.data.data || []) as Tanque[]),
    getById: (id: string) => 
        api.get<any>(`/tanques/${id}`).then(r => r.data.data as Tanque),
    create: (data: Partial<Tanque>) => 
        api.post<any>('/tanques', data).then(r => r.data.data as Tanque),
    update: (id: string, data: Partial<Tanque>) => 
        api.put<any>(`/tanques/${id}`, data).then(r => r.data.data as Tanque),
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
    precioUnitario: number;
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
        api.post<any>('/inventario/entregas', data).then(r => r.data.data as EntregaDistribuidor),
    
    registrarTransaccion: (data: RegistrarTransaccionData) => 
        api.post<any>('/inventario/transacciones', data).then(r => r.data.data as TransaccionCombustible),
    
    cierreTurno: (data: CierreTurnoData) => 
        api.post<any>('/inventario/cierre-turno', data).then(r => r.data.data as CierreTurnoResult),
};
