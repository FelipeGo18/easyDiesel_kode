import api from './api';

/* ── Types ── */
export interface Zona {
    id: string;
    nombre: string;
    tipoZona: 'INTERCONECTADA' | 'NO_INTERCONECTADA';
    departamentos: string[];
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
}

/* ── Zonas ── */
export const zonasService = {
    getAll: () => api.get<any>('/zonas').then(r => r.data.data as Zona[]),
    getById: (id: string) => api.get<any>(`/zonas/${id}`).then(r => r.data.data as Zona),
    create: (data: Partial<Zona>) => api.post<any>('/zonas', data).then(r => r.data.data as Zona),
    update: (id: string, data: Partial<Zona>) => api.put<any>(`/zonas/${id}`, data).then(r => r.data.data as Zona),
};

/* ── Decretos ── */
export const decretosService = {
    getAll: () => api.get<any>('/decretos').then(r => r.data.data as Decreto[]),
    getById: (id: string) => api.get<any>(`/decretos/${id}`).then(r => r.data.data as Decreto),
    create: (data: Partial<Decreto>) => api.post<any>('/decretos', data).then(r => r.data.data as Decreto),
    update: (id: string, data: Partial<Decreto>) => api.put<any>(`/decretos/${id}`, data).then(r => r.data.data as Decreto),
};

/* ── Precios ── */
export const preciosService = {
    getAll: (params?: Record<string, string>) => api.get<any>('/precios', { params }).then(r => r.data.data as Precio[]),
    getById: (id: string) => api.get<any>(`/precios/${id}`).then(r => r.data.data as Precio),
    create: (data: Partial<Precio>) => api.post<any>('/precios', data).then(r => r.data.data as Precio),
    update: (id: string, data: Partial<Precio>) => api.put<any>(`/precios/${id}`, data).then(r => r.data.data as Precio),
};

/* ── Usuarios ── */
export const usuariosService = {
    getAll: () => api.get<any>('/usuarios').then(r => r.data.data as Usuario[]),
    getById: (id: string) => api.get<any>(`/usuarios/${id}`).then(r => r.data.data as Usuario),
    create: (data: Record<string, any>) => api.post<any>('/usuarios', data).then(r => r.data.data as Usuario),
    update: (id: string, data: Record<string, any>) => api.put<any>(`/usuarios/${id}`, data).then(r => r.data.data as Usuario),
    deactivate: (id: string) => api.delete<any>(`/usuarios/${id}`).then(r => r.data.data),
};

/* ── Roles (para selectores) ── */
export const rolesService = {
    getAll: () => api.get<any>('/usuarios/roles').then(r => r.data.data as Rol[]),
};
