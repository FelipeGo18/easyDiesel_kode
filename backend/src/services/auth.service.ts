import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '../utils/prisma';
import type { RegisterInput, LoginInput } from '../validators/auth.validator';

// ──────────────────────────────────────────
// Supabase Client (Backend)
// ──────────────────────────────────────────

const supabaseUrl = process.env.SUPABASE_URL || 'https://gfuctahftqgxvoxhdxkb.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ──────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────

const SALT_ROUNDS = 12;

function signToken(payload: { userId: string; email: string; rol: string; permisos?: string[] }): string {
    const secret = process.env.JWT_SECRET || 'default-secret';
    const expiresIn = process.env.JWT_EXPIRES_IN || '8h';
    return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}

// ──────────────────────────────────────────
// Service
// ──────────────────────────────────────────

export class AuthService {
    /**
     * Registra un nuevo usuario.
     * Si no se proporciona rolId, se asigna el rol "particular" por defecto.
     */
    async register(data: RegisterInput) {
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
        const token = signToken({
            userId: usuario.id,
            email: usuario.email,
            rol: usuario.rol.nombre,
            permisos: (usuario.rol.permisos as any) || [],
        });

        return {
            token,
            usuario: {
                id: usuario.id,
                email: usuario.email,
                nombre: usuario.nombre,
                rol: usuario.rol.nombre,
                permisos: (usuario.rol.permisos as any) || [],
            },
        };
    }

    /**
     * Autentica un usuario con email y contraseña.
     */
    async login(data: LoginInput) {
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
        const token = signToken({
            userId: usuario.id,
            email: usuario.email,
            rol: usuario.rol.nombre,
            permisos: (usuario.rol.permisos as any) || [],
        });

        return {
            token,
            usuario: {
                id: usuario.id,
                email: usuario.email,
                nombre: usuario.nombre,
                rol: usuario.rol.nombre,
                permisos: (usuario.rol.permisos as any) || [],
            },
        };
    }

    /**
     * Autentica o registra un usuario mediante Google.
     */
    async loginWithGoogle(data: { email: string; nombre: string; googleId: string; fotoUrl?: string }) {
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
        const token = signToken({
            userId: usuario.id,
            email: usuario.email,
            rol: usuario.rol.nombre,
            permisos: (usuario.rol.permisos as any) || [],
        });

        return {
            token,
            usuario: {
                id: usuario.id,
                email: usuario.email,
                nombre: usuario.nombre,
                rol: usuario.rol.nombre,
                fotoUrl: usuario.fotoUrl,
                permisos: (usuario.rol.permisos as any) || [],
            },
        };
    }

    /**
     * Autentica o registra un usuario mediante un access_token de Supabase.
     */
    async loginWithSupabaseToken(accessToken: string) {
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
                estacionGestionada: { select: { id: true, nombre: true, codigoSicom: true } },
                distribuidorGestionado: { select: { id: true, nombre: true, nit: true } },
            },
        });

        if (!usuario) {
            throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 });
        }

        return {
            id: usuario.id,
            email: usuario.email,
            nombre: usuario.nombre,
            activo: usuario.activo,
            rol: usuario.rol,
            estacion: usuario.estacionGestionada,
            distribuidor: usuario.distribuidorGestionado,
            createdAt: usuario.createdAt,
        };
    }
}

export const authService = new AuthService();
