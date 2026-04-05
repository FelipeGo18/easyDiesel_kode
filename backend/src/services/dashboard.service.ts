import { prisma } from '../utils/prisma';

export class DashboardService {
    /**
     * Retorna un resumen general del sistema para el dashboard administrativo.
     * Queries agrupadas en lotes para no saturar el pool de conexiones de Supabase.
     */
    async obtenerResumen() {
        // Lote 1: conteos de entidades principales (4 queries)
        const [
            totalEstaciones,
            totalTransacciones,
            totalEntregas,
            totalReportes,
        ] = await Promise.all([
            prisma.estacionServicio.count(),
            prisma.transaccionCombustible.count(),
            prisma.entregaDistribuidor.count(),
            prisma.reporte.count(),
        ]);

        // Lote 2: transacciones recientes + tanques en alerta (2 queries)
        const [transaccionesRecientes, tanquesAlerta] = await Promise.all([
            prisma.transaccionCombustible.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    estacion: { select: { nombre: true } },
                    tanque: { select: { nombre: true, tipoCombustible: true } },
                }
            }),
            prisma.$queryRaw`
                SELECT t.id, t.nombre, t."nivel_actual", t."nivel_minimo", t."capacidad_galones", t."tipo_combustible",
                       es.nombre as estacion_nombre
                FROM tanques t
                JOIN estaciones_servicio es ON t."estacion_id" = es.id
                WHERE t."nivel_actual" <= t."nivel_minimo" AND t.activo = true
            ` as Promise<any[]>,
        ]);

        return {
            usuarios: { total: 0, activos: 0 },
            estaciones: totalEstaciones,
            distribuidores: 0,
            inventario: {
                tanques: 0,
                tanquesEnAlerta: (tanquesAlerta as any[]).length,
                alertas: tanquesAlerta as any[],
            },
            operaciones: {
                transacciones: totalTransacciones,
                entregas: totalEntregas,
                recientes: transaccionesRecientes,
            },
            normativa: {
                zonas: 0,
                decretos: 0,
                preciosActivos: 0,
            },
            reportes: totalReportes,
        };
    }
}

export const dashboardService = new DashboardService();
