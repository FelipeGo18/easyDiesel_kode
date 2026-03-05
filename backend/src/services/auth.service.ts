import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import type { RegisterInput, LoginInput } from '../validators/auth.validator';

// ──────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────

const SALT_ROUNDS = 12;

function signToken(payload: { userId: string; email: string; rol: string }): string {
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
                apellido: data.apellido,
                rolId,
            },
            include: { rol: true },
        });

        // Generar token
        const token = signToken({
            userId: usuario.id,
            email: usuario.email,
            rol: usuario.rol.nombre,
        });

        return {
            token,
            usuario: {
                id: usuario.id,
                email: usuario.email,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                rol: usuario.rol.nombre,
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
        });

        return {
            token,
            usuario: {
                id: usuario.id,
                email: usuario.email,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                rol: usuario.rol.nombre,
            },
        };
    }

    /**
     * Retorna el perfil del usuario autenticado.
     */
    async getProfile(userId: string) {
        const usuario = await prisma.usuario.findUnique({
            where: { id: userId },
            include: {
                rol: { select: { id: true, nombre: true, descripcion: true, permisos: true } },
                estacion: { select: { id: true, nombre: true, codigoSicom: true } },
                distribuidor: { select: { id: true, nombre: true, nit: true } },
            },
        });

        if (!usuario) {
            throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 });
        }

        return {
            id: usuario.id,
            email: usuario.email,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            activo: usuario.activo,
            rol: usuario.rol,
            estacion: usuario.estacion,
            distribuidor: usuario.distribuidor,
            createdAt: usuario.createdAt,
        };
    }
}

export const authService = new AuthService();
