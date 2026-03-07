import api from './api';
import type { ApiResponse, EstacionServicio, Distribuidor } from '@/types';

/* ── Estaciones ── */
export const estacionesService = {
    getAll: () => 
        api.get<ApiResponse<EstacionServicio[]>>('/actores/estaciones').then(r => r.data.data ?? []),
    getById: (id: string) => 
        api.get<ApiResponse<EstacionServicio>>(`/actores/estaciones/${id}`).then(r => r.data.data as EstacionServicio),
    create: (data: Partial<EstacionServicio>) => 
        api.post<ApiResponse<EstacionServicio>>('/actores/estaciones', data).then(r => r.data.data as EstacionServicio),
    update: (id: string, data: Partial<EstacionServicio>) => 
        api.put<ApiResponse<EstacionServicio>>(`/actores/estaciones/${id}`, data).then(r => r.data.data as EstacionServicio),
};

/* ── Distribuidores ── */
export const distribuidoresService = {
    getAll: () => 
        api.get<ApiResponse<Distribuidor[]>>('/actores/distribuidores').then(r => r.data.data ?? []),
    getById: (id: string) => 
        api.get<ApiResponse<Distribuidor>>(`/actores/distribuidores/${id}`).then(r => r.data.data as Distribuidor),
    create: (data: Partial<Distribuidor>) => 
        api.post<ApiResponse<Distribuidor>>('/actores/distribuidores', data).then(r => r.data.data as Distribuidor),
    update: (id: string, data: Partial<Distribuidor>) => 
        api.put<ApiResponse<Distribuidor>>(`/actores/distribuidores/${id}`, data).then(r => r.data.data as Distribuidor),
};
