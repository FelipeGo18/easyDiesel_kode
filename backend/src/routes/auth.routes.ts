import { Router } from 'express';
import { registerHandler, loginHandler, meHandler, updateProfileHandler, googleCallbackHandler, supabaseLoginHandler, refreshHandler, logoutHandler } from '../controllers/auth.controller';
import { auth } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rate-limit';

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
 *             required: [email, password, nombre]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               nombre:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       400:
 *         description: Error de validación o email ya existe
 */
authRouter.post('/register', authRateLimiter, registerHandler);

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Inicia el flujo de autenticación de Google
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirige a Google
 */
authRouter.get('/google', authRateLimiter, (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    const scope = 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
    res.redirect(authUrl);
});

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Callback de Google OAuth
 *     tags: [Auth]
 *     parameters:
 *       - name: code
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Autenticación exitosa, retorna JWT
 */
authRouter.get('/google/callback', authRateLimiter, async (req, res, next) => {
    const { code } = req.query;
    if (!code) {
        res.status(400).json({ success: false, error: 'Código de Google no proporcionado' });
        return;
    }
    // El resto de la lógica en el controlador
     next();
 }, googleCallbackHandler);

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
authRouter.post('/login', authRateLimiter, loginHandler);

/**
 * @swagger
 * /api/auth/supabase-login:
 *   post:
 *     summary: Login con token de Supabase
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [access_token]
 *             properties:
 *               access_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso
 */
authRouter.post('/supabase-login', authRateLimiter, supabaseLoginHandler);
authRouter.post('/refresh', authRateLimiter, refreshHandler);
authRouter.post('/logout', authRateLimiter, logoutHandler);

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
authRouter.put('/me', auth, updateProfileHandler);

export { authRouter };
