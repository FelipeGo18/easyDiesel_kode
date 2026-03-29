import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/useToast';
import api from '@/services/api';
import type { ApiResponse } from '@/types';
import { getErrorMessage } from '@/lib/http';

const MODULOS = ['AUTH', 'INVENTARIO', 'PRECIOS', 'DECRETOS', 'ZONAS', 'USUARIOS', 'ACTORES', 'TANQUES', 'REPORTES'];
const PAGE_LIMIT = 50;

interface AuditoriaLog {
    id: string;
    modulo: string;
    accion: string;
    entidad: string;
    entidadId?: string;
    datosAntes?: Record<string, unknown> | null;
    datosDespues?: Record<string, unknown> | null;
    ip?: string;
    userAgent?: string;
    createdAt: string;
    usuario: {
        nombre: string;
        email: string;
    };
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export function AuditoriaPage() {
    const toast = useToast();
    const [logs, setLogs] = useState<AuditoriaLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<AuditoriaLog | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: PAGE_LIMIT, total: 0, totalPages: 1 });

    // Filtros
    const [filterModulo, setFilterModulo] = useState('');
    const [filterDesde, setFilterDesde] = useState('');
    const [filterHasta, setFilterHasta] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const fetchLogs = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            const params: Record<string, string | number> = { page, limit: PAGE_LIMIT };
            if (filterModulo) params.modulo = filterModulo;
            if (filterDesde) params.desde = filterDesde;
            if (filterHasta) params.hasta = filterHasta;

            const response = await api.get<ApiResponse<AuditoriaLog[]> & { pagination: Pagination }>('/auditoria', { params });
            setLogs(response.data.data ?? []);
            if (response.data.pagination) setPagination(response.data.pagination);
        } catch (error: unknown) {
            toast.error(`Error al cargar logs: ${getErrorMessage(error)}`);
        } finally {
            setLoading(false);
        }
    }, [toast, filterModulo, filterDesde, filterHasta]);

    useEffect(() => {
        setCurrentPage(1);
        fetchLogs(1);
    }, [fetchLogs]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        fetchLogs(page);
    };

    const handleViewDetail = (log: AuditoriaLog) => {
        setSelectedLog(log);
        setModalOpen(true);
    };

    const columns: Column<AuditoriaLog>[] = [
        {
            key: 'createdAt',
            header: 'Fecha/Hora',
            render: (l) => (
                <div className="flex flex-col">
                    <span className="text-[12px] font-medium text-text-primary">{new Date(l.createdAt).toLocaleDateString()}</span>
                    <span className="text-[10px] text-text-muted">{new Date(l.createdAt).toLocaleTimeString()}</span>
                </div>
            )
        },
        {
            key: 'usuario',
            header: 'Usuario',
            render: (l) => (
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                        <Icon name="user" size={12} />
                    </div>
                    <span className="text-[12px] text-text-secondary">{l.usuario.nombre}</span>
                </div>
            )
        },
        {
            key: 'modulo',
            header: 'Módulo',
            render: (l) => (
                <Badge variant="amber" className="text-[9px] uppercase tracking-wider">
                    {l.modulo}
                </Badge>
            )
        },
        {
            key: 'accion',
            header: 'Acción',
            render: (l) => {
                const isCreate = l.accion.includes('crear') || l.accion.includes('registro');
                const isDelete = l.accion.includes('eliminar');
                return (
                    <span className={`text-[12px] font-mono ${isCreate ? 'text-green-500' : isDelete ? 'text-red-500' : 'text-blue-500'}`}>
                        {l.accion.toUpperCase()}
                    </span>
                );
            }
        },
        {
            key: 'entidad',
            header: 'Entidad',
            render: (l) => (
                <span className="text-[12px] text-text-muted">{l.entidad}</span>
            )
        },
        {
            key: 'ip',
            header: 'IP',
            render: (l) => (
                <span className="text-[10px] font-mono text-text-muted">{l.ip || '—'}</span>
            )
        }
    ];

    return (
        <div className="space-y-6 animate-enter">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-h1 text-text-primary mb-1 flex items-center gap-2">
                        <Icon name="audit" size={24} className="text-amber-500" />
                        Rastro de Auditoría
                    </h1>
                    <p className="text-small text-text-secondary">Monitoreo inmutable de todas las operaciones del sistema.</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => fetchLogs(currentPage)}>
                    <Icon name="refresh" size={14} className={loading ? 'animate-spin' : ''} />
                    Refrescar
                </Button>
            </div>

            {/* ── Filtros ── */}
            <Card className="border-border-subtle p-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-text-muted">Módulo</label>
                        <select
                            value={filterModulo}
                            onChange={(e) => setFilterModulo(e.target.value)}
                            className="w-full h-[38px] px-3 py-2 bg-bg-elevated border border-border-default rounded-brand text-text-primary text-[13px] interactive"
                        >
                            <option value="">Todos los módulos</option>
                            {MODULOS.map((m) => (
                                <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1).toLowerCase()}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-text-muted">Desde</label>
                        <input
                            type="date"
                            value={filterDesde}
                            onChange={(e) => setFilterDesde(e.target.value)}
                            className="w-full h-[38px] px-3 py-2 bg-bg-elevated border border-border-default rounded-brand text-text-primary text-[13px] interactive"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-text-muted">Hasta</label>
                        <input
                            type="date"
                            value={filterHasta}
                            onChange={(e) => setFilterHasta(e.target.value)}
                            className="w-full h-[38px] px-3 py-2 bg-bg-elevated border border-border-default rounded-brand text-text-primary text-[13px] interactive"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-text-muted invisible">Acción</label>
                        <button
                            type="button"
                            onClick={() => { setFilterModulo(''); setFilterDesde(''); setFilterHasta(''); }}
                            className="w-full h-[38px] flex items-center justify-center gap-2 px-3 py-2 bg-bg-elevated border border-border-default rounded-brand text-text-muted hover:text-text-primary hover:border-amber-500/50 transition-all text-[11px] font-mono uppercase tracking-wider"
                        >
                            <Icon name="close" size={14} className="opacity-80" />
                            Limpiar filtros
                        </button>
                    </div>
                </div>
                {pagination.total > 0 && (
                    <p className="mt-3 text-[11px] font-mono text-text-muted">
                        {pagination.total.toLocaleString()} evento{pagination.total !== 1 ? 's' : ''} encontrado{pagination.total !== 1 ? 's' : ''} · página {currentPage} de {pagination.totalPages}
                    </p>
                )}
            </Card>

            <Card className="overflow-hidden border-border-subtle">
                <DataTable
                    columns={columns}
                    data={logs}
                    loading={loading}
                    onRowClick={handleViewDetail}
                    searchPlaceholder="Buscar por usuario, acción o módulo..."
                    emptyMessage="No se han registrado eventos de auditoría."
                />
            </Card>

            {/* ── Paginación ── */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={currentPage <= 1}
                        onClick={() => handlePageChange(currentPage - 1)}
                    >
                        <Icon name="arrow-left" size={14} />
                        Anterior
                    </Button>
                    <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => {
                            const page = i + 1;
                            return (
                                <button
                                    key={page}
                                    onClick={() => handlePageChange(page)}
                                    className={[
                                        'h-8 min-w-8 rounded-[6px] px-2 text-[12px] font-mono transition-colors',
                                        page === currentPage
                                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                            : 'text-text-muted hover:bg-bg-elevated hover:text-text-primary',
                                    ].join(' ')}
                                >
                                    {page}
                                </button>
                            );
                        })}
                        {pagination.totalPages > 7 && <span className="text-text-muted text-[12px] px-1">···</span>}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={currentPage >= pagination.totalPages}
                        onClick={() => handlePageChange(currentPage + 1)}
                    >
                        Siguiente
                        <Icon name="arrow-right" size={14} />
                    </Button>
                </div>
            )}

            {/* Modal de Detalle */}
            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Detalle del Evento"
            >
                {selectedLog && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <span className="text-[10px] font-mono text-text-muted uppercase">ID Transacción</span>
                                <p className="text-[12px] text-text-primary font-mono bg-bg-elevated p-2 rounded border border-border-default">{selectedLog.id}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-mono text-text-muted uppercase">Usuario</span>
                                <p className="text-[12px] text-text-primary p-2">{selectedLog.usuario.nombre} ({selectedLog.usuario.email})</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-bg-elevated p-3 rounded-brand border border-border-subtle">
                                <div className="flex items-center gap-2 text-amber-500 mb-1">
                                    <Icon name="activity" size={14} />
                                    <span className="text-[10px] font-bold uppercase">Acción</span>
                                </div>
                                <p className="text-[13px] text-text-primary">{selectedLog.accion}</p>
                            </div>
                            <div className="bg-bg-elevated p-3 rounded-brand border border-border-subtle">
                                <div className="flex items-center gap-2 text-blue-500 mb-1">
                                    <Icon name="database" size={14} />
                                    <span className="text-[10px] font-bold uppercase">Módulo</span>
                                </div>
                                <p className="text-[13px] text-text-primary">{selectedLog.modulo}</p>
                            </div>
                            <div className="bg-bg-elevated p-3 rounded-brand border border-border-subtle">
                                <div className="flex items-center gap-2 text-green-500 mb-1">
                                    <Icon name="globe" size={14} />
                                    <span className="text-[10px] font-bold uppercase">Origen (IP)</span>
                                </div>
                                <p className="text-[13px] text-text-primary">{selectedLog.ip || 'Interno'}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <h4 className="text-[11px] font-bold text-text-secondary uppercase flex items-center gap-2">
                                    <Icon name="eye" size={12} />
                                    Cambios Realizados
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <span className="text-[10px] text-text-muted italic">Estado Anterior</span>
                                        <pre className="text-[11px] bg-bg-base border border-border-default p-3 rounded h-40 overflow-auto text-text-secondary">
                                            {JSON.stringify(selectedLog.datosAntes, null, 2) || '// Sin cambios previos'}
                                        </pre>
                                    </div>
                                    <div className="space-y-1.5">
                                        <span className="text-[10px] text-text-muted italic">Estado Nuevo</span>
                                        <pre className="text-[11px] bg-bg-base border border-border-default p-3 rounded h-40 overflow-auto text-text-primary">
                                            {JSON.stringify(selectedLog.datosDespues, null, 2) || '// Sin datos adicionales'}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border-subtle flex justify-between items-center">
                            <div className="flex items-center gap-2 text-text-muted">
                                <Icon name="clock" size={12} />
                                <span className="text-[11px]">{new Date(selectedLog.createdAt).toLocaleString()}</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>Cerrar</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
