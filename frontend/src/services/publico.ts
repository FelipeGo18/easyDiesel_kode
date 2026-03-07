import { api } from './api';

export interface PublicZona {
    id: string;
    nombre: string;
    tipoZona: 'INTERCONECTADA' | 'NO_INTERCONECTADA';
    departamentos: string[];
    municipios: string[];
}

export interface PublicPrecio {
    id: string;
    zonaId: string;
    tipoCombustible: string;
    tipoServicio: string;
    precioGalon: number;
    subsidioGalon: number;
    decreto?: { numero: string; titulo: string };
}

export interface PublicStation {
    id: string;
    nombre: string;
    direccion: string;
    ciudad: string;
    departamento: string;
    codigoSicom: string;
    zonaId: string;
    latitud: number | null;
    longitud: number | null;
    combustibles: string[];
    zona?: { id: string; nombre: string };
}

export const publicoService = {
    getZonas: () => api.get('/publico/zonas').then((response) => response.data.data as PublicZona[]),
    getPrecios: () => api.get('/publico/precios').then((response) => response.data.data as PublicPrecio[]),
    getEstaciones: (params?: { zonaId?: string; soloConCoordenadas?: boolean }) =>
        api.get('/publico/estaciones', { params }).then((response) => response.data.data as PublicStation[]),
    getEstacionesCercanas: (params: { latitud: number; longitud: number; radioMetros?: number; limite?: number }) =>
        api.get('/publico/estaciones-cercanas', { params }).then((response) => response.data.data as PublicStation[]),
};