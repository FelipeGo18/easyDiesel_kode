import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    BookOpen, 
    Building2, 
    Fuel, 
    MapPin, 
    Scale, 
    ShieldCheck, 
    Search, 
    FileText, 
    ShieldAlert, 
    History,
    ChevronRight,
    Download,
    Eye,
    User,
    Clock,
    ExternalLink
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { KpiCard } from '@/components/ui/KpiCard';
import { Button } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/useToast';
import api from '@/services/api';
import { getErrorMessage } from '@/lib/http';
import { zonasService, preciosService, decretosService, type Zona, type Precio, type Decreto } from '@/services/admin';
import { estacionesService } from '@/services/actores';
import type { EstacionServicio, ApiResponse } from '@/types';

// Interfaces para Auditoría y Reportes
interface AuditoriaLog {
    id: string;
    modulo: string;
    accion: string;
    entidad: string;
    createdAt: string;
    usuario: { nombre: string; email: string; };
    ip?: string;
    datosAntes?: any;
    datosDespues?: any;
}

interface ReporteRegistro {
    id: string;
    tipo: string;
    formato: string;
    createdAt: string;
    usuario: { nombre: string; email: string; };
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
    }).format(value);
}

export function ReguladorPanelPage() {
    const toast = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'resumen' | 'auditoria' | 'reportes'>('resumen');
    
    // Datos regulatorios
    const [zonas, setZonas] = useState<Zona[]>([]);
    const [precios, setPrecios] = useState<Precio[]>([]);
    const [decretos, setDecretos] = useState<Decreto[]>([]);
    const [estaciones, setEstaciones] = useState<EstacionServicio[]>([]);
    const [filtroZona, setFiltroZona] = useState<string>('');
    const [searchPrecio, setSearchPrecio] = useState<string>('');
    const [precioPage, setPrecioPage] = useState(1);
    const PRECIOS_PER_PAGE = 8;

    // Datos de auditoría y reportes
    const [logs, setLogs] = useState<AuditoriaLog[]>([]);
    const [reportes, setReportes] = useState<ReporteRegistro[]>([]);
    const [selectedLog, setSelectedLog] = useState<AuditoriaLog | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Ejecutar peticiones de forma individual para mayor resiliencia
            const [
                zonasRes, 
                preciosRes, 
                decretosRes, 
                estacionesRes, 
                logsRes, 
                reportesRes
            ] = await Promise.allSettled([
                zonasService.getAll(),
                preciosService.getAll({ activo: 'true' }),
                decretosService.getAll(),
                estacionesService.getAll({ limit: 200 }),
                api.get<ApiResponse<AuditoriaLog[]>>('/auditoria', { params: { limit: 10 } }),
                api.get<ApiResponse<ReporteRegistro[]>>('/reportes', { params: { limit: 10 } }),
            ]);

            if (zonasRes.status === 'fulfilled') setZonas(zonasRes.value);
            if (preciosRes.status === 'fulfilled') setPrecios(preciosRes.value);
            if (decretosRes.status === 'fulfilled') setDecretos(decretosRes.value);
            if (estacionesRes.status === 'fulfilled') setEstaciones(estacionesRes.value.data ?? []);
            if (logsRes.status === 'fulfilled') setLogs(logsRes.value.data.data ?? []);
            if (reportesRes.status === 'fulfilled') setReportes(reportesRes.value.data.data ?? []);

            // Mostrar aviso si algo falló pero el resto cargó
            const failures = [zonasRes, preciosRes, decretosRes, estacionesRes, logsRes, reportesRes].filter(r => r.status === 'rejected');
            if (failures.length > 0) {
                console.warn(`${failures.length} fuentes de datos no pudieron cargarse.`);
            }
        } catch (error: unknown) {
            toast.error(`Error crítico al cargar panel: ${getErrorMessage(error)}`);
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleViewDetail = (log: AuditoriaLog) => {
        setSelectedLog(log);
        setModalOpen(true);
    };

    const columnsAuditoria: Column<AuditoriaLog>[] = [
        {
            key: 'createdAt',
            header: 'Fecha/Hora',
            render: (l) => (
                <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-text-primary">{new Date(l.createdAt).toLocaleDateString()}</span>
                    <span className="text-[10px] text-text-muted">{new Date(l.createdAt).toLocaleTimeString()}</span>
                </div>
            )
        },
        {
            key: 'usuario',
            header: 'Usuario',
            render: (l) => <span className="text-[11px] text-text-secondary">{l.usuario.nombre}</span>
        },
        {
            key: 'modulo',
            header: 'Módulo',
            render: (l) => <Badge variant="amber" className="text-[9px] uppercase tracking-wider">{l.modulo}</Badge>
        },
        {
            key: 'accion',
            header: 'Acción',
            render: (l) => <span className="text-[11px] font-mono text-blue-400">{l.accion.toUpperCase()}</span>
        }
    ];

    const columnsReportes: Column<ReporteRegistro>[] = [
        {
            key: 'tipo',
            header: 'Reporte',
            render: (r) => <span className="text-[11px] font-medium text-text-primary">{r.tipo}</span>
        },
        {
            key: 'formato',
            header: 'Formato',
            render: (r) => <Badge variant={r.formato === 'PDF' ? 'amber' : 'green'}>{r.formato}</Badge>
        },
        {
            key: 'createdAt',
            header: 'Generado el',
            render: (r) => <span className="text-[11px] text-text-muted">{new Date(r.createdAt).toLocaleDateString()}</span>
        }
    ];

    const decretoActivos = decretos.filter(d => d.activo);
    const preciosFiltrados = precios
        .filter(p => !filtroZona || p.zonaId === filtroZona)
        .filter(p => {
            if (!searchPrecio.trim()) return true;
            const q = searchPrecio.toLowerCase();
            return (
                p.zona?.nombre?.toLowerCase().includes(q) ||
                p.tipoCombustible?.toLowerCase().includes(q)
            );
        });
    const preciosTotalPages = Math.max(1, Math.ceil(preciosFiltrados.length / PRECIOS_PER_PAGE));
    const preciosPaged = preciosFiltrados.slice((precioPage - 1) * PRECIOS_PER_PAGE, precioPage * PRECIOS_PER_PAGE);
    const estacionesFiltradas = filtroZona ? estaciones.filter(e => e.zonaId === filtroZona) : estaciones;

    return (
        <div className="space-y-8 animate-enter pb-12 max-w-[1440px] mx-auto">
            {/* ── Header Profesional Pro Max ── */}
            <section className="relative overflow-hidden rounded-[32px] bg-bg-surface border border-border-subtle p-8 md:p-10 shadow-2xl group transition-all duration-500 hover:border-white/10">

                
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Estado con punto pulsante */}
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04]">
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-40" />
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white/70" />
                                </span>
                                <span className="text-[10px] font-semibold text-white/50 uppercase tracking-widest">Supervisión Activa</span>
                            </div>
                            <span className="text-white/15 text-xs">·</span>
                            {/* Ministerio */}
                            <div className="flex items-center gap-1.5">
                                <Building2 className="w-3 h-3 text-white/25" />
                                <span className="text-[10px] font-medium text-white/30 uppercase tracking-widest">Ministerio de Minas y Energía</span>
                            </div>
                        </div>
                        
                        <div>
                            <h1 className="text-4xl md:text-5xl font-display font-bold text-text-primary tracking-tight">
                                Centro de Mando <span className="text-amber-500">Regulatorio</span>
                            </h1>
                            <p className="mt-3 text-base text-text-secondary max-w-2xl leading-relaxed">
                                Plataforma de alta integridad para la fiscalización nacional de hidrocarburos. 
                                Monitoreo inmutable de precios, cumplimiento de decretos y trazabilidad total de operaciones.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch gap-3 bg-bg-base p-2 rounded-[20px] border border-border-subtle">
                        <button 
                            onClick={() => setActiveTab('resumen')}
                            className={`flex items-center justify-center gap-2.5 px-6 py-3 rounded-[14px] text-[13px] font-bold transition-all duration-300 ${
                                activeTab === 'resumen' 
                                    ? 'bg-white/8 text-white border border-white/20' 
                                    : 'text-text-muted border border-transparent hover:text-slate-300 hover:bg-white/5 hover:border-white/15'
                            }`}
                        >
                            <Scale className="w-4 h-4" /> Resumen General
                        </button>
                        <button 
                            onClick={() => setActiveTab('auditoria')}
                            className={`flex items-center justify-center gap-2.5 px-6 py-3 rounded-[14px] text-[13px] font-bold transition-all duration-300 ${
                                activeTab === 'auditoria' 
                                    ? 'bg-white/8 text-white border border-white/20' 
                                    : 'text-text-muted border border-transparent hover:text-slate-300 hover:bg-white/5 hover:border-white/15'
                            }`}
                        >
                            <ShieldAlert className="w-4 h-4" /> Rastro Auditor
                        </button>
                        <button 
                            onClick={() => setActiveTab('reportes')}
                            className={`flex items-center justify-center gap-2.5 px-6 py-3 rounded-[14px] text-[13px] font-bold transition-all duration-300 ${
                                activeTab === 'reportes' 
                                    ? 'bg-white/8 text-white border border-white/20' 
                                    : 'text-text-muted border border-transparent hover:text-slate-300 hover:bg-white/5 hover:border-white/15'
                            }`}
                        >
                            <FileText className="w-4 h-4" /> Exportación
                        </button>
                    </div>
                </div>
            </section>

            {activeTab === 'resumen' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* ── Bento Grid de KPIs ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        <KpiCard 
                            label="Zonas Operativas" 
                            value={String(zonas.length)} 
                            icon={<MapPin className="w-5 h-5" />} 
                            className="bg-bg-surface border-border-subtle hover:border-white/10 transition-all duration-300"
                        />
                        <KpiCard 
                            label="Estaciones (EDS)" 
                            value={String(estaciones.length)} 
                            icon={<Building2 className="w-5 h-5" />} 
                            className="bg-bg-surface border-border-subtle hover:border-white/10 transition-all duration-300"
                        />
                        <KpiCard 
                            label="Tarifas Activas" 
                            value={String(precios.length)} 
                            icon={<Fuel className="w-5 h-5" />} 
                            className="bg-bg-surface border-border-subtle hover:border-white/10 transition-all duration-300"
                        />
                        <KpiCard 
                            label="Marco Normativo" 
                            value={String(decretos.length)} 
                            icon={<BookOpen className="w-5 h-5" />} 
                            className="bg-bg-surface border-border-subtle hover:border-white/10 transition-all duration-300"
                        />
                    </div>

                    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
                        {/* Main Stream: Precios y Auditoría */}
                        <div className="space-y-8">
                            {/* Monitoreo de Precios Pro */}
                            <Card className="p-0 overflow-hidden border-border-subtle shadow-xl bg-bg-surface ring-1 ring-white/5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle px-6 py-5 bg-bg-elevated/40">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500 border border-amber-500/20">
                                            <Scale className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-text-primary tracking-tight">Vigilancia de Precios</h2>
                                            <p className="text-xs text-text-muted">Cumplimiento del Decreto 1428 en tiempo real</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                                        {/* Buscador texto */}
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                                            <input
                                                type="text"
                                                value={searchPrecio}
                                                onChange={(e) => { setSearchPrecio(e.target.value); setPrecioPage(1); }}
                                                placeholder="Buscar zona o combustible..."
                                                className="pl-9 pr-4 py-2 bg-bg-base border border-border-subtle rounded-xl text-xs font-medium outline-none text-text-primary placeholder:text-text-muted focus:border-white/20 transition-colors w-[200px]"
                                            />
                                        </div>
                                        {/* Filtro zona */}
                                        <div className="relative">
                                            <select 
                                                value={filtroZona}
                                                onChange={(e) => { setFiltroZona(e.target.value); setPrecioPage(1); }}
                                                className="pl-3 pr-8 py-2 bg-bg-base border border-border-subtle rounded-xl text-xs font-medium outline-none text-text-primary appearance-none interactive hover:border-white/10 min-w-[160px]"
                                            >
                                                <option value="">Todas las zonas</option>
                                                {zonas.map(z => <option key={z.id} value={z.id}>{z.nombre}</option>)}
                                            </select>
                                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-text-muted rotate-90 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-bg-base/30 text-[10px] text-text-muted uppercase font-bold tracking-widest border-b border-border-subtle">
                                                <th className="px-6 py-4 text-left">Ubicación / Zona</th>
                                                <th className="px-6 py-4 text-left">Combustible</th>
                                                <th className="px-6 py-4 text-left">Precio Oficial</th>
                                                <th className="px-6 py-4 text-center">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border-subtle/50">
                                            {loading ? (
                                                [...Array(5)].map((_, i) => (
                                                    <tr key={i} className="animate-pulse">
                                                        <td colSpan={4} className="px-6 py-4"><div className="h-10 bg-bg-elevated rounded-lg" /></td>
                                                    </tr>
                                                ))
                                            ) : preciosFiltrados.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-12 text-center text-text-muted">
                                                        No se encontraron registros bajo los criterios actuales.
                                                    </td>
                                                </tr>
                                            ) : (
                                                preciosPaged.map(p => (
                                                    <tr key={p.id} className="hover:bg-bg-elevated/30 transition-all duration-200 group">
                                                        <td className="px-6 py-4">
                                                            <p className="font-bold text-text-primary group-hover:text-amber-500 transition-colors">{p.zona?.nombre}</p>
                                                            <p className="text-[10px] text-text-muted uppercase font-mono tracking-tight">{p.zona?.tipoZona || 'Urbana'}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-1.5 h-1.5 rounded-full ${p.tipoCombustible.includes('DIESEL') ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                                                <span className="text-xs font-medium text-text-secondary">{p.tipoCombustible}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="font-mono font-bold text-text-primary text-base">
                                                                {formatCurrency(Number(p.precioGalon))}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <Badge variant="green" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] px-2 py-0.5">VIGENTE</Badge>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="px-6 py-3 bg-bg-elevated/20 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
                                    {/* Info + nav link */}
                                    <p className="text-[10px] text-text-muted order-2 sm:order-1">
                                        {preciosFiltrados.length} registros · mostrando {((precioPage - 1) * PRECIOS_PER_PAGE) + 1}–{Math.min(precioPage * PRECIOS_PER_PAGE, preciosFiltrados.length)}
                                    </p>
                                    {/* Pagination */}
                                    <div className="flex items-center gap-1 order-1 sm:order-2">
                                        <button
                                            onClick={() => setPrecioPage(p => Math.max(1, p - 1))}
                                            disabled={precioPage === 1}
                                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-border-subtle text-text-muted hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        >←</button>
                                        {Array.from({ length: preciosTotalPages }, (_, i) => i + 1).map(n => (
                                            <button
                                                key={n}
                                                onClick={() => setPrecioPage(n)}
                                                className={`w-7 h-7 rounded-lg text-[11px] font-bold transition-all ${
                                                    n === precioPage
                                                        ? 'bg-white/8 text-white border border-white/20'
                                                        : 'text-text-muted border border-transparent hover:border-white/15 hover:text-slate-300'
                                                }`}
                                            >{n}</button>
                                        ))}
                                        <button
                                            onClick={() => setPrecioPage(p => Math.min(preciosTotalPages, p + 1))}
                                            disabled={precioPage === preciosTotalPages}
                                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-border-subtle text-text-muted hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        >→</button>
                                    </div>
                                    <button onClick={() => navigate('/precios')} className="text-[10px] font-bold text-amber-500 uppercase tracking-wider hover:underline order-3">Ver en detalle</button>
                                </div>
                            </Card>

                            {/* Feed de Actividad de Auditoría */}
                            <Card className="p-6 border-border-subtle bg-bg-surface shadow-lg">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-white/5 rounded-xl text-white/50 border border-white/10">
                                            <History className="w-5 h-5" />
                                        </div>
                                        <h2 className="text-lg font-bold text-text-primary tracking-tight">Bitácora de Seguridad</h2>
                                    </div>
                                    <button 
                                        onClick={() => setActiveTab('auditoria')} 
                                        className="group flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-wider hover:text-amber-400 transition-all"
                                    >
                                        Rastro completo <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {logs.slice(0, 6).map(log => (
                                        <div 
                                            key={log.id} 
                                            onClick={() => handleViewDetail(log)}
                                            className="flex items-center justify-between p-4 rounded-2xl bg-bg-elevated/20 border border-border-subtle/50 hover:border-white/10 transition-all cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-bg-base flex items-center justify-center border border-border-subtle transition-transform">
                                                    <ShieldCheck size={18} className="text-white/30" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-text-primary">{log.accion.replace(/_/g, ' ')}</p>
                                                    <p className="text-[11px] text-text-muted font-medium">{log.usuario.nombre} · <span className="font-mono">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></p>
                                                </div>
                                            </div>
                                            <Badge variant="amber" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[8px] tracking-tighter uppercase">{log.modulo}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>

                        {/* Sidebar Column: Decretos y EDS */}
                        <div className="space-y-8">
                            {/* Decretos Minimalistas */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 px-2">
                                    <BookOpen className="w-4 h-4 text-amber-500" />
                                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-[0.2em]">Normativa Legal</h3>
                                </div>
                                
                                <div className="space-y-4">
                                    {decretoActivos.slice(0, 3).map(d => (
                                        <div key={d.id} className="p-5 rounded-[24px] bg-bg-surface border border-border-subtle shadow-sm relative overflow-hidden group hover:border-white/10 transition-all duration-300">
                                            <div className="absolute top-0 right-0 p-3">
                                                <Badge variant="green" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[8px] font-bold">ACTIVO</Badge>
                                            </div>
                                            <p className="text-sm font-black text-text-primary">Decreto {d.numero}</p>
                                            <p className="mt-2 text-xs text-text-secondary leading-relaxed line-clamp-3 font-medium italic">"{d.titulo}"</p>
                                            <div className="mt-5 pt-4 border-t border-border-subtle/50 flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] text-text-muted uppercase font-bold tracking-widest">Vigencia</span>
                                                    <span className="text-[11px] text-text-primary font-mono">{new Date(d.fechaVigencia).toLocaleDateString()}</span>
                                                </div>
                                                <button onClick={() => navigate('/normativa')} className="p-2 bg-white/5 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-all shadow-sm">
                                                    <Download size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Estaciones Supervisadas */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 px-2">
                                    <Building2 className="w-4 h-4 text-amber-500" />
                                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-[0.2em]">Red Supervisada</h3>
                                </div>
                                
                                <Card className="p-2 border-border-subtle bg-bg-surface/50 backdrop-blur-md">
                                    <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar space-y-1">
                                        {estacionesFiltradas.map(e => (
                                            <div key={e.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-bg-elevated transition-colors group">
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-text-primary truncate group-hover:text-amber-500 transition-colors">{e.nombre}</p>
                                                    <p className="text-[10px] text-text-muted truncate font-medium">{e.ciudad} · {e.departamento}</p>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <Badge variant="green" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[8px] font-mono">{e.codigoSicom}</Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-3 border-t border-border-subtle/50 text-center">
                                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{estacionesFiltradas.length} EDS Totales</p>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'auditoria' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="p-0 overflow-hidden border-border-subtle shadow-xl bg-bg-surface">
                        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-5 bg-bg-elevated/40">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500 border border-amber-500/20">
                                    <ShieldAlert className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-text-primary tracking-tight">Rastro Auditor de Operaciones</h2>
                                    <p className="text-xs text-text-muted">Bitácora inmutable de cambios en el sistema</p>
                                </div>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-[11px] h-9 gap-2 border-amber-500/20 text-amber-500 hover:bg-amber-500/10"
                                onClick={() => navigate('/auditoria')}
                            >
                                Ver historial completo <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                        <DataTable 
                            columns={columnsAuditoria} 
                            data={logs} 
                            loading={loading}
                            onRowClick={handleViewDetail}
                        />
                    </Card>
                </div>
            )}

            {activeTab === 'reportes' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="p-0 overflow-hidden border-border-subtle shadow-xl bg-bg-surface">
                        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-5 bg-bg-elevated/40">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500 border border-amber-500/20">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-text-primary tracking-tight">Centro de Reportes Analíticos</h2>
                                    <p className="text-xs text-text-muted">Exportación de datos para cumplimiento normativo</p>
                                </div>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-[11px] h-9 gap-2 border-amber-500/20 text-amber-500 hover:bg-amber-500/10"
                                onClick={() => navigate('/analitica')}
                            >
                                Ver analítica completa <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                        <DataTable 
                            columns={columnsReportes} 
                            data={reportes} 
                            loading={loading}
                        />
                    </Card>
                </div>
            )}

            {/* Modal de Detalle de Auditoría Pro Max */}
            <Modal 
                open={modalOpen} 
                onClose={() => setModalOpen(false)} 
                title="Detalle de Inspección Forense"
                className="max-w-2xl"
            >
                {selectedLog && (
                    <div className="space-y-8 py-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-bg-elevated/40 p-4 rounded-2xl border border-border-subtle group hover:border-white/10 transition-all">
                                <span className="text-[10px] text-text-muted uppercase font-black tracking-[0.2em]">Responsable</span>
                                <div className="mt-2 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                                        <User size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-text-primary">{selectedLog.usuario.nombre}</p>
                                        <p className="text-[11px] text-text-muted font-mono">{selectedLog.usuario.email}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-bg-elevated/40 p-4 rounded-2xl border border-border-subtle group hover:border-white/10 transition-all">
                                <span className="text-[10px] text-text-muted uppercase font-black tracking-[0.2em]">Sello de Tiempo</span>
                                <div className="mt-2 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                                        <Clock size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-text-primary">{new Date(selectedLog.createdAt).toLocaleDateString()}</p>
                                        <p className="text-[11px] text-text-muted font-mono">{new Date(selectedLog.createdAt).toLocaleTimeString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-bg-base rounded-3xl border border-border-subtle relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4">
                                <ShieldAlert size={40} className="text-amber-500/10" />
                            </div>
                            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-1">
                                    <span className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Módulo</span>
                                    <p className="text-base font-black text-text-primary uppercase">{selectedLog.modulo}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Operación</span>
                                    <p className="text-base font-black text-blue-400 font-mono tracking-tight">{selectedLog.accion}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Origen IP</span>
                                    <p className="text-base font-black text-text-primary font-mono">
                                        {!selectedLog.ip || selectedLog.ip === '::1' || selectedLog.ip.startsWith('127.') || selectedLog.ip.startsWith('::ffff:127.')
                                            ? 'Local / Sistema'
                                            : selectedLog.ip}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-sky-500/10 rounded-lg text-sky-500">
                                    <Eye size={16} />
                                </div>
                                <span className="text-xs font-black text-text-primary uppercase tracking-widest">Comparativa de Integridad</span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between px-1">
                                        <span className="text-[9px] text-text-muted uppercase font-bold tracking-tighter">Pre-Estado</span>
                                        <span className="text-[8px] bg-bg-elevated px-1.5 py-0.5 rounded border border-border-subtle text-text-muted font-mono">Snapshot</span>
                                    </div>
                                    <pre className="text-[10px] bg-bg-base border border-border-default p-4 rounded-2xl h-48 overflow-auto text-text-secondary font-mono leading-relaxed custom-scrollbar">
                                        {selectedLog.datosAntes != null
                                            ? JSON.stringify(selectedLog.datosAntes, null, 2)
                                            : '// Sin estado previo registrado'}
                                    </pre>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between px-1">
                                        <span className="text-[9px] text-emerald-500 uppercase font-bold tracking-tighter">Post-Estado</span>
                                        <span className="text-[8px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 text-emerald-500 font-mono">Actualizado</span>
                                    </div>
                                    <pre className="text-[10px] bg-bg-base border border-emerald-500/10 p-4 rounded-2xl h-48 overflow-auto text-emerald-400 font-mono leading-relaxed custom-scrollbar">
                                        {selectedLog.datosDespues != null
                                            ? JSON.stringify(selectedLog.datosDespues, null, 2)
                                            : '// Sin cambios de estado registrados'}
                                    </pre>
                                </div>
                            </div>
                        </div>
                        
                        <div className="pt-2 flex justify-end">
                            <Button 
                                variant="ghost" 
                                className="rounded-xl px-8 hover:bg-bg-elevated text-text-muted hover:text-text-primary"
                                onClick={() => setModalOpen(false)}
                            >
                                Cerrar Inspección
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
