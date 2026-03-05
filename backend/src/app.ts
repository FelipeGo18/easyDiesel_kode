import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { router } from './routes';
import { errorHandler } from './middleware/errorHandler';

import type { Express } from 'express';

const app: Express = express();

// ── Security ───────────────────────────────────────────
app.use(helmet());
app.use(
    cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
    })
);

// ── Rate limiting ──────────────────────────────────────
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiadas solicitudes, intenta de nuevo más tarde.' },
});
app.use(limiter);

// ── Body parsing ───────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health check ───────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
    });
});

// ── Routes ─────────────────────────────────────────────
app.use('/api', router);

// ── Swagger ────────────────────────────────────────────
import { setupSwagger } from './utils/swagger';
setupSwagger(app);

// ── Error handling ─────────────────────────────────────
app.use(errorHandler);

export { app };
