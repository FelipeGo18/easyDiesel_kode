import type { ReactElement } from 'react';
import { HomePage } from '@/pages/HomePage';
import { StationsAtlasPage } from '@/pages/StationsAtlasPage';
import { EconomicRoutePage } from '@/pages/EconomicRoutePage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { PanelPage } from '@/pages/PanelPage';
import { AnaliticaPage } from '@/pages/AnaliticaPage';
import { AuditoriaPage } from '@/pages/AuditoriaPage';
import { ZonasPage } from '@/pages/admin/ZonasPage';
import { DecretosPage } from '@/pages/admin/DecretosPage';
import { PreciosPage } from '@/pages/admin/PreciosPage';
import { UsuariosPage } from '@/pages/admin/UsuariosPage';
import { InventarioPage } from '@/pages/admin/InventarioPage';
import { ActoresPage } from '@/pages/admin/ActoresPage';
import { PerfilPage } from '@/pages/PerfilPage';

export interface AppRouteConfig {
    path: string;
    element: ReactElement;
    public?: boolean;
    label?: string;
    icon?: string;
    moduleId?: string;
    description?: string;
    requiredPermissions?: string[];
    showInNavigation?: boolean;
    /** Role names that should NOT see this item in the sidebar nav */
    excludeRoles?: string[];
}

export const publicRoutes: AppRouteConfig[] = [
    { path: '/', element: <HomePage />, public: true },
    { path: '/atlas-estaciones', element: <StationsAtlasPage />, public: true },
    { path: '/ruta-economica', element: <EconomicRoutePage />, public: true },
    { path: '/login', element: <LoginPage />, public: true },
    { path: '/register', element: <RegisterPage />, public: true },
];

export const protectedRoutes: AppRouteConfig[] = [
    {
        path: '/perfil',
        element: <PerfilPage />,
        label: 'Mi Perfil',
        description: 'Editar información personal y contraseña',
        showInNavigation: false,
    },
    {
        path: '/panel',
        element: <PanelPage />,
        label: 'Panel principal',
        icon: 'dashboard',
        moduleId: 'M8',
        description: 'Área de trabajo principal del rol',
        requiredPermissions: ['panel:leer'],
        showInNavigation: true,
    },
    {
        path: '/analitica',
        element: <AnaliticaPage />,
        label: 'Analítica y Reportes',
        icon: 'activity',
        moduleId: 'M9',
        description: 'Métricas clave y centro de reportes',
        requiredPermissions: ['estadisticas:leer', 'reportes:leer'],
        showInNavigation: true,
        excludeRoles: ['distribuidor', 'distribuidor_regulado'],
    },
    {
        path: '/zonas',
        element: <ZonasPage />,
        label: 'Zonas',
        icon: 'map',
        moduleId: 'M4',
        description: 'Configuración territorial y cobertura regulatoria',
        requiredPermissions: ['zonas:leer', 'zonas:escribir'],
        showInNavigation: true,
        excludeRoles: ['distribuidor', 'distribuidor_regulado', 'estacion', 'despachador'],
    },
    {
        path: '/actores',
        element: <ActoresPage />,
        label: 'Actores',
        icon: 'station',
        moduleId: 'M1',
        description: 'Estaciones y distribuidores registrados',
        requiredPermissions: ['actores:leer', 'actores:escribir'],
        showInNavigation: true,
        excludeRoles: ['distribuidor', 'distribuidor_regulado', 'estacion', 'despachador'],
    },
    {
        path: '/precios',
        element: <PreciosPage />,
        label: 'Precios',
        icon: 'prices',
        moduleId: 'M4',
        description: 'Tarifas vigentes por zona y tipo de servicio',
        requiredPermissions: ['precios:leer', 'precios:escribir'],
        showInNavigation: true,
        excludeRoles: ['distribuidor', 'distribuidor_regulado', 'estacion', 'despachador'],
    },
    {
        path: '/normativa',
        element: <DecretosPage />,
        label: 'Normativa',
        icon: 'normativa',
        moduleId: 'M5',
        description: 'Decretos y reglas regulatorias aplicables',
        requiredPermissions: ['decretos:leer', 'decretos:escribir'],
        showInNavigation: true,
        excludeRoles: ['distribuidor', 'distribuidor_regulado', 'estacion', 'despachador'],
    },
    {
        path: '/usuarios',
        element: <UsuariosPage />,
        label: 'Usuarios',
        icon: 'users',
        moduleId: 'M2',
        description: 'Accesos, roles y gobierno de usuarios',
        requiredPermissions: ['usuarios:leer', 'usuarios:escribir'],
        showInNavigation: true,
        excludeRoles: ['distribuidor', 'distribuidor_regulado', 'estacion', 'despachador'],
    },
    {
        path: '/estacion',
        element: <InventarioPage />,
        label: 'Inventario y Tanques',
        icon: 'tank',
        moduleId: 'M3',
        description: 'Gestión de tanques, entradas y salidas de combustible',
        requiredPermissions: ['inventario:leer', 'inventario:escribir'],
        showInNavigation: true,
        excludeRoles: ['distribuidor', 'distribuidor_regulado'],
    },

    {
        path: '/auditoria',
        element: <AuditoriaPage />,
        label: 'Auditoría',
        icon: 'audit',
        moduleId: 'M7',
        description: 'Trazabilidad de operaciones y cambios',
        requiredPermissions: ['auditoria:leer'],
        showInNavigation: true,
        excludeRoles: ['distribuidor', 'distribuidor_regulado', 'estacion', 'despachador'],
    },
];

export const navigationRoutes = protectedRoutes.filter((route) => route.showInNavigation);