const ALL_PERMISSIONS = [
    'usuarios:leer',
    'usuarios:escribir',
    'actores:leer',
    'actores:escribir',
    'tanques:leer',
    'tanques:escribir',
    'inventario:leer',
    'inventario:escribir',
    'zonas:leer',
    'zonas:escribir',
    'precios:leer',
    'precios:escribir',
    'decretos:leer',
    'decretos:escribir',
    'auditoria:leer',
    'reportes:leer',
    'reportes:generar',
    'dashboard:leer',
];

const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
    admin: ALL_PERMISSIONS,
    estacion: ['tanques:leer', 'inventario:leer', 'inventario:escribir', 'precios:leer', 'decretos:leer', 'auditoria:leer', 'reportes:leer', 'reportes:generar', 'dashboard:leer'],
    distribuidor: ['actores:leer', 'inventario:leer', 'inventario:escribir', 'precios:leer', 'decretos:leer', 'auditoria:leer', 'reportes:leer', 'reportes:generar', 'dashboard:leer'],
    regulador: ['precios:leer', 'zonas:leer', 'decretos:leer', 'reportes:leer', 'dashboard:leer', 'auditoria:leer'],
    auditor: ['auditoria:leer', 'reportes:leer', 'dashboard:leer'],
    particular: ['precios:leer', 'dashboard:leer'],
    distribuidor_regulado: ['inventario:leer', 'inventario:escribir', 'precios:leer', 'decretos:leer', 'auditoria:leer', 'reportes:leer', 'reportes:generar', 'dashboard:leer'],
};

const LEGACY_PERMISSION_MAP: Record<string, string[]> = {
    all: ALL_PERMISSIONS,
    'transacciones:leer': ['inventario:leer'],
    'transacciones:escribir': ['inventario:escribir'],
    'entregas:leer': ['inventario:leer'],
    'entregas:escribir': ['inventario:escribir'],
    'normativa:leer': ['decretos:leer'],
};

function unique(values: string[]) {
    return [...new Set(values.filter(Boolean))].sort();
}

export function normalizePermissions(roleName?: string, permisos?: unknown): string[] {
    const base = roleName ? ROLE_DEFAULT_PERMISSIONS[roleName] || [] : [];
    const raw = Array.isArray(permisos)
        ? permisos.filter((value): value is string => typeof value === 'string')
        : [];

    const expanded = raw.flatMap((permiso) => LEGACY_PERMISSION_MAP[permiso] || [permiso]);
    const normalized = unique([...base, ...expanded]);

    return normalized.includes('all') ? [...ALL_PERMISSIONS] : normalized;
}

export function hasAnyPermission(userPermissions: string[] | undefined, requiredPermissions: string[]) {
    if (!requiredPermissions.length) {
        return true;
    }

    const normalizedUserPermissions = normalizePermissions(undefined, userPermissions);
    return requiredPermissions.some((permission) => normalizedUserPermissions.includes(permission));
}

export { ALL_PERMISSIONS, ROLE_DEFAULT_PERMISSIONS };