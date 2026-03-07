import api from './api';
import type { ApiResponse } from '@/types';

/* ── Types ── */
export interface Zona {
    id: string;
    nombre: string;
    tipoZona: 'INTERCONECTADA' | 'NO_INTERCONECTADA';
    departamentos: string[];
    municipios?: string[];
    descripcion: string | null;
    _count?: { estaciones: number; precios: number };
}

export interface Decreto {
    id: string;
    numero: string;
    titulo: string;
    descripcion: string | null;
    entidad: string | null;
    fechaExpedicion: string;
    fechaVigencia: string;
    activo: boolean;
    documentoUrl: string | null;
}

export interface Precio {
    id: string;
    tipoCombustible: string;
    tipoServicio: string;
    zonaId: string;
    precioGalon: number;
    subsidioGalon: number;
    decretoId: string;
    vigenciaDesde: string;
    vigenciaHasta: string | null;
    activo: boolean;
    zona?: { nombre: string; tipoZona: string };
    decreto?: { numero: string; titulo: string };
}

export interface Usuario {
    id: string;
    email: string;
    nombre: string;
    activo: boolean;
    authProvider: string;
    fotoUrl: string | null;
    rol: { id: string; nombre: string; descripcion?: string };
    estacionGestionada?: { id: string; nombre: string } | null;
    distribuidorGestionado?: { id: string; nombre: string } | null;
    createdAt: string;
}

export interface Rol {
    id: string;
    nombre: string;
    descripcion: string | null;
    permisos?: string[];
}

/* ── Zonas ── */
export const zonasService = {
    getAll: () => api.get<ApiResponse<Zona[]>>('/zonas').then(r => r.data.data ?? []),
    getById: (id: string) => api.get<ApiResponse<Zona>>(`/zonas/${id}`).then(r => r.data.data as Zona),
    create: (data: Partial<Zona>) => api.post<ApiResponse<Zona>>('/zonas', data).then(r => r.data.data as Zona),
    update: (id: string, data: Partial<Zona>) => api.put<ApiResponse<Zona>>(`/zonas/${id}`, data).then(r => r.data.data as Zona),
};

/* ── Decretos ── */
export const decretosService = {
    getAll: () => api.get<ApiResponse<Decreto[]>>('/decretos').then(r => r.data.data ?? []),
    getById: (id: string) => api.get<ApiResponse<Decreto>>(`/decretos/${id}`).then(r => r.data.data as Decreto),
    create: (data: Partial<Decreto>) => api.post<ApiResponse<Decreto>>('/decretos', data).then(r => r.data.data as Decreto),
    update: (id: string, data: Partial<Decreto>) => api.put<ApiResponse<Decreto>>(`/decretos/${id}`, data).then(r => r.data.data as Decreto),
};

/* ── Precios ── */
export const preciosService = {
    getAll: (params?: Record<string, string>) => api.get<ApiResponse<Precio[]>>('/precios', { params }).then(r => r.data.data ?? []),
    getById: (id: string) => api.get<ApiResponse<Precio>>(`/precios/${id}`).then(r => r.data.data as Precio),
    create: (data: Partial<Precio>) => api.post<ApiResponse<Precio>>('/precios', data).then(r => r.data.data as Precio),
    update: (id: string, data: Partial<Precio>) => api.put<ApiResponse<Precio>>(`/precios/${id}`, data).then(r => r.data.data as Precio),
};

/* ── Usuarios ── */
export const usuariosService = {
    getAll: () => api.get<ApiResponse<Usuario[]>>('/usuarios').then(r => r.data.data ?? []),
    getById: (id: string) => api.get<ApiResponse<Usuario>>(`/usuarios/${id}`).then(r => r.data.data as Usuario),
    create: (data: Record<string, unknown>) => api.post<ApiResponse<Usuario>>('/usuarios', data).then(r => r.data.data as Usuario),
    update: (id: string, data: Record<string, unknown>) => api.put<ApiResponse<Usuario>>(`/usuarios/${id}`, data).then(r => r.data.data as Usuario),
    deactivate: (id: string) => api.delete<ApiResponse<boolean>>(`/usuarios/${id}`).then(r => r.data.data),
};

/* ── Roles (para selectores) ── */
export const rolesService = {
    getAll: () => api.get<ApiResponse<Rol[]>>('/usuarios/roles').then(r => r.data.data ?? []),
};
