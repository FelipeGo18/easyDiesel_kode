import { z } from 'zod';

export const registrarEntregaSchema = z.object({
    distribuidorId: z.string().uuid('ID de distribuidor inválido'),
    estacionId: z.string().uuid('ID de estación inválido'),
    tanqueId: z.string().uuid('ID de tanque inválido'),
    tipoCombustible: z.enum(['ACPM', 'GASOLINA_CORRIENTE', 'GASOLINA_EXTRA']),
    galones: z.number().positive('La cantidad de galones debe ser mayor a 0'),
    precioUnitario: z.number().positive('El precio unitario debe ser mayor a 0'),
    numeroRemision: z.string().min(3, 'Número de remisión requerido'),
    fechaEntrega: z.string().datetime({ message: 'Fecha de entrega inválida (ISO 8601)' })
});

export const registrarTransaccionSchema = z.object({
    estacionId: z.string().uuid('ID de estación inválido'),
    tanqueId: z.string().uuid('ID de tanque inválido'),
    tipoCombustible: z.enum(['ACPM', 'GASOLINA_CORRIENTE', 'GASOLINA_EXTRA']),
    tipoServicio: z.enum(['PARTICULAR', 'PUBLICO', 'DIPLOMATICO', 'OFICIAL', 'CARGA']),
    galones: z.number().positive('La cantidad de galones debe ser mayor a 0'),
    precioUnitario: z.number().positive('El precio unitario debe ser mayor a 0'),
    placaVehiculo: z.string().optional().nullable(),
    decretoAplicado: z.string().optional().nullable(),
    subsidioAplicado: z.boolean().default(false)
});

export type RegistrarEntregaInput = z.infer<typeof registrarEntregaSchema>;
export type RegistrarTransaccionInput = z.infer<typeof registrarTransaccionSchema>;
