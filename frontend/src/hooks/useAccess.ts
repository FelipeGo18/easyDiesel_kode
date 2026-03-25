import { useAuth } from '@/context/useAuth';

const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
    admin: [
        'usuarios:leer', 'usuarios:escribir', 'actores:leer', 'actores:escribir', 'tanques:leer', 'tanques:escribir',
        'inventario:leer', 'inventario:escribir', 'zonas:leer', 'zonas:escribir', 'precios:leer', 'precios:escribir',
        'decretos:leer', 'decretos:escribir', 'auditoria:leer', 'reportes:leer', 'reportes:generar', 'panel:leer', 'estadisticas:leer',
    ],
    estacion: ['actores:leer', 'tanques:leer', 'tanques:escribir', 'inventario:leer', 'inventario:escribir', 'precios:leer', 'decretos:leer', 'auditoria:leer', 'reportes:leer', 'reportes:generar', 'panel:leer', 'estadisticas:leer'],
    distribuidor: ['actores:leer', 'inventario:leer', 'inventario:escribir', 'precios:leer', 'decretos:leer', 'auditoria:leer', 'reportes:leer', 'reportes:generar', 'panel:leer', 'estadisticas:leer'],
    regulador: ['precios:leer', 'zonas:leer', 'decretos:leer', 'reportes:leer', 'panel:leer', 'auditoria:leer', 'estadisticas:leer'],
    auditor: ['auditoria:leer', 'reportes:leer', 'panel:leer', 'estadisticas:leer'],
    particular: ['precios:leer', 'panel:leer', 'estadisticas:leer'],
    distribuidor_regulado: ['inventario:leer', 'inventario:escribir', 'precios:leer', 'decretos:leer', 'auditoria:leer', 'reportes:leer', 'reportes:generar', 'panel:leer', 'estadisticas:leer'],
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