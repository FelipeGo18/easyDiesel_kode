import { Request, Response } from 'express';
import { usuarioService } from '../services/usuario.service';
import { crearUsuarioSchema, actualizarUsuarioSchema } from '../validators/usuario.validator';

export const obtenerUsuariosHandler = async (req: Request, res: Response) => {
    try {
        const search = req.query.search as string | undefined;
        const page = req.query.page ? Number(req.query.page) : undefined;
        const limit = req.query.limit ? Number(req.query.limit) : undefined;
        const result = await usuarioService.obtenerUsuarios({ search, page, limit });
        res.json({ success: true, ...result });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error interno o de base de datos', error: error.message });
    }
};

export const obtenerUsuarioPorIdHandler = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const usuario = await usuarioService.obtenerUsuarioPorId(id);
        res.json({ success: true, data: usuario });
    } catch (error: any) {
        res.status(404).json({ success: false, message: error.message });
    }
};

export const crearUsuarioHandler = async (req: Request, res: Response) => {
    try {
        const validData = crearUsuarioSchema.parse(req.body);
        const nuevoUsuario = await usuarioService.crearUsuario(validData, {
            usuarioId: (req as any).user?.userId || 'sistema',
            ip: req.ip || '127.0.0.1',
            userAgent: req.get('user-agent')
        });
        res.status(201).json({ success: true, message: 'Usuario creado', data: nuevoUsuario });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            res.status(400).json({ success: false, errors: error.errors });
        } else {
            res.status(400).json({ success: false, message: error.message });
        }
    }
};

export const actualizarUsuarioHandler = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const validData = actualizarUsuarioSchema.parse(req.body);

        // Si no hay body que actualizar
        if (Object.keys(validData).length === 0) {
            return res.status(400).json({ success: false, message: 'No hay datos válidos para actualizar' });
        }

        const usuario = await usuarioService.actualizarUsuario(id, validData, {
            usuarioId: (req as any).user?.userId || 'sistema',
            ip: req.ip || '127.0.0.1',
            userAgent: req.get('user-agent')
        });
        res.json({ success: true, message: 'Usuario actualizado', data: usuario });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            res.status(400).json({ success: false, errors: error.errors });
        } else {
            res.status(400).json({ success: false, message: error.message });
        }
    }
};

export const obtenerRolesHandler = async (_req: Request, res: Response) => {
    try {
        const roles = await usuarioService.obtenerRoles();
        res.json({ success: true, data: roles });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error al obtener roles', error: error.message });
    }
};

export const desactivarUsuarioHandler = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const resultado = await usuarioService.desactivarUsuario(id, {
            usuarioId: (req as any).user?.userId || 'sistema',
            ip: req.ip || '127.0.0.1',
            userAgent: req.get('user-agent')
        });
        res.json({ success: true, message: 'Usuario desactivado', data: resultado });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};
