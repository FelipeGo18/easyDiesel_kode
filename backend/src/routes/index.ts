import { Router } from 'express';
import type { Router as RouterType } from 'express';
import { authRouter } from './auth.routes';

const router: RouterType = Router();

// ── Módulo 1: Auth ─────────────────────────────────────
router.use('/auth', authRouter);

// ── Módulo 2: Usuarios ─────────────────────────────────
// router.use('/usuarios', usuariosRouter);

// ── Módulo 3: Inventario ───────────────────────────────
// router.use('/inventario', inventarioRouter);

// ── Módulo 4: Precios y Zonas ──────────────────────────
// router.use('/precios', preciosRouter);
// router.use('/zonas', zonasRouter);

// ── Módulo 5: Normativa ────────────────────────────────
// router.use('/normativa', normativaRouter);

// ── Módulo 6: Reportes ─────────────────────────────────
// router.use('/reportes', reportesRouter);

// ── Módulo 7: Auditoría ────────────────────────────────
// router.use('/auditoria', auditoriaRouter);

// ── Módulo 8: Dashboard ────────────────────────────────
// router.use('/dashboard', dashboardRouter);

export { router };
