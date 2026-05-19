import { getJwtSecret, applySecurityRuntimeConfig } from '../../../src/config/security';
import type { Express } from 'express';

describe('Config — Security', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...OLD_ENV };
        delete process.env.JWT_SECRET;
        delete process.env.NODE_ENV;
        delete process.env.TRUST_PROXY;
    });

    afterAll(() => {
        process.env = OLD_ENV;
    });

    describe('getJwtSecret', () => {
        it('debe retornar default-secret si no hay JWT_SECRET configurado', () => {
            expect(getJwtSecret()).toBe('default-secret');
        });

        it('debe retornar el valor configurado de JWT_SECRET', () => {
            process.env.JWT_SECRET = 'my-custom-secret';
            expect(getJwtSecret()).toBe('my-custom-secret');
        });

        it('debe lanzar error en produccion si JWT_SECRET es el default', () => {
            process.env.NODE_ENV = 'production';
            process.env.JWT_SECRET = 'default-secret';
            expect(() => getJwtSecret()).toThrow('JWT_SECRET debe configurarse');
        });

        it('debe lanzar error en produccion si JWT_SECRET no esta configurado', () => {
            process.env.NODE_ENV = 'production';
            expect(() => getJwtSecret()).toThrow('JWT_SECRET debe configurarse');
        });

        it('NO debe lanzar error en produccion si JWT_SECRET es personalizado', () => {
            process.env.NODE_ENV = 'production';
            process.env.JWT_SECRET = 'secure-prod-secret';
            expect(getJwtSecret()).toBe('secure-prod-secret');
        });
    });

    describe('applySecurityRuntimeConfig', () => {
        function mockApp(): Express {
            const settings: Record<string, any> = {};
            return {
                disable: jest.fn(),
                set: jest.fn((key: string, value: any) => { settings[key] = value; }),
                get: jest.fn((key: string) => settings[key]),
                settings,
            } as unknown as Express;
        }

        it('debe deshabilitar x-powered-by', () => {
            const app = mockApp();
            applySecurityRuntimeConfig(app);
            expect(app.disable).toHaveBeenCalledWith('x-powered-by');
        });

        it('no debe configurar trust proxy si TRUST_PROXY es 0', () => {
            process.env.TRUST_PROXY = '0';
            const app = mockApp();
            applySecurityRuntimeConfig(app);
            expect(app.set).not.toHaveBeenCalledWith('trust proxy', expect.anything());
        });

        it('no debe configurar trust proxy si TRUST_PROXY es false', () => {
            process.env.TRUST_PROXY = 'false';
            const app = mockApp();
            applySecurityRuntimeConfig(app);
            expect(app.set).not.toHaveBeenCalledWith('trust proxy', expect.anything());
        });

        it('no debe configurar trust proxy si TRUST_PROXY es no', () => {
            process.env.TRUST_PROXY = 'no';
            const app = mockApp();
            applySecurityRuntimeConfig(app);
            expect(app.set).not.toHaveBeenCalledWith('trust proxy', expect.anything());
        });

        it('no debe configurar trust proxy si TRUST_PROXY no esta definido', () => {
            const app = mockApp();
            applySecurityRuntimeConfig(app);
            expect(app.set).not.toHaveBeenCalledWith('trust proxy', expect.anything());
        });

        it('debe configurar trust proxy = 1 si TRUST_PROXY es truthy (1)', () => {
            process.env.TRUST_PROXY = '1';
            const app = mockApp();
            applySecurityRuntimeConfig(app);
            expect(app.set).toHaveBeenCalledWith('trust proxy', 1);
        });

        it('debe configurar trust proxy = 1 si TRUST_PROXY es true', () => {
            process.env.TRUST_PROXY = 'true';
            const app = mockApp();
            applySecurityRuntimeConfig(app);
            expect(app.set).toHaveBeenCalledWith('trust proxy', 1);
        });

        it('debe configurar trust proxy = 1 si TRUST_PROXY es yes', () => {
            process.env.TRUST_PROXY = 'yes';
            const app = mockApp();
            applySecurityRuntimeConfig(app);
            expect(app.set).toHaveBeenCalledWith('trust proxy', 1);
        });

        it('debe pasar el valor literal si TRUST_PROXY no es truthy ni falsy', () => {
            process.env.TRUST_PROXY = '192.168.1.0/24';
            const app = mockApp();
            applySecurityRuntimeConfig(app);
            expect(app.set).toHaveBeenCalledWith('trust proxy', '192.168.1.0/24');
        });
    });
});
