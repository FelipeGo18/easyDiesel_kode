import { prisma } from '../utils/prisma';

export class DashboardService {
    /**
     * Retorna un resumen general del sistema para el dashboard administrativo.
     */
    async obtenerResumen() {
        const [
            totalUsuarios,
            usuariosActivos,
            totalEstaciones,
            totalDistribuidores,
            totalTanques,
            totalTransacciones,
            totalEntregas,
            totalZonas,
            totalDecretos,
            totalReportes,
        ] = await Promise.all([
            prisma.usuario.count(),
            prisma.usuario.count({ where: { activo: true } }),
            prisma.estacionServicio.count(),
            prisma.distribuidor.count(),
            prisma.tanque.count(),
            prisma.transaccionCombustible.count(),
            prisma.entregaDistribuidor.count(),
            prisma.zonaDistribucion.count(),
            prisma.decretoNormativo.count({ where: { activo: true } }),
            prisma.reporte.count(),
        ]);

        // Transacciones recientes (ultimas 10)
        const transaccionesRecientes = await prisma.transaccionCombustible.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                estacion: { select: { nombre: true } },
                tanque: { select: { nombre: true, tipoCombustible: true } },
            }
        });

        // Tanques con nivel bajo (por debajo del minimo)
        const tanquesAlerta = await prisma.$queryRaw`
            SELECT t.id, t.nombre, t."nivel_actual", t."nivel_minimo", t."capacidad_galones", t."tipo_combustible",
                   es.nombre as estacion_nombre
            FROM tanques t
            JOIN estaciones_servicio es ON t."estacion_id" = es.id
            WHERE t."nivel_actual" <= t."nivel_minimo" AND t.activo = true
        ` as any[];

        // Precios vigentes activos
        const preciosActivos = await prisma.precioVigente.count({ where: { activo: true } });

        return {
            usuarios: { total: totalUsuarios, activos: usuariosActivos },
            estaciones: totalEstaciones,
            distribuidores: totalDistribuidores,
            inventario: {
                tanques: totalTanques,
                tanquesEnAlerta: tanquesAlerta.length,
                alertas: tanquesAlerta,
            },
            operaciones: {
                transacciones: totalTransacciones,
                entregas: totalEntregas,
                recientes: transaccionesRecientes,
            },
            normativa: {
                zonas: totalZonas,
                decretos: totalDecretos,
                preciosActivos,
            },
            reportes: totalReportes,
        };
    }
}

export const dashboardService = new DashboardService();
