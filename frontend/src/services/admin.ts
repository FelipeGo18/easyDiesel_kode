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
    getAll: () => api.get<Zona[]>('/zonas').then(r => r.data),
    getById: (id: string) => api.get<Zona>(`/zonas/${id}`).then(r => r.data),
    create: (data: Partial<Zona>) => api.post<Zona>('/zonas', data).then(r => r.data),
    update: (id: string, data: Partial<Zona>) => api.put<Zona>(`/zonas/${id}`, data).then(r => r.data),
};

/* ── Decretos ── */
export const decretosService = {
    getAll: () => api.get<Decreto[]>('/decretos').then(r => r.data),
    getById: (id: string) => api.get<Decreto>(`/decretos/${id}`).then(r => r.data),
    create: (data: Partial<Decreto>) => api.post<Decreto>('/decretos', data).then(r => r.data),
    update: (id: string, data: Partial<Decreto>) => api.put<Decreto>(`/decretos/${id}`, data).then(r => r.data),
};

/* ── Precios ── */
export const preciosService = {
    getAll: (params?: Record<string, string>) => api.get<Precio[]>('/precios', { params }).then(r => r.data),
    getById: (id: string) => api.get<Precio>(`/precios/${id}`).then(r => r.data),
    create: (data: Partial<Precio>) => api.post<Precio>('/precios', data).then(r => r.data),
    update: (id: string, data: Partial<Precio>) => api.put<Precio>(`/precios/${id}`, data).then(r => r.data),
};

/* ── Usuarios ── */
export const usuariosService = {
    getAll: () => api.get<Usuario[]>('/usuarios').then(r => r.data),
    getById: (id: string) => api.get<Usuario>(`/usuarios/${id}`).then(r => r.data),
    create: (data: Record<string, any>) => api.post<Usuario>('/usuarios', data).then(r => r.data),
    update: (id: string, data: Record<string, any>) => api.put<Usuario>(`/usuarios/${id}`, data).then(r => r.data),
    deactivate: (id: string) => api.delete(`/usuarios/${id}`).then(r => r.data),
};

/* ── Roles (para selectores) ── */
export const rolesService = {
    getAll: () => api.get<Rol[]>('/usuarios/roles').then(r => r.data),
};
