import { z } from 'zod';

export const registrarEntregaSchema = z.object({
    distribuidorId: z.string().uuid('ID de distribuidor inválido'),
    estacionId: z.string().uuid('ID de estación inválido'),
    tanqueId: z.preprocess(
        (val) => (val === '' ? null : val),
        z.string().min(1, 'ID de tanque requerido').nullable().optional()
    ),
    tipoCombustible: z.enum(['ACPM', 'GASOLINA_CORRIENTE', 'GASOLINA_EXTRA']),
    galones: z.number().positive('La cantidad de galones debe ser mayor a 0'),
    precioUnitario: z.number().positive('El precio unitario debe ser mayor a 0'),
    numeroRemision: z.string().min(3, 'Número de remisión requerido'),
    fechaEntrega: z.string().datetime({ message: 'Fecha de entrega inválida (ISO 8601)' })
});

export const confirmarEntregaSchema = z.object({
    entregaId: z.string().uuid('ID de entrega inválido'),
    estacionId: z.string().uuid('ID de estación inválido'),
    tanqueId: z.string().min(1, 'ID de tanque requerido'),
    galonesRecibidos: z.number().positive('La cantidad de galones recibidos debe ser mayor a 0'),
});

export const registrarTransaccionSchema = z.object({
    estacionId: z.string().uuid('ID de estación inválido'),
    tanqueId: z.string().min(1, 'ID de tanque requerido'),
    tipoCombustible: z.enum(['ACPM', 'GASOLINA_CORRIENTE', 'GASOLINA_EXTRA']),
    tipoServicio: z.enum(['PARTICULAR', 'PUBLICO', 'DIPLOMATICO', 'OFICIAL', 'CARGA']),
    galones: z.number().positive('La cantidad de galones debe ser mayor a 0'),
    precioUnitario: z.number().positive('El precio unitario debe ser mayor a 0').optional(),
    placaVehiculo: z.string().optional().nullable(),
    decretoAplicado: z.string().optional().nullable(),
    subsidioAplicado: z.boolean().default(false),
    esGranConsumidor: z.boolean().optional(),
});

export const cierreTurnoSchema = z.object({
    estacionId: z.string().uuid('ID de estación inválido'),
    tanqueId: z.string().min(1, 'ID de tanque requerido'),
    nivelFisico: z.number().nonnegative('El nivel físico debe ser mayor o igual a 0'),
    observaciones: z.string().optional()
});

export type RegistrarEntregaInput = z.infer<typeof registrarEntregaSchema>;
export type ConfirmarEntregaInput = z.infer<typeof confirmarEntregaSchema>;
export type RegistrarTransaccionInput = z.infer<typeof registrarTransaccionSchema>;
export type CierreTurnoInput = z.infer<typeof cierreTurnoSchema>;

export const entradaDirectaSchema = z.object({
    estacionId: z.string().uuid('ID de estación inválido'),
    tanqueId: z.string().min(1, 'ID de tanque requerido'),
    tipoCombustible: z.enum(['ACPM', 'GASOLINA_CORRIENTE', 'GASOLINA_EXTRA']),
    galones: z.number().positive('La cantidad de galones debe ser mayor a 0'),
    precioUnitario: z.number().positive('El precio unitario debe ser mayor a 0'),
    observaciones: z.string().optional(),
});

export type EntradaDirectaInput = z.infer<typeof entradaDirectaSchema>;
