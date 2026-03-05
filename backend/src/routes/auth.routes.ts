import { Router } from 'express';
import { registerHandler, loginHandler, meHandler } from '../controllers/auth.controller';
import { auth } from '../middleware/auth';

const authRouter = Router();

// ── Rutas públicas ─────────────────────────────────────
authRouter.post('/register', registerHandler);
authRouter.post('/login', loginHandler);

// ── Rutas protegidas ───────────────────────────────────
authRouter.get('/me', auth, meHandler);

export { authRouter };
