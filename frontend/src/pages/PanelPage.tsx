import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/useAuth';
import { KpiCard } from '@/components/ui/KpiCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import {
    ArrowRight,
    Activity,
    History,
    ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { dashboardService, type DashboardSummary, type DashboardAlert, type DashboardRecentOperation } from '@/services/dashboard';
import { useToast } from '@/components/ui/useToast';
import { navigationRoutes } from '@/features/routing/appRoutes';
import { useAccess } from '@/hooks/useAccess';
import { getErrorMessage } from '@/lib/http';
import { StationOperationsPage } from '@/pages/DespachadorPanelPage';
import { DistribuidorPanelPage } from '@/pages/DistribuidorPanelPage';
import { ParticularPanelPage } from '@/pages/ParticularPanelPage';
import { ReguladorPanelPage } from '@/pages/ReguladorPanelPage';
import { AuditorPanelPage } from '@/pages/AuditorPanelPage';

export function PanelPage() {
    const { user } = useAuth();
    const { hasAnyPermission, roleName } = useAccess();
    const navigate = useNavigate();
    const toast = useToast();
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        // Roles with dedicated panels don't use this admin dashboard data
        if (roleName === 'estacion' || roleName === 'distribuidor' || roleName === 'distribuidor_regulado' || roleName === 'particular' || roleName === 'regulador' || roleName === 'auditor') return;
        try {
            setLoading(true);
            const data = await dashboardService.getSummary();
            setSummary(data);
        } catch (error: unknown) {
            toast.error(`Error al cargar resumen: ${getErrorMessage(error)}`);
        } finally {
            setLoading(false);
        }
    }, [roleName, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (roleName === 'estacion') {
        return <StationOperationsPage />;
    }

    if (roleName === 'distribuidor' || roleName === 'distribuidor_regulado') {
        return <DistribuidorPanelPage />;
    }

    if (roleName === 'particular') {
        return <ParticularPanelPage />;
    }

    if (roleName === 'regulador') {
        return <ReguladorPanelPage />;
    }

    if (roleName === 'auditor') {
        return <AuditorPanelPage />;
    }
// prueba logica dashbotd
    // Lógica de visualización condicional basada en roles
    const availableModules = navigationRoutes.filter((route) => route.path !== '/panel' && hasAnyPermission(...(route.requiredPermissions || [])));

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
        <div className="space-y-8 animate-enter pb-12 max-w-[1440px] mx-auto">
            {/* ── Header Pro Max ── */}
            <section className="relative overflow-hidden rounded-[32px] bg-bg-surface border border-border-subtle p-8 md:p-10 shadow-2xl group transition-all duration-500 hover:border-white/10">
                {/* Background effects */}
                <div className="absolute top-0 right-0 w-1/2 h-full bg-linear-to-bl from-blue-500/10 via-transparent to-transparent opacity-50 pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-amber-500/5 blur-[100px] rounded-full pointer-events-none" />
                
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
                                <Activity className="w-3.5 h-3.5 text-blue-500" />
                                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Sistema: Operativo</span>
                            </div>
                            <div className="flex items-center gap-2 bg-bg-elevated border border-border-subtle px-3 py-1 rounded-full">
                                <Badge variant="green" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[8px] px-2 py-0.5">ONLINE</Badge>
                            </div>
                        </div>
                        
                        <div>
                            <h1 className="text-4xl md:text-5xl font-display font-bold text-text-primary tracking-tight">
                                {greeting()}, <span className="text-blue-500">{user?.nombre?.split(' ')[0] || 'Administrador'}</span>
                            </h1>
                            <p className="mt-3 text-base text-text-secondary max-w-2xl leading-relaxed">
                                Bienvenido al centro de control operativo de <span className="text-text-primary font-bold">EasyDiesel</span>. 
                                Gestione estaciones, monitoree inventarios y analice transacciones desde una interfaz de alta integridad.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 min-w-[200px]">
                        <div className="text-[10px] text-text-muted uppercase font-bold tracking-widest mb-1 px-1">Sesión Actual</div>
                        <div className="bg-bg-base/50 p-4 rounded-2xl border border-border-subtle backdrop-blur-sm">
                            <p className="text-sm font-bold text-text-primary">{user?.email}</p>
                            <p className="text-[10px] text-text-muted mt-1 font-mono uppercase">{roleName} · {user?.estacion?.nombre || 'Sede Central'}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Bento Grid de KPIs Pro Max ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <KpiCard
                    label="Ventas totales"
                    value={summary?.operaciones.transacciones.toLocaleString() || '0'}
                    icon={<img src="/icons/activity.svg" alt="Ventas" className="w-[20px] h-[20px]" />}
                    trend={{ direction: 'up', text: 'Transacciones' }}
                    className="bg-bg-surface border-border-subtle hover:border-white/10 transition-all duration-300 rounded-[24px]"
                    delay={0}
                />
                <KpiCard
                    label="Abastecimientos"
                    value={summary?.operaciones.entregas.toLocaleString() || '0'}
                    icon={<img src="/icons/truck.svg" alt="Entradas" className="w-[20px] h-[20px]" />}
                    trend={{ direction: 'up', text: 'Cargas registradas' }}
                    className="bg-bg-surface border-border-subtle hover:border-white/10 transition-all duration-300 rounded-[24px]"
                    delay={50}
                />
                <KpiCard
                    label="Red de Estaciones"
                    value={summary?.estaciones.toLocaleString() || '0'}
                    icon={<img src="/icons/station.svg" alt="Estaciones" className="w-[20px] h-[20px]" />}
                    trend={{ direction: 'neutral', text: 'Puntos de servicio' }}
                    className="bg-bg-surface border-border-subtle hover:border-white/10 transition-all duration-300 rounded-[24px]"
                    delay={100}
                />
                <KpiCard
                    label="Estado Inventario"
                    value={summary?.inventario.tanquesEnAlerta.toLocaleString() || '0'}
                    icon={<img src="/icons/alert.svg" alt="Alerta" className="w-[20px] h-[20px] opacity-80" />}
                    trend={{ direction: summary?.inventario.tanquesEnAlerta ? 'down' : 'neutral', text: 'Tanques en alerta' }}
                    delay={150}
                    className={cn(
                        "bg-bg-surface border-border-subtle hover:border-white/10 transition-all duration-300 rounded-[24px]",
                        summary?.inventario.tanquesEnAlerta ? 'border-red-500/50 bg-red-500/5' : ''
                    )}
                />
            </div>

            {/* ── Main Layout Grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Modules grid */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                <img src="/icons/dashboard.svg" alt="Módulos" className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-text-primary tracking-tight">Módulos de Gestión</h2>
                        </div>
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">{availableModules.length} Disponibles</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {availableModules.map((mod, i) => {
                            return (
                                <Card
                                    key={mod.path}
                                    variant="interactive"
                                    className="animate-enter group rounded-[24px] p-6 border-border-subtle hover:border-white/10 transition-all duration-300 flex flex-col justify-between h-full"
                                    style={{ animationDelay: `${(i + 1) * 60}ms` }}
                                    onClick={() => navigate(mod.path)}
                                >
                                    <div>
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="p-3 bg-bg-base rounded-xl border border-border-subtle group-hover:border-white/10 transition-all">
                                                <Icon name={mod.icon || 'dashboard'} size={24} className="text-text-secondary group-hover:text-text-primary transition-colors" />
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ArrowRight size={16} className="text-text-secondary" />
                                            </div>
                                        </div>
                                        <h3 className="text-base font-bold text-text-primary mb-2">
                                            {mod.label}
                                        </h3>
                                        <p className="text-xs text-text-secondary leading-relaxed mb-6">
                                            {mod.description}
                                        </p>
                                    </div>

                                    <div className="flex items-center text-[10px] font-bold text-text-muted group-hover:text-blue-500 transition-colors uppercase tracking-widest pt-4 border-t border-border-subtle/50">
                                        Acceder ahora
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* Side Stream: Activity & Alerts */}
                <div className="space-y-8">
                    {/* Recent activity */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 px-2">
                            <History className="w-4 h-4 text-amber-500" />
                            <h3 className="text-xs font-bold text-text-muted uppercase tracking-[0.2em]">Actividad Reciente</h3>
                        </div>

                        <Card className="p-0 overflow-hidden border-border-subtle bg-bg-surface shadow-lg rounded-[24px]">
                            <div className="divide-y divide-border-subtle/50">
                                {(!summary?.operaciones?.recientes || summary.operaciones.recientes.length === 0) && (
                                    <div className="p-12 text-center text-text-muted text-[12px] italic">
                                        No se registran movimientos recientes
                                    </div>
                                )}
                                {summary?.operaciones?.recientes?.map((item: DashboardRecentOperation, i: number) => (
                                    <div
                                        key={item.id}
                                        className="px-5 py-4 hover:bg-bg-elevated/30 interactive transition-all group"
                                        style={{ animationDelay: `${(i + 1) * 80}ms` }}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={cn(
                                                "mt-1 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border",
                                                item.tipo === 'SALIDA' 
                                                    ? "bg-amber-500/10 text-amber-500 border-amber-500/20" 
                                                    : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                            )}>
                                                {item.tipo === 'SALIDA' ? '↓' : '↑'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <p className="text-[13px] text-text-primary font-bold">
                                                        {item.tipo === 'SALIDA' ? 'Venta' : 'Abastecimiento'}
                                                    </p>
                                                    <span className="text-[9px] font-mono text-text-muted">
                                                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-text-secondary mt-1 truncate">
                                                    {item.estacion?.nombre || '—'}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Badge variant="blue" className="text-[8px] font-mono px-1.5 py-0">{Number(item.galones).toLocaleString()} GAL</Badge>
                                                    <span className="text-[9px] text-text-muted font-medium">{item.tanque?.tipoCombustible || 'Combustible'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 bg-bg-elevated/20 border-t border-border-subtle text-center">
                                <button onClick={() => navigate('/auditoria')} className="text-[10px] font-bold text-blue-500 uppercase tracking-widest hover:underline">Ver bitácora completa</button>
                            </div>
                        </Card>
                    </div>

                    {/* Alertas Críticas */}
                    {summary?.inventario?.alertas && summary.inventario.alertas.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 px-2">
                                <ShieldAlert className="w-4 h-4 text-red-500" />
                                <h3 className="text-xs font-bold text-text-muted uppercase tracking-[0.2em]">Alertas Críticas</h3>
                            </div>
                            <div className="space-y-3">
                                {summary.inventario.alertas.map((alerta: DashboardAlert) => (
                                    <Card key={alerta.id} className="p-5 bg-red-500/5 border-red-500/20 rounded-[24px] relative overflow-hidden group hover:border-white/10 transition-all">
                                        <div className="absolute -right-4 -top-4 opacity-10">
                                            <ShieldAlert size={80} className="text-red-500" />
                                        </div>
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="text-sm font-black text-red-600 uppercase tracking-tight">{alerta.nombre}</p>
                                                    <p className="text-[10px] text-text-secondary font-medium mt-0.5">{alerta.estacion_nombre}</p>
                                                </div>
                                                <Badge variant="red" className="animate-pulse">NIVEL CRÍTICO</Badge>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-[10px] font-bold">
                                                    <span className="text-text-muted uppercase">Capacidad Actual</span>
                                                    <span className="text-red-600">{Math.round((Number(alerta.nivel_actual) / (Number(alerta.capacidad_galones) || 1)) * 100)}%</span>
                                                </div>
                                                <div className="w-full bg-red-500/10 h-1.5 rounded-full overflow-hidden">
                                                    <div 
                                                        className="bg-red-600 h-full rounded-full transition-all duration-1000" 
                                                        style={{ width: `${(Number(alerta.nivel_actual) / (Number(alerta.capacidad_galones) || 1)) * 100}%` }}
                                                    />
                                                </div>
                                                <p className="text-[11px] text-text-muted pt-1">
                                                    <span className="text-red-600 font-bold">{Number(alerta.nivel_actual).toLocaleString()} gal</span> restantes de {Number(alerta.capacidad_galones).toLocaleString()} gal
                                                </p>
                                            </div>
                                        </div>
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
