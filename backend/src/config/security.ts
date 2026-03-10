import type { Express } from 'express';

const DEFAULT_JWT_SECRET = 'default-secret';

function isTruthy(value?: string) {
    return value === '1' || value === 'true' || value === 'yes';
}

export function getJwtSecret() {
    const configuredSecret = process.env.JWT_SECRET;

    if (process.env.NODE_ENV === 'production' && (!configuredSecret || configuredSecret === DEFAULT_JWT_SECRET)) {
        throw new Error('JWT_SECRET debe configurarse con un valor seguro en producción');
    }

    return configuredSecret || DEFAULT_JWT_SECRET;
}

export function applySecurityRuntimeConfig(app: Express) {
    app.disable('x-powered-by');

    const trustProxy = process.env.TRUST_PROXY;
    if (!trustProxy || trustProxy === '0' || trustProxy === 'false' || trustProxy === 'no') {
        return;
    }

    if (isTruthy(trustProxy)) {
        app.set('trust proxy', 1);
        return;
    }

    app.set('trust proxy', trustProxy);
}