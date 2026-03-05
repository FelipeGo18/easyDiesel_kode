import { z } from 'zod';

export const crearPrecioSchema = z.object({
    tipoCombustible: z.enum(['ACPM', 'GASOLINA_CORRIENTE', 'GASOLINA_EXTRA']),
    tipoServicio: z.enum(['PARTICULAR', 'PUBLICO', 'DIPLOMATICO', 'OFICIAL', 'CARGA']),
    zonaId: z.string().uuid('ID de zona invalido'),
    precioGalon: z.number().positive('El precio debe ser mayor a 0'),
    subsidioGalon: z.number().min(0).default(0),
    decretoId: z.string().uuid('ID de decreto invalido'),
    vigenciaDesde: z.string().datetime({ message: 'Fecha de inicio invalida (ISO 8601)' }),
    vigenciaHasta: z.string().datetime({ message: 'Fecha de fin invalida (ISO 8601)' }).optional().nullable(),
});

export const actualizarPrecioSchema = crearPrecioSchema.partial();

export type CrearPrecioInput = z.infer<typeof crearPrecioSchema>;
export type ActualizarPrecioInput = z.infer<typeof actualizarPrecioSchema>;
