import { z } from 'zod';

export const crearTanqueSchema = z.object({
    nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    capacidadGalones: z.number().positive('La capacidad debe ser mayor a 0'),
    nivelMinimo: z.number().min(0, 'El nivel mínimo no puede ser negativo').default(0),
    tipoCombustible: z.enum(['ACPM', 'GASOLINA_CORRIENTE', 'GASOLINA_EXTRA']),
    estacionId: z.string().uuid('ID de estación inválido'),
});

export const actualizarTanqueSchema = crearTanqueSchema.partial();

export type CrearTanqueInput = z.infer<typeof crearTanqueSchema>;
export type ActualizarTanqueInput = z.infer<typeof actualizarTanqueSchema>;
