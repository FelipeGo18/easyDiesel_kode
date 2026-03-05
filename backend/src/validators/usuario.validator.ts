import { z } from 'zod';

// Esquema base sin contraseñas para creación rápida o actualización
export const crearUsuarioSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').optional(), // Opcional, si no viene, se podría auto-generar
    nombre: z.string().min(2, 'El nombre completo debe tener al menos 2 caracteres'),
    rolId: z.string().uuid('ID de rol inválido').optional(),
});

export const actualizarUsuarioSchema = crearUsuarioSchema.partial();

export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>;
export type ActualizarUsuarioInput = z.infer<typeof actualizarUsuarioSchema>;
