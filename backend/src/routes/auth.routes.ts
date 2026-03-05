import { Router } from 'express';
import { registerHandler, loginHandler, meHandler } from '../controllers/auth.controller';
import { auth } from '../middleware/auth';

const authRouter = Router();

// ── Rutas públicas ─────────────────────────────────────

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registra un nuevo usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, nombre, apellido]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               nombre:
 *                 type: string
 *               apellido:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       400:
 *         description: Error de validación o email ya existe
 */
authRouter.post('/register', registerHandler);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Inicia sesión de usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso, retorna JWT
 *       400:
 *         description: Credenciales inválidas
 */
authRouter.post('/login', loginHandler);

// ── Rutas protegidas ───────────────────────────────────

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obtiene el perfil del usuario autenticado
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *       401:
 *         description: No autenticado
 */
authRouter.get('/me', auth, meHandler);

export { authRouter };
