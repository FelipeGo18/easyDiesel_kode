import { useState, useEffect, useCallback, useMemo } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { useToast } from '@/components/ui/useToast';
import api from '@/services/api';
import type { ApiResponse } from '@/types';
import { getErrorMessage } from '@/lib/http';
import { useAuth } from '@/context/useAuth';
import {
    LineChart, Line,
    BarChart, Bar,
    PieChart, Pie, Cell,
    AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface ReporteRegistro {
    id: string;
    tipo: 'INVENTARIO' | 'TRANSACCIONES' | 'PRECIOS' | 'AUDITORIA' | 'NORMATIVO';
    formato: 'PDF' | 'EXCEL' | 'CSV';
    periodoInicio: string;
    periodoFin: string;
    createdAt: string;
    usuario: {
        nombre: string;
        email: string;
    };
}

const tiposReporteBase = [
    { id: 'INVENTARIO', label: 'Estado de Inventarios', icon: 'pie-chart', description: 'Niveles actuales de tanques y capacidad disponible.', roles: ['admin'] },
    { id: 'TRANSACCIONES', label: 'Ventas y Despachos', icon: 'history', description: 'Registro detallado de entradas y salidas de combustible.', roles: ['admin', 'estacion', 'distribuidor'] },
    { id: 'PRECIOS', label: 'Histórico de Precios', icon: 'spreadsheet', description: 'Evolución de precios por zona y tipo de combustible.', roles: ['admin', 'estacion', 'distribuidor', 'regulador'] },
    { id: 'NORMATIVO', label: 'Cumplimiento Normativo', icon: 'normativa', description: 'Decretos vigentes y resoluciones aplicadas.', roles: ['admin', 'estacion', 'distribuidor', 'regulador'] },
    { id: 'AUDITORIA', label: 'Rastreo de Seguridad', icon: 'audit', description: 'Reporte consolidado de logs y acciones de usuarios.', roles: ['admin', 'auditor'] },
];

// Mock data para los gráficos
const ventasData = [
    { name: 'Ene', diesel: 4000, gasolina: 2400 },
    { name: 'Feb', diesel: 3000, gasolina: 1398 },
    { name: 'Mar', diesel: 2000, gasolina: 9800 },
    { name: 'Abr', diesel: 2780, gasolina: 3908 },
    { name: 'May', diesel: 1890, gasolina: 4800 },
    { name: 'Jun', diesel: 2390, gasolina: 3800 },
];

const volumenPorZonaData = [
    { zona: 'Norte', volumen: 45000 },
    { zona: 'Sur', volumen: 32000 },
    { zona: 'Este', volumen: 28000 },
    { zona: 'Oeste', volumen: 39000 },
];

const distribucionData = [
    { name: 'Diesel Regular', value: 45 },
    { name: 'Diesel Premium', value: 25 },
    { name: 'Gasolina 95', value: 20 },
    { name: 'Aditivos', value: 10 },
];
const COLORS = ['#F5A623', '#AA6A00', '#10B981', '#3B82F6'];

const inventarioHistoricoData = [
    { time: '08:00', nivel: 80 },
    { time: '10:00', nivel: 65 },
    { time: '12:00', nivel: 45 },
    { time: '14:00', nivel: 30 },
    { time: '16:00', nivel: 85 }, // Recarga
    { time: '18:00', nivel: 70 },
];

export function AnaliticaPage() {
    const toast = useToast();
    const { user } = useAuth();
    const userRole = typeof user?.rol === 'object' ? user.rol.nombre : user?.rol;
    const isAuditor = userRole === 'auditor';

    const [reportes, setReportes] = useState<ReporteRegistro[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState<string | null>(null);

    // Filtros para generación de reportes y dashboard
    const [fechaInicio, setFechaInicio] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
    const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);

    // Filtrar tipos de reporte según el rol
    const tiposDisponibles = useMemo(() => {
        return tiposReporteBase.filter(t => t.roles.includes(userRole || ''));
    }, [userRole]);

    const [tipoSeleccionado, setTipoSeleccionado] = useState(tiposDisponibles[0]?.id || '');
    const [formato, setFormato] = useState<'PDF' | 'EXCEL'>('PDF');

    // Sincronizar tipo seleccionado si los disponibles cambian
    useEffect(() => {
        if (tiposDisponibles.length > 0 && !tiposDisponibles.find(t => t.id === tipoSeleccionado)) {
            setTipoSeleccionado(tiposDisponibles[0].id);
        }
    }, [tiposDisponibles, tipoSeleccionado]);

    const fetchReportes = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get<ApiResponse<ReporteRegistro[]>>('/reportes');
            setReportes(response.data.data ?? []);
        } catch (error: unknown) {
            toast.error(`Error al cargar historial: ${getErrorMessage(error)}`);
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { fetchReportes(); }, [fetchReportes]);

    const handleGenerar = async () => {
        try {
            setGenerating(tipoSeleccionado);
            const payload = {
                tipo: tipoSeleccionado,
                formato: formato,
                periodoInicio: new Date(fechaInicio).toISOString(),
                periodoFin: new Date(fechaFin).toISOString(),
                parametros: {}
            };

            const response = await api.post('/reportes', payload, {
                responseType: 'blob'
            });

            // Crear link de descarga
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const extension = formato === 'EXCEL' ? 'xlsx' : 'pdf';
            link.setAttribute('download', `Reporte_${tipoSeleccionado}_${new Date().getTime()}.${extension}`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success('Reporte generado y descargado correctamente');
            fetchReportes(); // Actualizar historial
        } catch (error: unknown) {
            toast.error(`Error al generar reporte: ${getErrorMessage(error)}`);
        } finally {
            setGenerating(null);
        }
    };

    const columns: Column<ReporteRegistro>[] = [
        {
            key: 'tipo',
            header: 'Tipo de Reporte',
            render: (r) => (
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-bg-elevated rounded-md text-amber-500">
                        <Icon name="normativa" size={14} />
                    </div>
                    <span className="font-medium text-[13px]">{r.tipo}</span>
                </div>
            )
        },
        {
            key: 'formato',
            header: 'Formato',
            render: (r) => (
                <Badge variant={r.formato === 'PDF' ? 'amber' : 'green'}>
                    {r.formato}
                </Badge>
            )
        },
        {
            key: 'createdAt',
            header: 'Fecha de Creación',
            render: (r) => (
                <div className="flex flex-col">
                    <span className="text-[12px] text-text-primary">{new Date(r.createdAt).toLocaleDateString()}</span>
                    <span className="text-[10px] text-text-muted">{new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            )
        },
        {
            key: 'usuario',
            header: 'Generado por',
            render: (r) => (
                <span className="text-[12px] text-text-secondary">{r.usuario.nombre}</span>
            )
        }
    ];

    return (
        <div className="space-y-8 animate-enter pb-10">
            {/* Header Global */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-h1 text-text-primary mb-1">
                        {isAuditor ? 'Análisis de Riesgos y Reportes' : 'Analítica y Reportes'}
                    </h1>
                    <p className="text-small text-text-secondary">
                        {isAuditor 
                            ? 'Detección de anomalías operativas y generación de informes de cumplimiento.' 
                            : 'Monitorea los indicadores clave y genera informes detallados.'}
                    </p>
                </div>
                
                {/* Filtros Globales de Fecha */}
                <div className="flex items-center gap-3 bg-bg-elevated p-2 rounded-brand border border-border-subtle">
                    <div className="flex items-center gap-2">
                        <Icon name="calendar" size={14} className="text-text-muted ml-1" />
                        <input
                            type="date"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                            className="bg-transparent border-none text-[12px] text-text-primary focus:ring-0 w-[110px] interactive cursor-pointer"
                        />
                    </div>
                    <span className="text-text-muted text-[12px]">-</span>
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={fechaFin}
                            onChange={(e) => setFechaFin(e.target.value)}
                            className="bg-transparent border-none text-[12px] text-text-primary focus:ring-0 w-[110px] interactive cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            {/* SECCIÓN 1: DASHBOARD ANALÍTICO */}
            <div className="space-y-6">
                <h2 className="text-[16px] font-bold text-text-primary mb-4 flex items-center gap-2 border-b border-border-subtle pb-2">
                    <Icon name={isAuditor ? 'audit' : 'dashboard'} size={18} className="text-amber-500" />
                    {isAuditor ? 'Indicadores de Cumplimiento e Integridad' : 'Panel de Control Principal'}
                </h2>
                
                {/* KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {isAuditor ? (
                        <>
                            <Card className="p-5 flex flex-col justify-between hover:border-amber-500/30 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-[12px] text-text-secondary font-medium">Alertas de Seguridad</p>
                                        <h3 className="text-2xl font-bold text-text-primary mt-1">12</h3>
                                    </div>
                                    <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                                        <Icon name="alert" size={20} />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-1.5 text-[11px] text-red-500">
                                    <span className="font-medium">+3 hoy</span>
                                    <span className="text-text-muted ml-1">Intentos fallidos / Acciones críticas</span>
                                </div>
                            </Card>
                            <Card className="p-5 flex flex-col justify-between hover:border-amber-500/30 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-[12px] text-text-secondary font-medium">Trazabilidad Global</p>
                                        <h3 className="text-2xl font-bold text-text-primary mt-1">99.8%</h3>
                                    </div>
                                    <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                                        <Icon name="check" size={20} />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-1.5 text-[11px] text-text-muted">
                                    <span>Logs sin inconsistencias</span>
                                </div>
                            </Card>
                            <Card className="p-5 flex flex-col justify-between hover:border-amber-500/30 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-[12px] text-text-secondary font-medium">Variación de Precios</p>
                                        <h3 className="text-2xl font-bold text-text-primary mt-1">±0.2%</h3>
                                    </div>
                                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                        <Icon name="prices" size={20} />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-1.5 text-[11px] text-text-muted">
                                    <span>Desviación vs Decreto 1428</span>
                                </div>
                            </Card>
                            <Card className="p-5 flex flex-col justify-between hover:border-amber-500/30 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-[12px] text-text-secondary font-medium">Usuarios Privilegiados</p>
                                        <h3 className="text-2xl font-bold text-text-primary mt-1">4</h3>
                                    </div>
                                    <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                                        <Icon name="user" size={20} />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-1.5 text-[11px] text-text-muted">
                                    <span>Con permisos de escritura</span>
                                </div>
                            </Card>
                        </>
                    ) : (
                        <>
                            <Card className="p-5 flex flex-col justify-between hover:border-amber-500/30 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-[12px] text-text-secondary font-medium">Volumen Total Transado</p>
                                        <h3 className="text-2xl font-bold text-text-primary mt-1">144,000 <span className="text-sm font-normal text-text-muted">Gal</span></h3>
                                    </div>
                                    <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                                        <Icon name="tank" size={20} />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-1.5 text-[11px] text-green-500">
                                    <Icon name="refresh" size={12} /> {/* Reemplazar con icon de subida si hay */}
                                    <span className="font-medium">+12.5%</span>
                                    <span className="text-text-muted ml-1">vs mes anterior</span>
                                </div>
                            </Card>
                            <Card className="p-5 flex flex-col justify-between hover:border-amber-500/30 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-[12px] text-text-secondary font-medium">Estaciones Activas</p>
                                        <h3 className="text-2xl font-bold text-text-primary mt-1">28</h3>
                                    </div>
                                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                        <Icon name="station" size={20} />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-1.5 text-[11px] text-text-muted">
                                    <span>Operativas en 4 zonas</span>
                                </div>
                            </Card>
                            <Card className="p-5 flex flex-col justify-between hover:border-amber-500/30 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-[12px] text-text-secondary font-medium">Capacidad de Inventario</p>
                                        <h3 className="text-2xl font-bold text-text-primary mt-1">65%</h3>
                                    </div>
                                    <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                                        <Icon name="dashboard" size={20} />
                                    </div>
                                </div>
                                <div className="mt-4 w-full bg-bg-elevated h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-green-500 h-full rounded-full" style={{ width: '65%' }} />
                                </div>
                            </Card>
                            <Card className="p-5 flex flex-col justify-between hover:border-amber-500/30 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-[12px] text-text-secondary font-medium">Alertas Normativas</p>
                                        <h3 className="text-2xl font-bold text-text-primary mt-1">2</h3>
                                    </div>
                                    <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                                        <Icon name="normativa" size={20} />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-1.5 text-[11px] text-red-500 cursor-pointer hover:underline">
                                    <span className="font-medium">Requieren atención inmediata</span>
                                </div>
                            </Card>
                        </>
                    )}
                </div>

                {/* Gráficos */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Gráfico de Líneas */}
                    <Card className="p-5 flex flex-col">
                        <h3 className="text-[13px] font-bold text-text-primary mb-4">Evolución de Transacciones</h3>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={ventasData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                    <XAxis dataKey="name" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', fontSize: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                                    <Line type="monotone" dataKey="diesel" name="Diesel" stroke="#F5A623" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="gasolina" name="Gasolina" stroke="#10B981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* Gráfico de Barras */}
                    <Card className="p-5 flex flex-col">
                        <h3 className="text-[13px] font-bold text-text-primary mb-4">Volumen Operativo por Zona</h3>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={volumenPorZonaData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                    <XAxis dataKey="zona" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
                                    <Tooltip 
                                        cursor={{ fill: '#ffffff0a' }}
                                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', fontSize: '12px' }}
                                    />
                                    <Bar dataKey="volumen" name="Volumen (Gal)" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* Gráfico de Áreas */}
                    <Card className="p-5 flex flex-col">
                        <h3 className="text-[13px] font-bold text-text-primary mb-4">Niveles de Inventario Global (%)</h3>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={inventarioHistoricoData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorNivel" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                    <XAxis dataKey="time" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', fontSize: '12px' }}
                                    />
                                    <Area type="monotone" dataKey="nivel" name="Inventario" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorNivel)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* Gráfico Circular */}
                    <Card className="p-5 flex flex-col">
                        <h3 className="text-[13px] font-bold text-text-primary mb-4">Distribución por Combustible</h3>
                        <div className="h-[250px] w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={distribucionData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {distribucionData.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', fontSize: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} verticalAlign="bottom" height={36}/>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>
            </div>

            {/* SECCIÓN 2: CENTRO DE REPORTES */}
            <div className="space-y-6 pt-6 mt-8 border-t border-border-subtle">
                <h2 className="text-[16px] font-bold text-text-primary mb-4 flex items-center gap-2">
                    <Icon name="reports" size={18} className="text-amber-500" />
                    Centro de Exportación y Reportes
                </h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Panel de Generación */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="p-6 border-border-subtle bg-bg-surface">
                            <h3 className="text-[14px] font-bold text-text-primary mb-4 flex items-center gap-2">
                                <Icon name="refresh" size={16} className="text-amber-500" />
                                Generar Nuevo Informe
                            </h3>

                            <div className="space-y-5">
                                {/* Selector de Tipo */}
                                <div className="space-y-2">
                                    <label className="text-label text-text-secondary">Tipo de información</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {tiposDisponibles.map((t) => (
                                            <button
                                                key={t.id}
                                                onClick={() => setTipoSeleccionado(t.id)}
                                                className={`flex items-start gap-3 p-3 rounded-brand border text-left transition-all interactive ${tipoSeleccionado === t.id
                                                        ? 'bg-transparent border-amber-500 ring-1 ring-amber-500'
                                                        : 'bg-bg-elevated border-border-subtle hover:border-[#444]'
                                                    }`}
                                            >
                                                <Icon name={t.icon} size={18} className={tipoSeleccionado === t.id ? 'text-amber-500' : 'text-text-muted'} />
                                                <div>
                                                    <p className={`text-[12px] font-bold ${tipoSeleccionado === t.id ? 'text-amber-500' : 'text-text-primary'}`}>{t.label}</p>
                                                    <p className="text-[10px] text-text-muted leading-tight mt-0.5">{t.description}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Formato */}
                                <div className="space-y-2">
                                    <label className="text-label text-text-secondary">Formato de descarga</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setFormato('PDF')}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-brand text-[11px] font-mono border transition-colors ${formato === 'PDF' ? 'bg-amber-500 text-black border-amber-500 font-bold' : 'bg-bg-elevated border-border-subtle text-text-secondary hover:border-[#444]'}`}
                                        >
                                            <Icon name="normativa" size={14} /> PDF
                                        </button>
                                        <button
                                            onClick={() => setFormato('EXCEL')}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-brand text-[11px] font-mono border transition-colors ${formato === 'EXCEL' ? 'bg-[#10B981] text-black border-[#10B981] font-bold' : 'bg-bg-elevated border-border-subtle text-text-secondary hover:border-[#444]'}`}
                                        >
                                            <Icon name="spreadsheet" size={14} /> EXCEL
                                        </button>
                                    </div>
                                </div>

                                <Button
                                    className="w-full mt-2"
                                    onClick={handleGenerar}
                                    isLoading={!!generating}
                                >
                                    <Icon name="download" size={16} />
                                    Generar Informe
                                </Button>
                            </div>
                        </Card>
                    </div>

                    {/* Historial de Reportes */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <h3 className="text-[14px] font-bold text-text-primary flex items-center gap-2">
                                <Icon name="history" size={16} className="text-text-muted" />
                                Historial de Actividad
                            </h3>
                            <Button variant="ghost" size="sm" onClick={fetchReportes}>
                                <Icon name="refresh" size={12} className={loading ? 'animate-spin' : ''} />
                                Actualizar
                            </Button>
                        </div>

                        <DataTable
                            columns={columns}
                            data={reportes}
                            loading={loading}
                            pageSize={8}
                            searchPlaceholder="Filtrar por tipo o usuario..."
                            emptyMessage="No se han generado reportes recientemente."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
