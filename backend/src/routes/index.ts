import { Router } from 'express';
import { authRouter } from './auth.routes';
import { publicoRouter } from './publico.routes';
import usuarioRouter from './usuario.routes';
import actorRouter from './actor.routes';
import tanqueRouter from './tanque.routes';
import inventarioRouter from './inventario.routes';
import zonaRouter from './zona.routes';
import precioRouter from './precio.routes';
import decretoRouter from './decreto.routes';
import auditoriaRouter from './auditoria.routes';
import reporteRouter from './reporte.routes';
import dashboardRouter from './dashboard.routes';
import { auth, authorize } from '../middleware/auth';

const router = Router();

// Rutas Publicas
router.use('/auth', authRouter);
router.use('/publico', publicoRouter);

// Rutas Protegidas (todas las siguientes requieren estar autenticado)
router.use(auth);

// Modulo 2: Usuarios y Actores
router.use('/usuarios', authorize('admin'), usuarioRouter);
router.use('/actores', authorize('admin', 'regulador'), actorRouter);

// Modulo 3: Inventario y Tanques
router.use('/tanques', authorize('admin', 'estacion'), tanqueRouter);
router.use('/inventario', authorize('admin', 'estacion'), inventarioRouter);

// Modulo 4: Precios, Zonas y Normativa
router.use('/zonas', authorize('admin', 'regulador'), zonaRouter);
router.use('/precios', authorize('admin', 'regulador'), precioRouter);
router.use('/decretos', authorize('admin', 'regulador'), decretoRouter);

// Modulo 5: Auditoria (solo lectura para admin y auditor)
router.use('/auditoria', authorize('admin', 'auditor'), auditoriaRouter);

// Modulo 6: Reportes
router.use('/reportes', authorize('admin', 'regulador', 'estacion'), reporteRouter);

// Modulo 7: Dashboard
router.use('/dashboard', authorize('admin'), dashboardRouter);

export { router };
