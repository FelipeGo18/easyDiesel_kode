import { useAuth } from '@/context/AuthContext';
import { KpiCard } from '@/components/ui/KpiCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
    Fuel,
    BarChart2,
    MapPin,
    AlertTriangle,
    LayoutDashboard,
    Users,
    FileText,
    Shield,
    ArrowRight,
    Activity,
    Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/* ── Module grid items ── */
const modules = [
    {
        id: 'M3',
        label: 'Gestión de Estación',
        description: 'Entradas, salidas y control de tanques',
        icon: Fuel,
        path: '/estacion',
        color: 'text-amber-500',
    },
    {
        id: 'M4',
        label: 'Precios y Zonas',
        description: 'Precios vigentes por decreto y zona',
        icon: MapPin,
        path: '/precios',
        color: 'text-blue-500',
    },
    {
        id: 'M5',
        label: 'Normativa',
        description: 'Decretos y reglas regulatorias',
        icon: FileText,
        path: '/normativa',
        color: 'text-yellow-500',
    },
    {
        id: 'M6',
        label: 'Reportes',
        description: 'Informes PDF/Excel para el Ministerio',
        icon: BarChart2,
        path: '/reportes',
        color: 'text-green-500',
    },
    {
        id: 'M7',
        label: 'Auditoría',
        description: 'Registro inmutable de operaciones',
        icon: Shield,
        path: '/auditoria',
        color: 'text-red-500',
    },
    {
        id: 'M2',
        label: 'Usuarios',
        description: 'Gestión de actores del sistema',
        icon: Users,
        path: '/usuarios',
        color: 'text-amber-500',
    },
];

/* ── Recent activity (mock) ── */
const recentActivity = [
    {
        id: '1',
        action: 'Despacho registrado',
        detail: 'ABC-123 · 12.5 gal ACPM',
        time: 'Hace 3 min',
        status: 'green' as const,
    },
    {
        id: '2',
        action: 'Entrega confirmada',
        detail: 'Terpel → Tanque T-02',
        time: 'Hace 18 min',
        status: 'blue' as const,
    },
    {
        id: '3',
        action: 'Alerta de nivel bajo',
        detail: 'Tanque T-01 — 15% capacidad',
        time: 'Hace 42 min',
        status: 'red' as const,
    },
    {
        id: '4',
        action: 'Precio actualizado',
        detail: 'Zona Centro · Dec. 1428/2025',
        time: 'Hace 2 hrs',
        status: 'yellow' as const,
    },
];

export function DashboardPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Lógica de visualización condicional basada en roles
    const rolNombre = typeof user?.rol === 'object' ? user.rol.nombre : user?.rol;
    const isParticular = rolNombre === 'particular';

    // Filtrar módulos según permisos (simplificado por ahora)
    const availableModules = modules.filter(m => {
        if (isParticular) return false; // El particular no debería estar aquí, pero por seguridad
        if (rolNombre === 'admin') return true;
        
        // Reglas específicas por rol
        if (rolNombre === 'estacion') return ['M3', 'M6'].includes(m.id);
        if (rolNombre === 'distribuidor') return ['M3', 'M6'].includes(m.id);
        if (rolNombre === 'regulador') return ['M4', 'M5', 'M6', 'M7'].includes(m.id);
        if (rolNombre === 'auditor') return ['M6', 'M7'].includes(m.id);
        
        return false;
    });

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Buenos días';
        if (hour < 18) return 'Buenas tardes';
        return 'Buenas noches';
    };

    return (
        <div className="space-y-6 animate-enter">
            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-h1 text-text-primary">
                        {greeting()}, {user?.nombre?.split(' ')[0] || 'Usuario'}
                    </h1>
                    <p className="text-small text-text-secondary mt-1">
                        Resumen de operaciones de la plataforma
                    </p>
                </div>

                <Badge variant="green">
                    <Activity size={10} className="mr-1" />
                    Sistema operativo
                </Badge>
            </div>

            {/* ── KPI Grid ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    label="Galones hoy"
                    value="1,284"
                    icon={<Fuel size={18} strokeWidth={1.5} />}
                    trend={{ direction: 'up', text: '+8.3% vs ayer' }}
                    delay={0}
                />
                <KpiCard
                    label="Transacciones"
                    value="47"
                    icon={<BarChart2 size={18} strokeWidth={1.5} />}
                    trend={{ direction: 'up', text: '+12 vs ayer' }}
                    delay={50}
                />
                <KpiCard
                    label="Estaciones activas"
                    value="6"
                    icon={<MapPin size={18} strokeWidth={1.5} />}
                    trend={{ direction: 'neutral', text: 'Sin cambios' }}
                    delay={100}
                />
                <KpiCard
                    label="Alertas"
                    value="2"
                    icon={<AlertTriangle size={18} strokeWidth={1.5} />}
                    trend={{ direction: 'down', text: '-3 vs ayer' }}
                    delay={150}
                />
            </div>

            {/* ── Bottom grid: Modules + Activity ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Modules grid */}
                <div className="lg:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                        <LayoutDashboard size={16} strokeWidth={1.5} className="text-amber-500" />
                        <h2 className="text-h2 text-text-primary">Módulos</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                        {availableModules.map((mod, i) => {
                            const Icon = mod.icon;
                            return (
                                <Card
                                    key={mod.id}
                                    variant="interactive"
                                    className="animate-enter group rounded-brand"
                                    style={{ animationDelay: `${(i + 1) * 60}ms` }}
                                    onClick={() => navigate(mod.path)}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="p-2 rounded-[var(--radius-brand)] bg-bg-hover">
                                            <Icon size={20} strokeWidth={1.5} className={mod.color} />
                                        </div>
                                        <span className="text-[9px] font-mono text-text-muted tracking-wider">
                                            {mod.id}
                                        </span>
                                    </div>

                                    <h3 className="text-[14px] font-heading font-bold text-text-primary mb-1 tracking-tight">
                                        {mod.label}
                                    </h3>
                                    <p className="text-[12px] text-text-secondary leading-relaxed mb-3">
                                        {mod.description}
                                    </p>

                                    <div className="flex items-center text-[10px] font-mono text-text-muted group-hover:text-amber-500 transition-colors uppercase tracking-wider">
                                        Abrir módulo
                                        <ArrowRight size={10} className="ml-1 transition-transform group-hover:translate-x-0.5" />
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* Recent activity */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Clock size={16} strokeWidth={1.5} className="text-amber-500" />
                        <h2 className="text-h2 text-text-primary">Actividad reciente</h2>
                    </div>

                    <Card className="p-0 overflow-hidden">
                        <div className="divide-y divide-border-subtle">
                            {recentActivity.map((item, i) => (
                                <div
                                    key={item.id}
                                    className="px-4 py-3.5 hover:bg-bg-hover interactive animate-enter"
                                    style={{ animationDelay: `${(i + 1) * 80}ms` }}
                                >
                                    <div className="flex items-start gap-3">
                                        <Badge variant={item.status} className="mt-0.5 shrink-0">
                                            {item.status === 'green' ? '✓' : item.status === 'red' ? '!' : item.status === 'blue' ? 'i' : '⚠'}
                                        </Badge>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] text-text-primary font-sans">{item.action}</p>
                                            <p className="text-[11px] font-mono text-text-secondary mt-0.5 truncate">
                                                {item.detail}
                                            </p>
                                        </div>
                                        <span className="text-[9px] font-mono text-text-muted whitespace-nowrap">
                                            {item.time}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
