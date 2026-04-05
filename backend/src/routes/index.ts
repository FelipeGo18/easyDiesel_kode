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
import { auth, can, resolveOwnership } from '../middleware/auth';

const router = Router();

// Rutas Publicas
router.use('/auth', authRouter);
router.use('/publico', publicoRouter);

// Rutas Protegidas (todas las siguientes requieren estar autenticado)
router.use(auth);
router.use(resolveOwnership);

// Modulo 2: Usuarios y Actores
router.use('/usuarios', can('usuarios:leer', 'usuarios:escribir'), usuarioRouter);
router.use('/actores', can('actores:leer', 'actores:escribir'), actorRouter);

// Modulo 3: Inventario y Tanques
router.use('/tanques', can('tanques:leer', 'tanques:escribir'), tanqueRouter);
router.use('/inventario', can('inventario:leer', 'inventario:escribir'), inventarioRouter);

// Modulo 4: Precios, Zonas y Normativa
router.use('/zonas', can('zonas:leer', 'zonas:escribir'), zonaRouter);
router.use('/precios', can('precios:leer', 'precios:escribir'), precioRouter);
router.use('/decretos', can('decretos:leer', 'decretos:escribir'), decretoRouter);

// Modulo 5: Auditoria (solo lectura para admin y auditor)
router.use('/auditoria', can('auditoria:leer'), auditoriaRouter);

// Modulo 6: Reportes
router.use('/reportes', can('reportes:generar'), reporteRouter);

// Modulo 7: Dashboard
router.use('/dashboard', can('dashboard:leer'), dashboardRouter);

export { router };
