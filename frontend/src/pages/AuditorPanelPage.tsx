import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ClipboardList, FileText, ShieldAlert } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { KpiCard } from '@/components/ui/KpiCard';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/useToast';
import { getErrorMessage } from '@/lib/http';
import api from '@/services/api';
import type { ApiResponse } from '@/types';

interface AuditoriaLog {
    id: string;
    modulo: string;
    accion: string;
    entidad: string;
    entidadId?: string;
    ip?: string;
    createdAt: string;
    usuario: { nombre: string; email: string };
}
//interface
interface AuditoriaResponse {
    data: AuditoriaLog[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
}

const MODULO_COLORS: Record<string, string> = {
    auth: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
    inventario: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    precios: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    decretos: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
    usuarios: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
    actores: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    tanques: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
    reportes: 'border-teal-500/30 bg-teal-500/10 text-teal-300',
    zonas: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300',
};

function moduloClass(modulo: string) {
    return MODULO_COLORS[modulo] ?? 'border-white/10 bg-white/5 text-white/60';
}

export function AuditorPanelPage() {
    const toast = useToast();
    const navigate = useNavigate();
    const [logs, setLogs] = useState<AuditoriaLog[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [modulosActivos, setModulosActivos] = useState(0);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get<ApiResponse<AuditoriaResponse>>('/auditoria', {
                params: { page: 1, limit: 25 },
            });
            const payload = res.data.data as AuditoriaResponse;
            const lista = payload.data ?? [];
            setLogs(lista);
            setTotal(payload.pagination?.total ?? lista.length);
            const mods = new Set(lista.map((l) => l.modulo));
            setModulosActivos(mods.size);
        } catch (error: unknown) {
            toast.error(`Error al cargar auditoría: ${getErrorMessage(error)}`);
        } finally {
            setLoading(false);
        }
    }, []); // toast excluded — stable ref

    useEffect(() => { fetchData(); }, [fetchData]);

    // Agrupar actividad por módulo
    const actividadPorModulo = logs.reduce<Record<string, number>>((acc, log) => {
        acc[log.modulo] = (acc[log.modulo] ?? 0) + 1;
        return acc;
    }, {});
    const topModulos = Object.entries(actividadPorModulo)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6);

    return (
        <div className="space-y-6 animate-enter">
            {/* ── Header ── */}
            <section className="relative overflow-hidden rounded-[28px] border border-violet-500/20 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.14),transparent_30%),linear-gradient(135deg,rgba(18,18,16,1)_0%,rgba(12,12,10,1)_55%,rgba(14,2,28,1)_100%)] p-6 sm:p-8">
                <div className="relative grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
                    <div>
                        <Badge variant="blue" className="mb-4">ROL AUDITOR · TRAZABILIDAD</Badge>
                        <h1 className="text-3xl font-semibold text-white">Centro de Auditoría</h1>
                        <p className="mt-2 text-sm text-white/65 max-w-2xl">
                            Rastrea todas las operaciones del sistema. Cada acción queda registrada con usuario, módulo, entidad e IP. Solo lectura.
                        </p>
                        <div className="mt-5 flex flex-wrap gap-3">
                            <Button
                                variant="ghost"
                                onClick={() => navigate('/auditoria')}
                                className="border border-violet-500/25 bg-violet-500/[0.08] text-violet-300 hover:bg-violet-500/[0.14]"
                            >
                                <ClipboardList size={14} className="mr-2" />
                                Ver registro completo
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => navigate('/reportes')}
                                className="border border-white/10 bg-white/5 text-white/65 hover:bg-white/10"
                            >
                                <FileText size={14} className="mr-2" />
                                Generar informe
                            </Button>
                        </div>
                    </div>
                    <div className="hidden lg:grid gap-3">
                        <div className="rounded-[20px] border border-white/8 bg-white/[0.04] p-4">
                            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-violet-300/70">Última actividad</p>
                            {logs[0] ? (
                                <>
                                    <p className="mt-2 text-sm font-semibold text-white truncate">{logs[0].accion}</p>
                                    <p className="mt-1 text-xs text-white/50">{logs[0].usuario.nombre} · {logs[0].modulo}</p>
                                    <p className="mt-1 text-[10px] font-mono text-white/35">
                                        {new Date(logs[0].createdAt).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                                    </p>
                                </>
                            ) : (
                                <p className="mt-2 text-sm text-white/40">Sin datos aún</p>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── KPIs ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <KpiCard
                    label="Eventos registrados"
                    value={loading ? '…' : total.toLocaleString('es-CO')}
                    icon={<Activity size={18} />}
                />
                <KpiCard
                    label="Módulos con actividad"
                    value={loading ? '…' : String(modulosActivos)}
                    icon={<ShieldAlert size={18} />}
                />
                <KpiCard
                    label="Eventos recientes (25)"
                    value={loading ? '…' : String(logs.length)}
                    icon={<ClipboardList size={18} />}
                />
                <KpiCard
                    label="Usuarios involucrados"
                    value={loading ? '…' : String(new Set(logs.map((l) => l.usuario.email)).size)}
                    icon={<FileText size={18} />}
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_0.38fr]">
                {/* ── Tabla de logs recientes ── */}
                <Card className="rounded-[28px] border-white/5 bg-[linear-gradient(180deg,rgba(20,20,18,0.98),rgba(12,12,10,0.98))] p-0 overflow-hidden">
                    <div className="flex items-center justify-between border-b border-white/6 px-6 py-5">
                        <div>
                            <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-violet-500/70">Trazabilidad</p>
                            <h2 className="mt-1 text-xl font-semibold text-white">Eventos recientes</h2>
                        </div>
                        <button
                            onClick={fetchData}
                            className="text-[12px] text-white/40 hover:text-white/70 transition-colors"
                        >
                            Actualizar
                        </button>
                    </div>

                    {loading && (
                        <div className="p-6 space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="h-10 rounded-[12px] bg-white/[0.04] animate-pulse" />
                            ))}
                        </div>
                    )}

                    {!loading && logs.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-14 gap-3 text-white/35">
                            <ClipboardList size={32} className="opacity-30" />
                            <p className="text-sm">No hay eventos registrados.</p>
                        </div>
                    )}

                    {!loading && logs.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-[12px]">
                                <thead>
                                    <tr className="border-b border-white/6">
                                        {['Fecha', 'Módulo', 'Acción', 'Entidad', 'Usuario', 'IP'].map((h) => (
                                            <th key={h} className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-white/35">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.04]">
                                    {logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-white/[0.03] transition-colors">
                                            <td className="px-4 py-3 font-mono text-white/45 whitespace-nowrap">
                                                {new Date(log.createdAt).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-[6px] border text-[10px] font-mono ${moduloClass(log.modulo)}`}>
                                                    {log.modulo}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-white/75 font-medium">{log.accion}</td>
                                            <td className="px-4 py-3 text-white/55">{log.entidad}</td>
                                            <td className="px-4 py-3 text-white/60">{log.usuario.nombre}</td>
                                            <td className="px-4 py-3 font-mono text-white/35">{log.ip ?? '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!loading && logs.length > 0 && (
                        <div className="border-t border-white/6 px-6 py-4 flex justify-end">
                            <button
                                onClick={() => navigate('/auditoria')}
                                className="text-[12px] text-violet-400 hover:text-violet-300 transition-colors"
                            >
                                Ver todos los registros →
                            </button>
                        </div>
                    )}
                </Card>

                {/* ── Actividad por módulo ── */}
                <div className="space-y-4">
                    <Card className="rounded-[28px] border-white/5 bg-[linear-gradient(180deg,rgba(18,18,16,0.98),rgba(12,12,10,0.98))]">
                        <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-violet-500/70 mb-4">Actividad por módulo</p>
                        {loading ? (
                            <div className="space-y-2">
                                {[1, 2, 3].map((i) => <div key={i} className="h-8 rounded-[10px] bg-white/[0.04] animate-pulse" />)}
                            </div>
                        ) : topModulos.length === 0 ? (
                            <p className="text-sm text-white/35">Sin actividad reciente</p>
                        ) : (
                            <div className="space-y-2">
                                {topModulos.map(([mod, count]) => {
                                    const pct = Math.round((count / logs.length) * 100);
                                    return (
                                        <div key={mod}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`inline-flex px-2 py-0.5 rounded-[6px] border text-[10px] font-mono ${moduloClass(mod)}`}>
                                                    {mod}
                                                </span>
                                                <span className="text-[11px] text-white/45">{count} eventos</span>
                                            </div>
                                            <div className="h-1.5 rounded-full bg-white/6">
                                                <div
                                                    className="h-1.5 rounded-full bg-violet-500/60"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>

                    <Card className="rounded-[28px] border-violet-500/15 bg-[linear-gradient(180deg,rgba(16,14,20,0.98),rgba(10,9,14,0.98))]">
                        <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-violet-500/60 mb-3">Accesos rápidos</p>
                        <div className="space-y-2">
                            <button
                                onClick={() => navigate('/auditoria')}
                                className="w-full flex items-center gap-3 rounded-[14px] border border-violet-500/20 bg-violet-500/[0.07] px-4 py-3 text-[13px] font-medium text-violet-300 hover:bg-violet-500/[0.12] transition-colors"
                            >
                                <ClipboardList size={15} />
                                Registro completo de auditoría
                            </button>
                            <button
                                onClick={() => navigate('/reportes')}
                                className="w-full flex items-center gap-3 rounded-[14px] border border-white/10 bg-white/[0.04] px-4 py-3 text-[13px] font-medium text-white/65 hover:bg-white/[0.07] transition-colors"
                            >
                                <FileText size={15} />
                                Generar informe de auditoría
                            </button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
