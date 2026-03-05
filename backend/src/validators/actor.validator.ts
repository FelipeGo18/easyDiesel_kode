import { z } from 'zod';

// ----- Estaciones de Servicio -----
export const crearEstacionSchema = z.object({
    nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    nit: z.string().min(5, 'El NIT debe ser válido'),
    direccion: z.string().min(5, 'La dirección es requerida'),
    ciudad: z.string().min(3, 'La ciudad es requerida'),
    departamento: z.string().min(3, 'El departamento es requerido'),
    codigoSicom: z.string().min(4, 'Código SICOM requerido'),
    latitud: z.number().optional().nullable(),
    longitud: z.number().optional().nullable(),
    zonaId: z.string().uuid('ID de zona inválido'),
});

export const actualizarEstacionSchema = crearEstacionSchema.partial();

// ----- Distribuidores -----
export const crearDistribuidorSchema = z.object({
    nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    nit: z.string().min(5, 'El NIT debe ser válido'),
    tipo: z.enum(['MAYORISTA', 'REGULADO']),
    direccion: z.string().min(5, 'La dirección es requerida'),
    ciudad: z.string().min(3, 'La ciudad es requerida'),
    departamento: z.string().min(3, 'El departamento es requerido'),
});

export const actualizarDistribuidorSchema = crearDistribuidorSchema.partial();

export type CrearEstacionInput = z.infer<typeof crearEstacionSchema>;
export type ActualizarEstacionInput = z.infer<typeof actualizarEstacionSchema>;
export type CrearDistribuidorInput = z.infer<typeof crearDistribuidorSchema>;
export type ActualizarDistribuidorInput = z.infer<typeof actualizarDistribuidorSchema>;
