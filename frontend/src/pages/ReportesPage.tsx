import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { useToast } from '@/components/ui/useToast';
import api from '@/services/api';
import type { ApiResponse } from '@/types';
import { getErrorMessage } from '@/lib/http';

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

const tiposReporte = [
    { id: 'INVENTARIO', label: 'Estado de Inventarios', icon: 'pie-chart', description: 'Niveles actuales de tanques y capacidad disponible.' },
    { id: 'TRANSACCIONES', label: 'Ventas y Despachos', icon: 'history', description: 'Registro detallado de entradas y salidas de combustible.' },
    { id: 'PRECIOS', label: 'Histórico de Precios', icon: 'spreadsheet', description: 'Evolución de precios por zona y tipo de combustible.' },
    { id: 'NORMATIVO', label: 'Cumplimiento Normativo', icon: 'normativa', description: 'Decretos vigentes y resoluciones aplicadas.' },
];

export function ReportesPage() {
    const toast = useToast();
    const [reportes, setReportes] = useState<ReporteRegistro[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState<string | null>(null);

    // Filtros para generación
    const [tipoSeleccionado, setTipoSeleccionado] = useState(tiposReporte[0].id);
    const [formato, setFormato] = useState<'PDF' | 'EXCEL'>('PDF');
    const [fechaInicio, setFechaInicio] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
    const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);

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
        <div className="space-y-8 animate-enter">
            {/* Header */}
            <div>
                <h1 className="text-h1 text-text-primary mb-1">Centro de Reportes</h1>
                <p className="text-small text-text-secondary">Genera informes detallados y consulta el rastro de auditoría.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Panel de Generación */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="p-6 border-amber-500/20 bg-amber-500/2">
                        <h3 className="text-[14px] font-bold text-text-primary mb-4 flex items-center gap-2">
                            <Icon name="refresh" size={16} className="text-amber-500" />
                            Generar Nuevo Informe
                        </h3>

                        <div className="space-y-5">
                            {/* Selector de Tipo */}
                            <div className="space-y-2">
                                <label className="text-label text-text-secondary">Tipo de información</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {tiposReporte.map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setTipoSeleccionado(t.id)}
                                            className={`flex items-start gap-3 p-3 rounded-brand border text-left transition-all interactive ${tipoSeleccionado === t.id
                                                    ? 'bg-amber-dim border-amber-500/40 ring-1 ring-amber-500/20'
                                                    : 'bg-bg-elevated border-border-subtle hover:border-border-strong'
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

                            {/* Rango de Fechas */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-label text-text-secondary flex items-center gap-1.5">
                                        <Icon name="calendar" size={12} /> Inicio
                                    </label>
                                    <input
                                        type="date"
                                        value={fechaInicio}
                                        onChange={(e) => setFechaInicio(e.target.value)}
                                        className="w-full bg-bg-base border border-border-default rounded-md px-2 py-1.5 text-[12px] interactive"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-label text-text-secondary flex items-center gap-1.5">
                                        <Icon name="calendar" size={12} /> Fin
                                    </label>
                                    <input
                                        type="date"
                                        value={fechaFin}
                                        onChange={(e) => setFechaFin(e.target.value)}
                                        className="w-full bg-bg-base border border-border-default rounded-md px-2 py-1.5 text-[12px] interactive"
                                    />
                                </div>
                            </div>

                            {/* Formato */}
                            <div className="space-y-2">
                                <label className="text-label text-text-secondary">Formato de descarga</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setFormato('PDF')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-[11px] font-mono border transition-colors ${formato === 'PDF' ? 'bg-amber-500 text-white border-amber-500' : 'bg-bg-elevated border-border-subtle text-text-secondary hover:border-border-strong'}`}
                                    >
                                        <Icon name="normativa" size={14} /> PDF
                                    </button>
                                    <button
                                        onClick={() => setFormato('EXCEL')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-[11px] font-mono border transition-colors ${formato === 'EXCEL' ? 'bg-green-600 text-white border-green-600' : 'bg-bg-elevated border-border-subtle text-text-secondary hover:border-border-strong'}`}
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
                    <div className="flex items-center justify-between">
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
    );
}
