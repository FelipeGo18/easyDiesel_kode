import api from './api';
import type { ApiResponse, EstacionServicio, Distribuidor } from '@/types';

export interface ActoresPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface PaginatedActoresResult<T> {
    data: T[];
    pagination?: ActoresPagination;
}

/* ── Estaciones ── */
export const estacionesService = {
    getAll: (opts?: { search?: string; page?: number; limit?: number }): Promise<PaginatedActoresResult<EstacionServicio>> =>
        api.get<ApiResponse<EstacionServicio[]> & { pagination?: ActoresPagination }>('/actores/estaciones', { params: opts })
            .then(r => ({ data: (r.data as any).data ?? [], pagination: (r.data as any).pagination })),
    getById: (id: string) =>
        api.get<ApiResponse<EstacionServicio>>(`/actores/estaciones/${id}`).then(r => r.data.data as EstacionServicio),
    create: (data: Partial<EstacionServicio>) =>
        api.post<ApiResponse<EstacionServicio>>('/actores/estaciones', data).then(r => r.data.data as EstacionServicio),
    update: (id: string, data: Partial<EstacionServicio>) =>
        api.put<ApiResponse<EstacionServicio>>(`/actores/estaciones/${id}`, data).then(r => r.data.data as EstacionServicio),
    updateZona: (id: string, zonaId: string) =>
        api.put<ApiResponse<EstacionServicio>>(`/actores/estaciones/${id}/zona`, { zonaId }).then(r => r.data.data as EstacionServicio),
};

/* ── Distribuidores ── */
export const distribuidoresService = {
    getAll: (opts?: { search?: string; page?: number; limit?: number }): Promise<PaginatedActoresResult<Distribuidor>> =>
        api.get<ApiResponse<Distribuidor[]> & { pagination?: ActoresPagination }>('/actores/distribuidores', { params: opts })
            .then(r => ({ data: (r.data as any).data ?? [], pagination: (r.data as any).pagination })),
    getById: (id: string) =>
        api.get<ApiResponse<Distribuidor>>(`/actores/distribuidores/${id}`).then(r => r.data.data as Distribuidor),
    create: (data: Partial<Distribuidor>) =>
        api.post<ApiResponse<Distribuidor>>('/actores/distribuidores', data).then(r => r.data.data as Distribuidor),
    update: (id: string, data: Partial<Distribuidor>) =>
        api.put<ApiResponse<Distribuidor>>(`/actores/distribuidores/${id}`, data).then(r => r.data.data as Distribuidor),
};
