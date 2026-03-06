import api from './api';

export interface DashboardSummary {
    usuarios: { total: number; activos: number };
    estaciones: number;
    distribuidores: number;
    inventario: {
        tanques: number;
        tanquesEnAlerta: number;
        alertas: any[];
    };
    operaciones: {
        transacciones: number;
        entregas: number;
        recientes: any[];
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
        api.get<any>('/dashboard/resumen').then(r => r.data.data as DashboardSummary),
};
