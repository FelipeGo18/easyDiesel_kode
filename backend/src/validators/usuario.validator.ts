import { z } from 'zod';

// Esquema base sin contraseñas para creación rápida o actualización
export const crearUsuarioSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').optional(), // Opcional, si no viene, se podría auto-generar
    nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
    rolId: z.string().uuid('ID de rol inválido').optional(),
    estacionId: z.string().uuid('ID de estación inválido').optional().nullable(),
    distribuidorId: z.string().uuid('ID de distribuidor inválido').optional().nullable(),
});

export const actualizarUsuarioSchema = crearUsuarioSchema.partial();

export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>;
export type ActualizarUsuarioInput = z.infer<typeof actualizarUsuarioSchema>;
