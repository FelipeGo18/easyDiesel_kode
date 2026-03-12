import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '../utils/prisma';
import type { RegisterInput, LoginInput, UpdateProfileInput } from '../validators/auth.validator';
import { normalizePermissions } from '../utils/permissions';
import { getJwtSecret } from '../config/security';

// ──────────────────────────────────────────
// Supabase Client (Backend)
// ──────────────────────────────────────────

const supabaseUrl = process.env.SUPABASE_URL || 'https://gfuctahftqgxvoxhdxkb.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdWN0YWhmdHFneHZveGhkeGtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2ODA3OTYsImV4cCI6MjA4ODI1Njc5Nn0.S8JADPRmPmCm8aKN1xd6bqL_212AuP8NDXZrki0y_fw';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ──────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────

const SALT_ROUNDS = 12;
const DEFAULT_REFRESH_EXPIRES_IN_DAYS = 14;

interface SessionMetadata {
    ip?: string;
    userAgent?: string;
}

function buildAuthPayload(usuario: {
    id: string;
    email: string;
    nombre: string;
    fotoUrl?: string | null;
    rol: { nombre: string; permisos?: unknown };
}) {
    const permisos = normalizePermissions(usuario.rol.nombre, usuario.rol.permisos);

    return {
        tokenPayload: {
            userId: usuario.id,
            email: usuario.email,
            rol: usuario.rol.nombre,
            permisos,
        },
        usuario: {
            id: usuario.id,
            email: usuario.email,
            nombre: usuario.nombre,
            rol: usuario.rol.nombre,
            fotoUrl: usuario.fotoUrl,
            permisos,
        },
    };
}

function signToken(payload: { userId: string; email: string; rol: string; permisos?: string[] }): string {
    const secret = getJwtSecret();
    const expiresIn = process.env.JWT_EXPIRES_IN || '8h';
    return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}

function hashRefreshToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

function generateRefreshToken() {
    return crypto.randomBytes(48).toString('hex');
}

function getRefreshTokenExpiration() {
    const configuredDays = Number(process.env.JWT_REFRESH_EXPIRES_IN_DAYS || DEFAULT_REFRESH_EXPIRES_IN_DAYS);
    return new Date(Date.now() + configuredDays * 24 * 60 * 60 * 1000);
}

// ──────────────────────────────────────────
// Service
// ──────────────────────────────────────────

export class AuthService {
    private async issueSession(
        usuario: {
            id: string;
            email: string;
            nombre: string;
            fotoUrl?: string | null;
            rol: { nombre: string; permisos?: unknown };
        },
        metadata?: SessionMetadata
    ) {
        const session = buildAuthPayload(usuario);
        const token = signToken(session.tokenPayload);
        const refreshToken = generateRefreshToken();

        await (prisma as any).sessionToken.create({
            data: {
                usuarioId: usuario.id,
                tokenHash: hashRefreshToken(refreshToken),
                expiresAt: getRefreshTokenExpiration(),
                ip: metadata?.ip,
                userAgent: metadata?.userAgent,
            },
        });

        // Fetch estacion/distribuidor for roles that need them
        const rolesThatNeedRelations = ['estacion', 'distribuidor', 'distribuidor_regulado'];
        let estacion = null;
        let distribuidor = null;
        if (rolesThatNeedRelations.includes(session.usuario.rol as string)) {
            const fullUser = await prisma.usuario.findUnique({
                where: { id: usuario.id },
                select: {
                    estacionGestionada: { select: { id: true, nombre: true, codigoSicom: true, zonaId: true } },
                    distribuidorGestionado: { select: { id: true, nombre: true, nit: true } },
                },
            });
            estacion = fullUser?.estacionGestionada ?? null;
            distribuidor = fullUser?.distribuidorGestionado ?? null;
        }

        return {
            token,
            refreshToken,
            usuario: {
                ...session.usuario,
                estacion,
                distribuidor,
            },
        };
    }

    /**
     * Registra un nuevo usuario.
     * Si no se proporciona rolId, se asigna el rol "particular" por defecto.
     */
    async register(data: RegisterInput, metadata?: SessionMetadata) {
        // Verificar email duplicado
        const existing = await prisma.usuario.findUnique({
            where: { email: data.email },
        });
        if (existing) {
            throw Object.assign(new Error('El email ya está registrado'), { statusCode: 409 });
        }

        // Resolver rol
        let rolId = data.rolId;
        if (!rolId) {
            const defaultRol = await prisma.rol.findUnique({
                where: { nombre: 'particular' },
            });
            if (!defaultRol) {
                throw Object.assign(new Error('No se encontró el rol por defecto'), { statusCode: 500 });
            }
            rolId = defaultRol.id;
        } else {
            // Verificar que el rol existe
            const rol = await prisma.rol.findUnique({ where: { id: rolId } });
            if (!rol) {
                throw Object.assign(new Error('El rol especificado no existe'), { statusCode: 400 });
            }
        }

        // Hash password
        const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

        // Crear usuario
        const usuario = await prisma.usuario.create({
            data: {
                email: data.email,
                passwordHash,
                nombre: data.nombre,
                rolId,
            },
            include: { rol: true },
        });

        // Generar token
        return this.issueSession(usuario, metadata);
    }

    /**
     * Autentica un usuario con email y contraseña.
     */
    async login(data: LoginInput, metadata?: SessionMetadata) {
        // Buscar usuario
        const usuario = await prisma.usuario.findUnique({
            where: { email: data.email },
            include: { rol: true },
        });

        if (!usuario) {
            throw Object.assign(new Error('Credenciales inválidas'), { statusCode: 401 });
        }

        if (!usuario.activo) {
            throw Object.assign(new Error('Cuenta desactivada. Contacta al administrador.'), { statusCode: 403 });
        }

        if (!usuario.passwordHash) {
            throw Object.assign(new Error('Este usuario debe iniciar sesión con Google'), { statusCode: 401 });
        }

        // Verificar contraseña
        const isValid = await bcrypt.compare(data.password, usuario.passwordHash);
        if (!isValid) {
            throw Object.assign(new Error('Credenciales inválidas'), { statusCode: 401 });
        }

        // Generar token
        return this.issueSession(usuario, metadata);
    }

    /**
     * Autentica o registra un usuario mediante Google.
     */
    async loginWithGoogle(data: { email: string; nombre: string; googleId: string; fotoUrl?: string }, metadata?: SessionMetadata) {
        let usuario = await prisma.usuario.findUnique({
            where: { email: data.email },
            include: { rol: true },
        });

        if (usuario) {
            // Actualizar información de Google si es necesario
            if (!usuario.googleId || usuario.authProvider !== 'GOOGLE') {
                usuario = await prisma.usuario.update({
                    where: { id: usuario.id },
                    data: {
                        googleId: data.googleId,
                        authProvider: 'GOOGLE',
                        fotoUrl: data.fotoUrl || usuario.fotoUrl,
                    },
                    include: { rol: true },
                });
            }
        } else {
            // Crear nuevo usuario
            const defaultRol = await prisma.rol.findUnique({
                where: { nombre: 'particular' },
            });
            if (!defaultRol) {
                throw Object.assign(new Error('No se encontró el rol por defecto'), { statusCode: 500 });
            }

            usuario = await prisma.usuario.create({
                data: {
                    email: data.email,
                    nombre: data.nombre,
                    googleId: data.googleId,
                    authProvider: 'GOOGLE',
                    fotoUrl: data.fotoUrl,
                    rolId: defaultRol.id,
                },
                include: { rol: true },
            });
        }

        if (!usuario.activo) {
            throw Object.assign(new Error('Cuenta desactivada. Contacta al administrador.'), { statusCode: 403 });
        }

        // Generar token
        return this.issueSession(usuario, metadata);
    }

    /**
     * Autentica o registra un usuario mediante un access_token de Supabase.
     */
    async loginWithSupabaseToken(accessToken: string, metadata?: SessionMetadata) {
        if (!supabase) {
            throw Object.assign(new Error('La integración con Supabase no está configurada en el backend'), { statusCode: 500 });
        }

        // 1. Verificar el token con Supabase
        const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(accessToken);

        if (error || !supabaseUser) {
            throw Object.assign(new Error('Token de Supabase inválido o expirado'), { statusCode: 401 });
        }

        const email = supabaseUser.email!;
        const nombre = supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || email.split('@')[0];
        const googleId = supabaseUser.id;
        const fotoUrl = supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture;

        // 2. Sincronizar con nuestra base de datos (reusando lógica de loginWithGoogle)
        return this.loginWithGoogle({
            email,
            nombre,
            googleId,
            fotoUrl
        }, metadata);
    }

    async refreshSession(refreshToken: string, metadata?: SessionMetadata) {
        const tokenHash = hashRefreshToken(refreshToken);
        const storedSession = await (prisma as any).sessionToken.findUnique({
            where: { tokenHash },
            include: {
                usuario: {
                    include: { rol: true },
                },
            },
        });

        if (!storedSession || storedSession.revokedAt || storedSession.expiresAt <= new Date()) {
            throw Object.assign(new Error('Refresh token inválido o expirado'), { statusCode: 401 });
        }

        if (!storedSession.usuario.activo) {
            throw Object.assign(new Error('Cuenta desactivada. Contacta al administrador.'), { statusCode: 403 });
        }

        await (prisma as any).sessionToken.update({
            where: { id: storedSession.id },
            data: { revokedAt: new Date() },
        });

        return this.issueSession(storedSession.usuario, metadata);
    }

    async logout(refreshToken: string) {
        const tokenHash = hashRefreshToken(refreshToken);
        await (prisma as any).sessionToken.updateMany({
            where: {
                tokenHash,
                revokedAt: null,
            },
            data: {
                revokedAt: new Date(),
            },
        });
    }

    /**
     * Retorna el perfil del usuario autenticado.
     */
    async getProfile(userId: string) {
        const usuario = await prisma.usuario.findUnique({
            where: { id: userId },
            include: {
                rol: { select: { id: true, nombre: true, descripcion: true, permisos: true } },
                estacionGestionada: { select: { id: true, nombre: true, codigoSicom: true, zonaId: true } },
                distribuidorGestionado: { select: { id: true, nombre: true, nit: true } },
            },
        });

        if (!usuario) {
            throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 });
        }

        const permisos = normalizePermissions(usuario.rol.nombre, usuario.rol.permisos);

        return {
            id: usuario.id,
            email: usuario.email,
            nombre: usuario.nombre,
            activo: usuario.activo,
            rol: {
                ...usuario.rol,
                permisos,
            },
            estacion: usuario.estacionGestionada,
            distribuidor: usuario.distribuidorGestionado,
            createdAt: usuario.createdAt,
        };
    }

    /**
     * Actualiza nombre, email y/o contraseña del usuario autenticado.
     */
    async updateProfile(userId: string, data: UpdateProfileInput) {
        if (data.email) {
            const conflict = await prisma.usuario.findFirst({
                where: { email: data.email, NOT: { id: userId } },
            });
            if (conflict) {
                throw Object.assign(new Error('El email ya está en uso por otra cuenta'), { statusCode: 409 });
            }
        }

        const updateData: Record<string, unknown> = {};
        if (data.nombre) updateData.nombre = data.nombre;
        if (data.email) updateData.email = data.email;
        if (data.password) updateData.passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

        const usuario = await prisma.usuario.update({
            where: { id: userId },
            data: updateData,
            include: {
                rol: { select: { id: true, nombre: true, descripcion: true, permisos: true } },
                estacionGestionada: { select: { id: true, nombre: true, codigoSicom: true, zonaId: true } },
                distribuidorGestionado: { select: { id: true, nombre: true, nit: true } },
            },
        });

        const permisos = normalizePermissions(usuario.rol.nombre, usuario.rol.permisos);

        return {
            id: usuario.id,
            email: usuario.email,
            nombre: usuario.nombre,
            activo: usuario.activo,
            rol: { ...usuario.rol, permisos },
            estacion: usuario.estacionGestionada,
            distribuidor: usuario.distribuidorGestionado,
            createdAt: usuario.createdAt,
        };
    }
}

export const authService = new AuthService();
