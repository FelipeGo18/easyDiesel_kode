import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { CrearUsuarioInput, ActualizarUsuarioInput } from '../validators/usuario.validator';

export class UsuarioService {
    /**
     * Obtener todos los usuarios, con sus relaciones básicas.
     * Por defecto, no se envía el hash del password.
     */
    async obtenerUsuarios(opts?: { search?: string; page?: number; limit?: number }) {
        const page = Math.max(1, opts?.page ?? 1);
        const limit = Math.min(200, Math.max(1, opts?.limit ?? 50));
        const skip = (page - 1) * limit;

        const where: any = {};
        if (opts?.search?.trim()) {
            const q = opts.search.trim();
            where.OR = [
                { nombre: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
            ];
        }

        const [usuarios, total] = await Promise.all([
            prisma.usuario.findMany({
                where,
                include: {
                    rol: true,
                    estacionGestionada: { select: { id: true, nombre: true } },
                    distribuidorGestionado: { select: { id: true, nombre: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.usuario.count({ where }),
        ]);

        // Remover passwordHash
        const data = usuarios.map(({ passwordHash, ...user }: any) => user);
        return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    /**
     * Obtener un usuario por ID.
     */
    async obtenerUsuarioPorId(id: string) {
        const usuario = await prisma.usuario.findUnique({
            where: { id },
            include: {
                rol: true,
                estacionGestionada: true,
                distribuidorGestionado: true
            }
        });

        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }

        const { passwordHash, ...user } = usuario;
        return user;
    }

    /**
     * Crear un nuevo usuario (típicamente por un Admin).
     */
    async crearUsuario(data: CrearUsuarioInput) {
        // Validar si el email ya existe
        const existe = await prisma.usuario.findUnique({ where: { email: data.email } });
        if (existe) {
            throw new Error('El correo electrónico ya está registrado');
        }

        let { rolId, password, estacionId: newEstacionId, distribuidorId: newDistribuidorId, ...restData } = data;

        // Si no se envía un rol (por algún motivo), asignar rol 'particular'
        if (!rolId) {
            const rolBasico = await prisma.rol.findUnique({ where: { nombre: 'particular' } });
            if (rolBasico) {
                rolId = rolBasico.id;
            } else {
                throw new Error('Rol base "particular" no encontrado en el sistema');
            }
        }

        // Contraseña por defecto si no es provista
        const plainPassword = password || 'EasyDiesel2026!';
        const passwordHash = await bcrypt.hash(plainPassword, 10);

        const usuario = await prisma.usuario.create({
            data: {
                ...restData,
                email: data.email,
                passwordHash,
                rolId,
            },
            include: { rol: true }
        });

        if (newEstacionId) {
            await prisma.estacionServicio.update({
                where: { id: newEstacionId },
                data: { usuarioId: usuario.id },
            });
        }

        if (newDistribuidorId) {
            await prisma.distribuidor.update({
                where: { id: newDistribuidorId },
                data: { usuarioId: usuario.id },
            });
        }

        const { passwordHash: _, ...newUser } = usuario;
        return newUser;
    }

    /**
     * Actualizar datos de un usuario existente.
     */
    async actualizarUsuario(id: string, data: ActualizarUsuarioInput) {
        // Validar existencia
        const existe = await prisma.usuario.findUnique({ where: { id } });
        if (!existe) {
            throw new Error('Usuario no encontrado');
        }

        // Preparar objeto de actualización
        const updateData: any = {
            nombre: data.nombre,
        };

        if (data.email && data.email !== existe.email) {
            // Validar que el nuevo email no esté en uso
            const emailEnUso = await prisma.usuario.findUnique({ where: { email: data.email } });
            if (emailEnUso) {
                throw new Error('El correo electrónico ya está en uso por otro usuario');
            }
            updateData.email = data.email;
        }

        if (data.password) {
            updateData.passwordHash = await bcrypt.hash(data.password, 10);
        }

        if (data.rolId) updateData.rol = { connect: { id: data.rolId } };

        const usuario = await prisma.usuario.update({
            where: { id },
            data: updateData,
            include: { rol: true, estacionGestionada: true, distribuidorGestionado: true }
        });

        if ('estacionId' in data) {
            await prisma.estacionServicio.updateMany({
                where: { usuarioId: id },
                data: { usuarioId: null },
            });
            if (data.estacionId) {
                await prisma.estacionServicio.update({
                    where: { id: data.estacionId as string },
                    data: { usuarioId: id },
                });
            }
        }

        if ('distribuidorId' in data) {
            await prisma.distribuidor.updateMany({
                where: { usuarioId: id },
                data: { usuarioId: null },
            });
            if (data.distribuidorId) {
                await prisma.distribuidor.update({
                    where: { id: data.distribuidorId as string },
                    data: { usuarioId: id },
                });
            }
        }

        const { passwordHash: _, ...newUser } = usuario;
        return newUser;
    }

    /**
     * Obtiene todos los roles disponibles en el sistema.
     */
    async obtenerRoles() {
        return prisma.rol.findMany({
            orderBy: { nombre: 'asc' },
        });
    }

    /**
     * Desactivación lógica (Soft Delete) del usuario.
     */
    async desactivarUsuario(id: string) {
        const existe = await prisma.usuario.findUnique({ where: { id } });
        if (!existe) {
            throw new Error('Usuario no encontrado');
        }

        const usuario = await prisma.usuario.update({
            where: { id },
            data: { activo: false } // Cambia a inactivo
        });

        return { id: usuario.id, email: usuario.email, activo: usuario.activo };
    }
}

export const usuarioService = new UsuarioService();
