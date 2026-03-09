import api from './api';
import type { ApiResponse, TipoCombustible, TipoServicio } from '@/types';

export interface PrecioActual {
    id: string;
    tipoCombustible: TipoCombustible;
    tipoServicio: TipoServicio;
    zonaId: string;
    precioGalon: number | string;
    subsidioGalon: number | string;
    activo: boolean;
    vigenciaDesde: string;
    vigenciaHasta: string | null;
    zona: {
        nombre: string;
    };
    decreto: {
        numero: string;
        titulo: string;
    };
}

export const preciosService = {
    consultarActual: (params: { zonaId: string; tipoCombustible: TipoCombustible; tipoServicio: TipoServicio }) =>
        api.get<ApiResponse<PrecioActual>>('/precios/consultar', { params }).then((response) => response.data.data as PrecioActual),
};