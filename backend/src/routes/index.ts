import { Router } from 'express';
import { authRouter } from './auth.routes';
import usuarioRouter from './usuario.routes';
import actorRouter from './actor.routes';
import tanqueRouter from './tanque.routes';
import inventarioRouter from './inventario.routes';
import { auth, authorize } from '../middleware/auth';

const router = Router();

// Rutas Publicas
router.use('/auth', authRouter);

// Rutas Protegidas (todas las siguientes requieren estar autenticado)
router.use(auth);

// Modulo 2: Usuarios y Actores
router.use('/usuarios', authorize('admin'), usuarioRouter);
router.use('/actores', authorize('admin', 'regulador'), actorRouter);

// Modulo 3: Inventario y Tanques
router.use('/tanques', authorize('admin', 'estacion'), tanqueRouter);
router.use('/inventario', authorize('admin', 'estacion'), inventarioRouter);

// Modulo 4: Precios y Zonas
// router.use('/precios', preciosRouter);
// router.use('/zonas', zonasRouter);

// Modulo 5: Normativa
// router.use('/normativa', normativaRouter);

// Modulo 6: Reportes
// router.use('/reportes', reportesRouter);

// Modulo 7: Auditoria
// router.use('/auditoria', auditoriaRouter);

// Modulo 8: Dashboard
// router.use('/dashboard', dashboardRouter);

export { router };
