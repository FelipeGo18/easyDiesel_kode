import api from './api';
import type { ApiResponse } from '@/types';

export interface DashboardAlert {
    id: string;
    nombre: string;
    estacion_nombre: string;
    nivel_actual: number | string;
    capacidad_galones: number | string;
    nivel_minimo: number | string;
}

export interface DashboardRecentOperation {
    id: string;
    tipo: 'ENTRADA' | 'SALIDA';
    galones: number | string;
    createdAt: string;
    estacion?: { nombre: string };
    tanque?: { tipoCombustible: string };
}

export interface DashboardSummary {
    usuarios: { total: number; activos: number };
    estaciones: number;
    distribuidores: number;
    inventario: {
        tanques: number;
        tanquesEnAlerta: number;
        alertas: DashboardAlert[];
    };
    operaciones: {
        transacciones: number;
        entregas: number;
        recientes: DashboardRecentOperation[];
    };
    normativa: {
        zonas: number;
        decretos: number;
        preciosActivos: number;
    };
    reportes: number;
}

export const dashboardService = {
    getSummary: () =>
    api.get<ApiResponse<DashboardSummary>>('/dashboard').then(r => r.data.data as DashboardSummary),
};
