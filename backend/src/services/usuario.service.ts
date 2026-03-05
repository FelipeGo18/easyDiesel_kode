import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { CrearUsuarioInput, ActualizarUsuarioInput } from '../validators/usuario.validator';

export class UsuarioService {
    /**
     * Obtener todos los usuarios, con sus relaciones básicas.
     * Por defecto, no se envía el hash del password.
     */
    async obtenerUsuarios() {
        const usuarios = await prisma.usuario.findMany({
            include: {
                rol: true,
                estacion: {
                    select: { id: true, nombre: true }
                },
                distribuidor: {
                    select: { id: true, nombre: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Remover passwordHash
        return usuarios.map(({ passwordHash, ...user }: any) => user);
    }

    /**
     * Obtener un usuario por ID.
     */
    async obtenerUsuarioPorId(id: string) {
        const usuario = await prisma.usuario.findUnique({
            where: { id },
            include: {
                rol: true,
                estacion: true,
                distribuidor: true
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

        let { rolId, password, ...restData } = data;

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
            apellido: data.apellido,
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

        // Para desconectar estacion/distribuidor si data.*Id es null explícitamente, o conectar si viene un ID
        if (data.estacionId !== undefined) {
            updateData.estacion = data.estacionId ? { connect: { id: data.estacionId } } : { disconnect: true };
        }

        if (data.distribuidorId !== undefined) {
            updateData.distribuidor = data.distribuidorId ? { connect: { id: data.distribuidorId } } : { disconnect: true };
        }

        const usuario = await prisma.usuario.update({
            where: { id },
            data: updateData,
            include: { rol: true, estacion: true, distribuidor: true }
        });

        const { passwordHash: _, ...updatedUser } = usuario;
        return updatedUser;
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
