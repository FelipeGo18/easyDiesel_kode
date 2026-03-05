import { z } from 'zod';

export const generarReporteSchema = z.object({
    tipo: z.enum(['INVENTARIO', 'TRANSACCIONES', 'PRECIOS', 'AUDITORIA', 'NORMATIVO']),
    formato: z.enum(['PDF', 'EXCEL', 'CSV']).default('PDF'),
    periodoInicio: z.string().datetime('Fecha de inicio requerida'),
    periodoFin: z.string().datetime('Fecha de fin requerida'),
    parametros: z.object({
        estacionId: z.string().uuid().optional(),
        zonaId: z.string().uuid().optional(),
        tipoCombustible: z.enum(['ACPM', 'GASOLINA_CORRIENTE', 'GASOLINA_EXTRA']).optional(),
    }).optional(),
});

export type GenerarReporteInput = z.infer<typeof generarReporteSchema>;
