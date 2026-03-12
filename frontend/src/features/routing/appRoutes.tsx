import type { ReactElement } from 'react';
import { HomePage } from '@/pages/HomePage';
import { StationsAtlasPage } from '@/pages/StationsAtlasPage';
import { EconomicRoutePage } from '@/pages/EconomicRoutePage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ReportesPage } from '@/pages/ReportesPage';
import { AuditoriaPage } from '@/pages/AuditoriaPage';
import { ZonasPage } from '@/pages/admin/ZonasPage';
import { DecretosPage } from '@/pages/admin/DecretosPage';
import { PreciosPage } from '@/pages/admin/PreciosPage';
import { UsuariosPage } from '@/pages/admin/UsuariosPage';
import { InventarioPage } from '@/pages/admin/InventarioPage';
import { ActoresPage } from '@/pages/admin/ActoresPage';
import { TanquesPage } from '@/pages/admin/TanquesPage';
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
        path: '/dashboard',
        element: <DashboardPage />,
        label: 'Dashboard',
        icon: 'dashboard',
        moduleId: 'M8',
        description: 'Resumen operativo y alertas del sistema',
        requiredPermissions: ['dashboard:leer'],
        showInNavigation: true,
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
        excludeRoles: ['estacion', 'despachador'],
    },
    {
        path: '/tanques',
        element: <TanquesPage />,
        label: 'Tanques',
        icon: 'tank',
        moduleId: 'M2',
        description: 'Gestión física y niveles de almacenamiento',
        requiredPermissions: ['tanques:leer', 'tanques:escribir'],
        showInNavigation: true,
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
        excludeRoles: ['estacion', 'despachador'],
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
    },
    {
        path: '/estacion',
        element: <InventarioPage />,
        label: 'Inventario',
        icon: 'station',
        moduleId: 'M3',
        description: 'Entradas, salidas y cierres operativos',
        requiredPermissions: ['inventario:leer', 'inventario:escribir'],
        showInNavigation: true,
    },
    {
        path: '/reportes',
        element: <ReportesPage />,
        label: 'Reportes',
        icon: 'reports',
        moduleId: 'M6',
        description: 'Informes y exportes oficiales',
        requiredPermissions: ['reportes:leer', 'reportes:generar'],
        showInNavigation: true,
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
    },
];

export const navigationRoutes = protectedRoutes.filter((route) => route.showInNavigation);