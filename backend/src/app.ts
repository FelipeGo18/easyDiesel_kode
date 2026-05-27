import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { router } from './routes';
import { errorHandler } from './middleware/errorHandler';
import { applySecurityRuntimeConfig } from './config/security';
import { globalApiRateLimiter } from './middleware/rate-limit';

import type { Express } from 'express';

const app: Express = express();
app.set('trust proxy', 1);
applySecurityRuntimeConfig(app);

const normalizeOrigin = (origin: string) => origin.replace(/\/+$/, '');
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => normalizeOrigin(origin.trim()))
    .filter(Boolean);

// ── Security ───────────────────────────────────────────
app.use(helmet());
app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(normalizeOrigin(origin))) {
                callback(null, true);
                return;
            }

            callback(new Error(`Origin not allowed by CORS: ${origin}`));
        },
        credentials: true,
    })
);

// ── Rate limiting ──────────────────────────────────────
app.use(globalApiRateLimiter);

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
