import api from './api';
import type { EstacionServicio, Distribuidor } from '@/types';

/* ── Estaciones ── */
export const estacionesService = {
    getAll: () => 
        api.get<any>('/actores/estaciones').then(r => r.data.data as EstacionServicio[]),
    getById: (id: string) => 
        api.get<any>(`/actores/estaciones/${id}`).then(r => r.data.data as EstacionServicio),
    create: (data: Partial<EstacionServicio>) => 
        api.post<any>('/actores/estaciones', data).then(r => r.data.data as EstacionServicio),
    update: (id: string, data: Partial<EstacionServicio>) => 
        api.put<any>(`/actores/estaciones/${id}`, data).then(r => r.data.data as EstacionServicio),
};

/* ── Distribuidores ── */
export const distribuidoresService = {
    getAll: () => 
        api.get<any>('/actores/distribuidores').then(r => r.data.data as Distribuidor[]),
    getById: (id: string) => 
        api.get<any>(`/actores/distribuidores/${id}`).then(r => r.data.data as Distribuidor),
    create: (data: Partial<Distribuidor>) => 
        api.post<any>('/actores/distribuidores', data).then(r => r.data.data as Distribuidor),
    update: (id: string, data: Partial<Distribuidor>) => 
        api.put<any>(`/actores/distribuidores/${id}`, data).then(r => r.data.data as Distribuidor),
};
