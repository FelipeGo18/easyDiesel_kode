import { useCallback, useEffect, useState } from 'react';
import { 
    ShieldCheck, 
    AlertTriangle, 
    UserCheck, 
    Activity,
    Lock,
    Search,
    Download,
    Eye,
    History,
    ChevronRight
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { KpiCard } from '@/components/ui/KpiCard';
import { useToast } from '@/components/ui/useToast';
import { getErrorMessage } from '@/lib/http';
import api from '@/services/api';
import type { PaginatedResponse } from '@/types';
import { useNavigate } from 'react-router-dom';

interface AuditoriaSummary {
    totalLogs: number;
    logsUltimas24h: number;
    usuariosActivos: number;
    alertasSeguridad: number;
    actividadReciente: Array<{
        id: string;
        usuario: string;
        accion: string;
        modulo: string;
        fecha: string;
        ip: string;
    }>;
}

export function AuditorPanelPage() {
    const toast = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<AuditoriaSummary | null>(null);

    const fetchAuditorData = useCallback(async () => {
        setLoading(true);
        try {
            // Obtener logs recientes de TODOS los módulos
            const response = await api.get<PaginatedResponse<any>>('/auditoria', { 
                params: { limit: 10 } // Aumentamos un poco el límite para el resumen
            });
            
            const logs = response.data.data || [];
            
            // Calcular estadísticas basadas en los logs reales
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            
            const logsHoy = logs.filter(l => new Date(l.createdAt) >= hoy).length;
            const alertas = logs.filter(l => 
                l.accion.includes('DELETE') || 
                l.accion.includes('ERROR') || 
                l.modulo === 'AUTH' && l.accion.includes('LOGIN_FAIL')
            ).length;

            // Derive unique active users from the log entries instead of hardcoding
            const uniqueUsers = new Set(logs.map((l: any) => l.usuario?.id ?? l.usuario?.nombre).filter(Boolean));

            setSummary({
                totalLogs: response.data.pagination?.total || logs.length,
                logsUltimas24h: logsHoy,
                usuariosActivos: uniqueUsers.size,
                alertasSeguridad: alertas,
                actividadReciente: logs.slice(0, 6).map((l: any) => ({
                    id: l.id,
                    usuario: l.usuario?.nombre || 'Sistema',
                    accion: l.accion,
                    modulo: l.modulo,
                    fecha: l.createdAt,
                    ip: l.ip || '0.0.0.0'
                }))
            });
        } catch (error: unknown) {
            toast.error(`Error al cargar datos de auditoría: ${getErrorMessage(error)}`);
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const handleExportLog = async () => {
        try {
            const hoy = new Date().toISOString().split('T')[0];
            const response = await api.get('/auditoria', {
                params: { desde: hoy, limit: 1000 },
            });
            
            const data = response.data.data;
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `AuditLog_${hoy}.json`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Log del día exportado correctamente');
        } catch (error) {
            toast.error('Error al exportar log');
        }
    };

    const handleReviewCritical = () => {
        // Navegar a auditoría con filtro de acciones críticas
        navigate('/auditoria?modulo=AUTH&accion=LOGIN');
        toast.success('Filtrando por acciones críticas de acceso');
    };

    useEffect(() => { fetchAuditorData(); }, [fetchAuditorData]);

    return (
        <div className="space-y-6 animate-enter">
            {/* ── Header Enfocado en Seguridad ── */}
            <section className="relative overflow-hidden rounded-[28px] border border-amber-500/20 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.12),transparent_35%),linear-gradient(135deg,rgba(15,15,13,1) 0%,rgba(10,10,8,1) 50%,rgba(30,20,5,1) 100%)] p-6 sm:p-8">
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <Badge variant="amber" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                            ROL DE AUDITORÍA · SUPERVISIÓN TÉCNICA
                        </Badge>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-mono text-green-500 uppercase font-bold tracking-tight">Monitoreo Activo</span>
                        </div>
                    </div>
                    
                    <h1 className="text-3xl font-heading font-bold text-white tracking-tight">Centro de Control y Transparencia</h1>
                    <p className="mt-2 text-sm text-white/60 max-w-2xl leading-relaxed">
                        Bienvenido al panel de supervisión inmutable. Aquí puede monitorear la integridad del sistema, 
                        rastrear acciones de usuarios privilegiados y detectar anomalías operativas en tiempo real.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <button 
                            onClick={() => navigate('/auditoria')}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black rounded-xl text-sm font-bold hover:bg-amber-400 transition-all active:scale-95 shadow-lg shadow-amber-500/20"
                        >
                            <Search size={16} />
                            Rastreador de Logs
                        </button>
                        <button 
                            onClick={() => navigate('/analitica')}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-sm font-medium hover:bg-white/10 transition-all"
                        >
                            <Activity size={16} />
                            Análisis de Riesgos
                        </button>
                    </div>
                </div>
                
                {/* Background Decor */}
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <ShieldCheck size={180} className="text-amber-500" />
                </div>
            </section>

            {/* ── KPIs de Seguridad ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    label="Registros de Auditoría"
                    value={summary?.totalLogs.toLocaleString() || '0'}
                    icon={<History className="w-5 h-5 text-amber-500" />}
                    trend={{ direction: 'neutral', text: 'Histórico total' }}
                    delay={0}
                />
                <KpiCard
                    label="Actividad (24h)"
                    value={summary?.logsUltimas24h.toString() || '0'}
                    icon={<Activity className="w-5 h-5 text-blue-500" />}
                    trend={{ direction: 'up', text: 'Eventos recientes' }}
                    delay={100}
                />
                <KpiCard
                    label="Usuarios Recientes"
                    value={summary?.usuariosActivos.toString() || '0'}
                    icon={<UserCheck className="w-5 h-5 text-green-500" />}
                    trend={{ direction: 'neutral', text: 'Activos en los últimos registros' }}
                    delay={200}
                />
                <KpiCard
                    label="Alertas de Riesgo"
                    value={summary?.alertasSeguridad.toString() || '0'}
                    icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
                    trend={{ direction: 'down', text: 'Requieren revisión' }}
                    delay={300}
                    className={summary?.alertasSeguridad ? 'border-red-500/30 bg-red-500/5' : ''}
                />
            </div>

            {/* ── Main Content Grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* ── Últimos Eventos Críticos ── */}
                <Card className="lg:col-span-2 border-border-subtle overflow-hidden">
                    <div className="flex items-center justify-between p-5 border-b border-border-subtle bg-white/2">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-amber-500/10 rounded-lg">
                                <ShieldCheck size={18} className="text-amber-500" />
                            </div>
                            <h2 className="text-lg font-heading font-bold text-text-primary">Rastreo de Actividad Reciente</h2>
                        </div>
                        <button 
                            onClick={() => navigate('/auditoria')}
                            className="text-[11px] font-mono uppercase tracking-wider text-amber-500 hover:underline"
                        >
                            Ver todos los logs
                        </button>
                    </div>

                    <div className="p-0">
                        {loading ? (
                            <div className="p-12 text-center animate-pulse text-text-muted text-sm">Sincronizando rastro inmutable...</div>
                        ) : (
                            <div className="divide-y divide-border-subtle">
                                {summary?.actividadReciente.map((log) => (
                                    <div key={log.id} className="p-4 hover:bg-white/2 transition-colors flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-bg-elevated border border-border-default flex items-center justify-center text-[10px] font-bold text-amber-500">
                                                {log.usuario.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-text-primary">{log.usuario}</span>
                                                    <Badge variant="amber" className="text-[9px] py-0 px-1.5 border-border-default text-text-muted uppercase tracking-tighter">
                                                        {log.modulo}
                                                    </Badge>
                                                </div>
                                                <p className="text-[11px] text-text-secondary">
                                                    Realizó <span className="text-amber-400/80 font-mono uppercase text-[10px]">{log.accion}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="text-[11px] font-medium text-text-primary">
                                                {new Date(log.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <div className="text-[9px] font-mono text-text-muted">{log.ip}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>

                {/* ── Acceso Rápido y Herramientas ── */}
                <div className="space-y-6">
                    <Card className="border-border-subtle bg-linear-to-br from-bg-elevated to-bg-base">
                        <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                            <Lock size={14} className="text-amber-500" />
                            Controles de Auditoría
                        </h3>
                        <div className="grid grid-cols-1 gap-2">
                            <button 
                                onClick={handleExportLog}
                                className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5 hover:bg-white/6 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <Download size={16} className="text-text-muted group-hover:text-amber-500" />
                                    <span className="text-xs font-medium text-text-secondary">Exportar Log del Día</span>
                                </div>
                                <ChevronRight size={12} className="text-text-muted" />
                            </button>
                            <button 
                                onClick={handleReviewCritical}
                                className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5 hover:bg-white/6 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <Eye size={16} className="text-text-muted group-hover:text-amber-500" />
                                    <span className="text-xs font-medium text-text-secondary">Revisar Acciones Críticas</span>
                                </div>
                                <ChevronRight size={12} className="text-text-muted" />
                            </button>
                        </div>
                    </Card>

                    <Card className="border-border-subtle p-5 bg-amber-500/5 border-dashed">
                        <div className="flex items-center gap-3 mb-3">
                            <AlertTriangle size={18} className="text-amber-500" />
                            <h4 className="text-sm font-bold text-amber-500">Aviso de Integridad</h4>
                        </div>
                        <p className="text-[11px] text-text-secondary leading-relaxed">
                            Como auditor, sus acciones también son registradas de forma inmutable. 
                            Garantice que el acceso a reportes confidenciales cumpla con la política de 
                            privacidad de EasyDiesel.
                        </p>
                    </Card>
                </div>

            </div>
        </div>
    );
}
