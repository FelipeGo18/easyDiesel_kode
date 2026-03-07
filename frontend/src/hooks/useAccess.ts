import { useAuth } from '@/context/useAuth';

const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
    admin: [
        'usuarios:leer', 'usuarios:escribir', 'actores:leer', 'actores:escribir', 'tanques:leer', 'tanques:escribir',
        'inventario:leer', 'inventario:escribir', 'zonas:leer', 'zonas:escribir', 'precios:leer', 'precios:escribir',
        'decretos:leer', 'decretos:escribir', 'auditoria:leer', 'reportes:leer', 'reportes:generar', 'dashboard:leer',
    ],
    estacion: ['tanques:leer', 'inventario:leer', 'inventario:escribir', 'reportes:leer', 'reportes:generar', 'dashboard:leer'],
    distribuidor: ['actores:leer', 'inventario:leer', 'inventario:escribir', 'reportes:leer', 'reportes:generar', 'dashboard:leer'],
    regulador: ['precios:leer', 'zonas:leer', 'decretos:leer', 'reportes:leer', 'dashboard:leer', 'auditoria:leer'],
    auditor: ['auditoria:leer', 'reportes:leer', 'dashboard:leer'],
    particular: ['precios:leer'],
    distribuidor_regulado: ['inventario:leer', 'inventario:escribir', 'decretos:leer', 'reportes:leer', 'reportes:generar', 'dashboard:leer'],
};

function unique(values: string[]) {
    return [...new Set(values.filter(Boolean))];
}

export function useAccess() {
    const { user } = useAuth();

    const roleName = typeof user?.rol === 'object' ? user.rol.nombre : user?.rol;
    const rolePermissions = typeof user?.rol === 'object' && Array.isArray(user.rol.permisos)
        ? user.rol.permisos
        : [];
    const permissions = unique([...(ROLE_DEFAULT_PERMISSIONS[roleName || ''] || []), ...rolePermissions]);

    const hasAnyPermission = (...requiredPermissions: string[]) => {
        if (roleName === 'admin') {
            return true;
        }

        if (!requiredPermissions.length) {
            return true;
        }

        return requiredPermissions.some((permission) => permissions.includes(permission));
    };

    const hasAllPermissions = (...requiredPermissions: string[]) => {
        if (roleName === 'admin') {
            return true;
        }

        return requiredPermissions.every((permission) => permissions.includes(permission));
    };

    return {
        roleName,
        permissions,
        hasAnyPermission,
        hasAllPermissions,
        isParticular: roleName === 'particular',
    };
}