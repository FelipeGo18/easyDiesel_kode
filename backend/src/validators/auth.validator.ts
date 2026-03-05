import { z } from 'zod';

// ──────────────────────────────────────────
// Schema: Registro de usuario
// ──────────────────────────────────────────
export const registerSchema = z.object({
    email: z
        .string({ required_error: 'El email es obligatorio' })
        .email('Email inválido')
        .max(150, 'El email no puede superar 150 caracteres')
        .transform((v) => v.toLowerCase().trim()),

    password: z
        .string({ required_error: 'La contraseña es obligatoria' })
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .max(72, 'La contraseña no puede superar 72 caracteres'),

    nombre: z
        .string({ required_error: 'El nombre es obligatorio' })
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(100, 'El nombre no puede superar 100 caracteres')
        .trim(),

    apellido: z
        .string({ required_error: 'El apellido es obligatorio' })
        .min(2, 'El apellido debe tener al menos 2 caracteres')
        .max(100, 'El apellido no puede superar 100 caracteres')
        .trim(),

    rolId: z.string().uuid('ID de rol inválido').optional(),
});

// ──────────────────────────────────────────
// Schema: Login
// ──────────────────────────────────────────
export const loginSchema = z.object({
    email: z
        .string({ required_error: 'El email es obligatorio' })
        .email('Email inválido')
        .transform((v) => v.toLowerCase().trim()),

    password: z
        .string({ required_error: 'La contraseña es obligatoria' })
        .min(1, 'La contraseña es obligatoria'),
});

// ──────────────────────────────────────────
// Tipos inferidos
// ──────────────────────────────────────────
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
