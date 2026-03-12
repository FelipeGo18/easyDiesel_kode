import { Router } from 'express';
import {
    obtenerUsuariosHandler,
    obtenerUsuarioPorIdHandler,
    crearUsuarioHandler,
    actualizarUsuarioHandler,
    desactivarUsuarioHandler,
    obtenerRolesHandler,
} from '../controllers/usuario.controller';

const usuarioRouter = Router();

// ==========================================
// NOTA: Estas rutas deben estar protegidas.
// Se asume que en routes/index.ts se aplica 
// el middleware de autenticación y rol 'admin'
// ==========================================

/**
 * @swagger
 * /api/usuarios:
 *   get:
 *     summary: Lista todos los usuarios del sistema (Admin)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 */
usuarioRouter.get('/', obtenerUsuariosHandler);

/**
 * @swagger
 * /api/usuarios/roles:
 *   get:
 *     summary: Lista todos los roles del sistema
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de roles
 */
// NOTE: Must be declared before GET /:id to avoid Express matching 'roles' as an id param
usuarioRouter.get('/roles', obtenerRolesHandler);

/**
 * @swagger
 * /api/usuarios/{id}:
 *   get:
 *     summary: Obtiene detalles de un usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Detalles del usuario (Admin)
 */
usuarioRouter.get('/:id', obtenerUsuarioPorIdHandler);

/**
 * @swagger
 * /api/usuarios:
 *   post:
 *     summary: Crea un administrador u otro rol
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, nombre]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *               nombre: { type: string }
 *               rolId: { type: string }
 *     responses:
 *       201:
 *         description: Usuario creado
 */
usuarioRouter.post('/', crearUsuarioHandler);

/**
 * @swagger
 * /api/usuarios/{id}:
 *   put:
 *     summary: Actualiza la información y/o rol de un usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Usuario actualizado
 */
usuarioRouter.put('/:id', actualizarUsuarioHandler);

/**
 * @swagger
 * /api/usuarios/{id}:
 *   delete:
 *     summary: Desactiva un usuario (Soft Delete)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Usuario desactivado
 */
usuarioRouter.delete('/:id', desactivarUsuarioHandler);

export default usuarioRouter;
