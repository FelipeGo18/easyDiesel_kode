import { z } from 'zod';

export const crearZonaSchema = z.object({
    nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    tipoZona: z.enum(['INTERCONECTADA', 'NO_INTERCONECTADA']).default('INTERCONECTADA'),
    departamentos: z.array(z.string()).min(1, 'Debe incluir al menos un departamento'),
    descripcion: z.string().optional().nullable(),
});

export const actualizarZonaSchema = crearZonaSchema.partial();

export type CrearZonaInput = z.infer<typeof crearZonaSchema>;
export type ActualizarZonaInput = z.infer<typeof actualizarZonaSchema>;
