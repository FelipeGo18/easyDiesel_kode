import { z } from 'zod';

export const generarReporteSchema = z.object({
    tipo: z.enum(['INVENTARIO', 'TRANSACCIONES', 'PRECIOS', 'AUDITORIA', 'NORMATIVO']),
    formato: z.enum(['PDF', 'EXCEL', 'CSV']).default('PDF'),
    parametros: z.object({
        estacionId: z.string().uuid().optional(),
        zonaId: z.string().uuid().optional(),
        tipoCombustible: z.enum(['ACPM', 'GASOLINA_CORRIENTE', 'GASOLINA_EXTRA']).optional(),
        fechaDesde: z.string().datetime().optional(),
        fechaHasta: z.string().datetime().optional(),
    }).optional(),
});

export type GenerarReporteInput = z.infer<typeof generarReporteSchema>;
