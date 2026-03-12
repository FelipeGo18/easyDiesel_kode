import { z } from 'zod';

// ──────────────────────────────────────────
// Schema: Registro de usuario
// ──────────────────────────────────────────
export const registerSchema = z.object({
    email: z.string().min(1, 'El email es obligatorio')
        .email('Email inválido')
        .max(150, 'El email no puede superar 150 caracteres')
        .transform((v) => v.toLowerCase().trim()),

    password: z.string().min(1, 'La contraseña es obligatoria')
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .max(72, 'La contraseña no puede superar 72 caracteres'),

    nombre: z.string().min(1, 'El nombre completo es obligatorio')
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(150, 'El nombre no puede superar 150 caracteres')
        .trim(),

    rolId: z.string().uuid('ID de rol inválido').optional(),
});

// ──────────────────────────────────────────
// Schema: Login
// ──────────────────────────────────────────
export const loginSchema = z.object({
    email: z.string().min(1, 'El email es obligatorio')
        .email('Email inválido')
        .transform((v) => v.toLowerCase().trim()),

    password: z.string().min(1, 'La contraseña es obligatoria')
        .min(1, 'La contraseña es obligatoria'),
});

export const refreshTokenSchema = z.object({
    refresh_token: z.string().min(20, 'Refresh token inválido'),
});

export const logoutSchema = z.object({
    refresh_token: z.string().min(20, 'Refresh token inválido'),
});

// ──────────────────────────────────────────
// Schema: Actualizar perfil
// ──────────────────────────────────────────
export const updateProfileSchema = z.object({
    nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(150).trim().optional(),
    email: z.string().email('Email inválido').max(150)
        .transform((v) => v.toLowerCase().trim()).optional(),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(72).optional(),
}).refine((v) => v.nombre !== undefined || v.email !== undefined || v.password !== undefined, {
    message: 'Debes proporcionar al menos un campo para actualizar',
});

// ──────────────────────────────────────────
// Tipos inferidos
// ──────────────────────────────────────────
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
