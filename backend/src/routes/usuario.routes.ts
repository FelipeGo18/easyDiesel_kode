import { Router } from 'express';
import {
    obtenerUsuariosHandler,
    obtenerUsuarioPorIdHandler,
    crearUsuarioHandler,
    actualizarUsuarioHandler,
    desactivarUsuarioHandler
} from '../controllers/usuario.controller';

const usuarioRouter = Router();

// ==========================================
// NOTA: Estas rutas deben estar protegidas.
// Se asume que en routes/index.ts se aplica 
// el middleware de autenticación y rol 'admin'
// ==========================================

usuarioRouter.get('/', obtenerUsuariosHandler);
usuarioRouter.get('/:id', obtenerUsuarioPorIdHandler);
usuarioRouter.post('/', crearUsuarioHandler);
usuarioRouter.put('/:id', actualizarUsuarioHandler);
usuarioRouter.delete('/:id', desactivarUsuarioHandler);

export default usuarioRouter;
