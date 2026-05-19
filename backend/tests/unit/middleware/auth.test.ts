import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { auth, can, resolveOwnership, assertEstacionOwnership, assertDistribuidorOwnership } from '../../../src/middleware/auth';
import { prisma } from '../../../src/utils/prisma';

jest.mock('jsonwebtoken');
jest.mock('../../../src/utils/prisma', () => ({
    prisma: {
        usuario: {
            findUnique: jest.fn(),
        },
    },
}));
jest.mock('../../../src/utils/permissions', () => ({
    hasAnyPermission: jest.fn().mockReturnValue(true),
    normalizePermissions: jest.fn().mockReturnValue(['inventario:leer']),
}));
jest.mock('../../../src/config/security', () => ({
    getJwtSecret: jest.fn().mockReturnValue('test-secret'),
}));

const { hasAnyPermission, normalizePermissions } = require('../../../src/utils/permissions');
const { getJwtSecret } = require('../../../src/config/security');

describe('Middleware — Auth', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: jest.Mock;

    beforeEach(() => {
        mockReq = { headers: {}, user: undefined };
        mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        mockNext = jest.fn();
        jest.clearAllMocks();
    });

    describe('auth', () => {
        it('debe retornar 401 si no hay header Authorization', () => {
            auth(mockReq as Request, mockRes as Response, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('debe retornar 401 si el header no empieza con Bearer', () => {
            mockReq.headers = { authorization: 'Basic abc123' };
            auth(mockReq as Request, mockRes as Response, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('debe llamar next si el token es valido', () => {
            mockReq.headers = { authorization: 'Bearer valid-token' };
            (jwt.verify as jest.Mock).mockReturnValue({
                userId: 'usr-1', email: 'test@test.com', rol: 'admin',
            });

            auth(mockReq as Request, mockRes as Response, mockNext);

            expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
            expect(mockReq.user).toBeDefined();
            expect(mockReq.user!.userId).toBe('usr-1');
            expect(mockNext).toHaveBeenCalled();
        });

        it('debe retornar 401 si el token es invalido o expirado', () => {
            mockReq.headers = { authorization: 'Bearer bad-token' };
            (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error('expired'); });

            auth(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Token inválido o expirado',
            }));
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('can', () => {
        it('debe retornar 401 si no hay usuario', () => {
            const middleware = can('inventario:escribir');
            middleware(mockReq as Request, mockRes as Response, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('debe permitir acceso a admin sin verificar permisos', () => {
            mockReq.user = { userId: '1', email: 'a@a.com', rol: 'admin', permisos: [] };
            const middleware = can('inventario:escribir');
            middleware(mockReq as Request, mockRes as Response, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });

        it('debe permitir acceso si el usuario tiene el permiso', () => {
            mockReq.user = { userId: '1', email: 'a@a.com', rol: 'estacion', permisos: ['inventario:escribir'] };
            (hasAnyPermission as jest.Mock).mockReturnValue(true);
            const middleware = can('inventario:escribir');
            middleware(mockReq as Request, mockRes as Response, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });

        it('debe retornar 403 si el usuario no tiene el permiso', () => {
            mockReq.user = { userId: '1', email: 'a@a.com', rol: 'estacion', permisos: [] };
            (hasAnyPermission as jest.Mock).mockReturnValue(false);
            const middleware = can('admin:acceso');
            middleware(mockReq as Request, mockRes as Response, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('resolveOwnership', () => {
        it('debe llamar next si no hay usuario', async () => {
            await resolveOwnership(mockReq as Request, mockRes as Response, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });

        it('debe llamar next si es admin', async () => {
            mockReq.user = { userId: '1', email: 'a@a.com', rol: 'admin' };
            await resolveOwnership(mockReq as Request, mockRes as Response, mockNext);
            expect(mockNext).toHaveBeenCalled();
            expect(prisma.usuario.findUnique).not.toHaveBeenCalled();
        });

        it('debe llamar next si el rol no tiene relacion (particular)', async () => {
            mockReq.user = { userId: '1', email: 'a@a.com', rol: 'particular' };
            await resolveOwnership(mockReq as Request, mockRes as Response, mockNext);
            expect(mockNext).toHaveBeenCalled();
            expect(prisma.usuario.findUnique).not.toHaveBeenCalled();
        });

        it('debe resolver estacionId para rol estacion', async () => {
            mockReq.user = { userId: '1', email: 'a@a.com', rol: 'estacion' };
            (prisma.usuario.findUnique as jest.Mock).mockResolvedValue({
                estacionGestionada: { id: 'e1' },
                distribuidorGestionado: null,
            });

            await resolveOwnership(mockReq as Request, mockRes as Response, mockNext);

            expect(mockReq.user!.estacionId).toBe('e1');
            expect(mockNext).toHaveBeenCalled();
        });

        it('debe resolver distribuidorId para rol distribuidor', async () => {
            mockReq.user = { userId: '1', email: 'a@a.com', rol: 'distribuidor' };
            (prisma.usuario.findUnique as jest.Mock).mockResolvedValue({
                estacionGestionada: null,
                distribuidorGestionado: { id: 'd1' },
            });

            await resolveOwnership(mockReq as Request, mockRes as Response, mockNext);

            expect(mockReq.user!.distribuidorId).toBe('d1');
            expect(mockNext).toHaveBeenCalled();
        });

        it('debe continuar si el lookup falla', async () => {
            mockReq.user = { userId: '1', email: 'a@a.com', rol: 'estacion' };
            (prisma.usuario.findUnique as jest.Mock).mockRejectedValue(new Error('DB down'));

            await resolveOwnership(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('assertEstacionOwnership', () => {
        it('no debe lanzar error si no hay usuario', () => {
            expect(() => assertEstacionOwnership(mockReq as Request, 'e1')).not.toThrow();
        });

        it('no debe lanzar error para admin', () => {
            mockReq.user = { userId: '1', email: 'a@a.com', rol: 'admin' };
            expect(() => assertEstacionOwnership(mockReq as Request, 'e1')).not.toThrow();
        });

        it('no debe lanzar error para regulador', () => {
            mockReq.user = { userId: '1', email: 'a@a.com', rol: 'regulador' };
            expect(() => assertEstacionOwnership(mockReq as Request, 'e1')).not.toThrow();
        });

        it('no debe lanzar error para auditor', () => {
            mockReq.user = { userId: '1', email: 'a@a.com', rol: 'auditor' };
            expect(() => assertEstacionOwnership(mockReq as Request, 'e1')).not.toThrow();
        });

        it('no debe lanzar error si estacionId coincide', () => {
            mockReq.user = { userId: '1', email: 'a@a.com', rol: 'estacion', estacionId: 'e1' };
            expect(() => assertEstacionOwnership(mockReq as Request, 'e1')).not.toThrow();
        });

        it('debe lanzar error 403 si estacionId no coincide', () => {
            mockReq.user = { userId: '1', email: 'a@a.com', rol: 'estacion', estacionId: 'e1' };
            try {
                assertEstacionOwnership(mockReq as Request, 'e2');
                fail('Debió lanzar error');
            } catch (err: any) {
                expect(err.message).toBe('No tienes acceso a esta estación');
                expect(err.statusCode).toBe(403);
            }
        });
    });

    describe('assertDistribuidorOwnership', () => {
        it('no debe lanzar error si no hay usuario', () => {
            expect(() => assertDistribuidorOwnership(mockReq as Request, 'd1')).not.toThrow();
        });

        it('no debe lanzar error para admin', () => {
            mockReq.user = { userId: '1', email: 'a@a.com', rol: 'admin' };
            expect(() => assertDistribuidorOwnership(mockReq as Request, 'd1')).not.toThrow();
        });

        it('no debe lanzar error para regulador', () => {
            mockReq.user = { userId: '1', email: 'a@a.com', rol: 'regulador' };
            expect(() => assertDistribuidorOwnership(mockReq as Request, 'd1')).not.toThrow();
        });

        it('no debe lanzar error si distribuidorId coincide', () => {
            mockReq.user = { userId: '1', email: 'a@a.com', rol: 'distribuidor', distribuidorId: 'd1' };
            expect(() => assertDistribuidorOwnership(mockReq as Request, 'd1')).not.toThrow();
        });

        it('debe lanzar error 403 si distribuidorId no coincide', () => {
            mockReq.user = { userId: '1', email: 'a@a.com', rol: 'distribuidor', distribuidorId: 'd1' };
            try {
                assertDistribuidorOwnership(mockReq as Request, 'd2');
                fail('Debió lanzar error');
            } catch (err: any) {
                expect(err.message).toBe('No tienes acceso a este distribuidor');
                expect(err.statusCode).toBe(403);
            }
        });

        it('no debe lanzar error para distribuidor_regulado con id coincidente', () => {
            mockReq.user = { userId: '1', email: 'a@a.com', rol: 'distribuidor_regulado', distribuidorId: 'd1' };
            expect(() => assertDistribuidorOwnership(mockReq as Request, 'd1')).not.toThrow();
        });
    });
});
