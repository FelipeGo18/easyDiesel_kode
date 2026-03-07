import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/useAuth';
import { KpiCard } from '@/components/ui/KpiCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import {
    ArrowRight,
    Activity,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dashboardService, type DashboardSummary, type DashboardAlert, type DashboardRecentOperation } from '@/services/dashboard';
import { useToast } from '@/components/ui/useToast';
import { navigationRoutes } from '@/features/routing/appRoutes';
import { useAccess } from '@/hooks/useAccess';
import { getErrorMessage } from '@/lib/http';

export function DashboardPage() {
    const { user } = useAuth();
    const { hasAnyPermission } = useAccess();
    const navigate = useNavigate();
    const toast = useToast();
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await dashboardService.getSummary();
            setSummary(data);
        } catch (error: unknown) {
            toast.error(`Error al cargar resumen: ${getErrorMessage(error)}`);
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Lógica de visualización condicional basada en roles
    const availableModules = navigationRoutes.filter((route) => route.path !== '/dashboard' && hasAnyPermission(...(route.requiredPermissions || [])));

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Buenos días';
        if (hour < 18) return 'Buenas tardes';
        return 'Buenas noches';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 bg-bg-elevated rounded-full mb-4" />
                    <div className="h-4 w-32 bg-bg-elevated rounded mb-2" />
                    <div className="h-3 w-48 bg-bg-elevated rounded" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-enter">
            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-h1 text-text-primary">
                        {greeting()}, {user?.nombre?.split(' ')[0] || 'Usuario'}
                    </h1>
                    <p className="text-small text-text-secondary mt-1">
                        Resumen de operaciones de la plataforma - {user?.estacion?.nombre || 'Panel Administrativo'}
                    </p>
                </div>

                <Badge variant="green">
                    <Activity size={10} className="mr-1" />
                    Sistema en línea
                </Badge>
            </div>

            {/* ── KPI Grid ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    label="Ventas totales"
                    value={summary?.operaciones.transacciones.toLocaleString() || '0'}
                    icon={<img src="/icons/activity.svg" alt="Ventas" className="w-[18px] h-[18px]" />}
                    trend={{ direction: 'up', text: 'Transacciones registradas' }}
                    delay={0}
                />
                <KpiCard
                    label="Abastecimientos"
                    value={summary?.operaciones.entregas.toLocaleString() || '0'}
                    icon={<img src="/icons/truck.svg" alt="Entradas" className="w-[18px] h-[18px]" />}
                    trend={{ direction: 'up', text: 'Entradas de combustible' }}
                    delay={50}
                />
                <KpiCard
                    label="Estaciones"
                    value={summary?.estaciones.toLocaleString() || '0'}
                    icon={<img src="/icons/station.svg" alt="Estaciones" className="w-[18px] h-[18px]" />}
                    trend={{ direction: 'neutral', text: 'Puntos de servicio' }}
                    delay={100}
                />
                <KpiCard
                    label="Alertas Stock"
                    value={summary?.inventario.tanquesEnAlerta.toLocaleString() || '0'}
                    icon={<img src="/icons/alert.svg" alt="Alerta" className="w-[18px] h-[18px] opacity-80" />}
                    trend={{ direction: summary?.inventario.tanquesEnAlerta ? 'down' : 'neutral', text: 'Tanques bajo mínimo' }}
                    delay={150}
                    className={summary?.inventario.tanquesEnAlerta ? 'border-red-500/50' : ''}
                />
            </div>

            {/* ── Bottom grid: Modules + Activity ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Modules grid */}
                <div className="lg:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                        <img src="/icons/dashboard.svg" alt="Módulos" className="w-5 h-5" />
                        <h2 className="text-h2 text-text-primary">Módulos</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                        {availableModules.map((mod, i) => {
                            return (
                                <Card
                                    key={mod.path}
                                    variant="interactive"
                                    className="animate-enter group rounded-brand"
                                    style={{ animationDelay: `${(i + 1) * 60}ms` }}
                                    onClick={() => navigate(mod.path)}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="p-2 rounded-brand bg-bg-hover">
                                            <Icon name={mod.icon || 'dashboard'} size={20} className="text-amber-500" />
                                        </div>
                                        <span className="text-[9px] font-mono text-text-muted tracking-wider">
                                            {mod.moduleId}
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
                        <img src="/icons/history.svg" alt="Reciente" className="w-5 h-5" />
                        <h2 className="text-h2 text-text-primary">Actividad reciente</h2>
                    </div>

                    <Card className="p-0 overflow-hidden">
                        <div className="divide-y divide-border-subtle">
                            {(!summary?.operaciones?.recientes || summary.operaciones.recientes.length === 0) && (
                                <div className="p-8 text-center text-text-muted text-[12px]">
                                    No hay transacciones recientes
                                </div>
                            )}
                            {summary?.operaciones?.recientes?.map((item: DashboardRecentOperation, i: number) => (
                                <div
                                    key={item.id}
                                    className="px-4 py-3.5 hover:bg-bg-hover interactive animate-enter"
                                    style={{ animationDelay: `${(i + 1) * 80}ms` }}
                                >
                                    <div className="flex items-start gap-3">
                                        <Badge variant={item.tipo === 'SALIDA' ? 'amber' : 'green'} className="mt-0.5 shrink-0 px-1 py-0 min-w-[20px] text-center">
                                            {item.tipo === 'SALIDA' ? '↓' : '↑'}
                                        </Badge>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] text-text-primary font-sans">
                                                {item.tipo === 'SALIDA' ? 'Venta registrada' : 'Abastecimiento'}
                                            </p>
                                            <p className="text-[11px] font-mono text-text-secondary mt-0.5 truncate">
                                                {item.estacion?.nombre || '—'} · {Number(item.galones).toLocaleString()} gal {item.tanque?.tipoCombustible || ''}
                                            </p>
                                        </div>
                                        <span className="text-[9px] font-mono text-text-muted whitespace-nowrap">
                                            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {summary?.inventario?.alertas && summary.inventario.alertas.length > 0 && (
                        <div className="mt-4">
                            <div className="flex items-center gap-2 mb-3">
                                <img src="/icons/alert.svg" alt="Alertas" className="w-[16px] h-[16px]" />
                                <h2 className="text-h2 text-text-primary text-[14px]">Alertas de Inventario</h2>
                            </div>
                            <div className="space-y-2">
                                {summary.inventario.alertas.map((alerta: DashboardAlert) => (
                                    <Card key={alerta.id} className="p-3 bg-red-500/5 border-red-500/20">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-[13px] font-bold text-red-600">{alerta.nombre}</p>
                                                <p className="text-[11px] text-text-secondary">{alerta.estacion_nombre}</p>
                                            </div>
                                            <Badge variant="red">{Math.round((Number(alerta.nivel_actual) / (Number(alerta.capacidad_galones) || 1)) * 100)}%</Badge>
                                        </div>
                                        <p className="text-[11px] mt-2 text-text-muted">
                                            Actual: <span className="text-red-600 font-bold">{Number(alerta.nivel_actual).toLocaleString()} gal</span> / Min: {Number(alerta.nivel_minimo).toLocaleString()} gal
                                        </p>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
