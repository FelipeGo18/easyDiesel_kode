import { z } from 'zod';

export const crearDecretoSchema = z.object({
    numero: z.string().min(1, 'El numero del decreto es requerido'),
    titulo: z.string().min(5, 'El titulo debe tener al menos 5 caracteres'),
    descripcion: z.string().optional().nullable(),
    entidad: z.string().optional().nullable(),
    fechaExpedicion: z.string().datetime({ message: 'Fecha de expedicion invalida (ISO 8601)' }),
    fechaVigencia: z.string().datetime({ message: 'Fecha de vigencia invalida (ISO 8601)' }),
    documentoUrl: z.string().url('URL del documento invalida').optional().nullable(),
});

export const actualizarDecretoSchema = crearDecretoSchema.partial();

export type CrearDecretoInput = z.infer<typeof crearDecretoSchema>;
export type ActualizarDecretoInput = z.infer<typeof actualizarDecretoSchema>;
