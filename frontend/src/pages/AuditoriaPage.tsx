import { useState, useEffect } from 'react';
import { 
    Shield, 
    RefreshCcw,
    User,
    Database,
    Activity,
    Eye,
    Globe,
    Clock
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';

interface AuditoriaLog {
    id: string;
    modulo: string;
    accion: string;
    entidad: string;
    entidadId?: string;
    datosAntes?: any;
    datosDespues?: any;
    ip?: string;
    userAgent?: string;
    createdAt: string;
    usuario: {
        nombre: string;
        email: string;
    };
}

export function AuditoriaPage() {
    const toast = useToast();
    const [logs, setLogs] = useState<AuditoriaLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<AuditoriaLog | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response = await api.get('/auditoria');
            setLogs(response.data.data);
        } catch (err: any) {
            toast.error('Error al cargar logs: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLogs(); }, []);

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
                        <User size={12} />
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-h1 text-text-primary mb-1 flex items-center gap-2">
                        <Shield size={24} className="text-amber-500" />
                        Rastro de Auditoría
                    </h1>
                    <p className="text-small text-text-secondary">Monitoreo inmutable de todas las operaciones del sistema.</p>
                </div>
                <Button variant="ghost" size="sm" onClick={fetchLogs}>
                    <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
                    Refrescar
                </Button>
            </div>

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

            {/* Modal de Detalle */}
            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Detalle del Evento"
            >
                {selectedLog && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <span className="text-[10px] font-mono text-text-muted uppercase">ID Transacción</span>
                                <p className="text-[12px] text-text-primary font-mono bg-bg-elevated p-2 rounded border border-border-default">{selectedLog.id}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-mono text-text-muted uppercase">Usuario</span>
                                <p className="text-[12px] text-text-primary p-2">{selectedLog.usuario.nombre} ({selectedLog.usuario.email})</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-bg-elevated p-3 rounded-brand border border-border-subtle">
                                <div className="flex items-center gap-2 text-amber-500 mb-1">
                                    <Activity size={14} />
                                    <span className="text-[10px] font-bold uppercase">Acción</span>
                                </div>
                                <p className="text-[13px] text-text-primary">{selectedLog.accion}</p>
                            </div>
                            <div className="bg-bg-elevated p-3 rounded-brand border border-border-subtle">
                                <div className="flex items-center gap-2 text-blue-500 mb-1">
                                    <Database size={14} />
                                    <span className="text-[10px] font-bold uppercase">Módulo</span>
                                </div>
                                <p className="text-[13px] text-text-primary">{selectedLog.modulo}</p>
                            </div>
                            <div className="bg-bg-elevated p-3 rounded-brand border border-border-subtle">
                                <div className="flex items-center gap-2 text-green-500 mb-1">
                                    <Globe size={14} />
                                    <span className="text-[10px] font-bold uppercase">Origen (IP)</span>
                                </div>
                                <p className="text-[13px] text-text-primary">{selectedLog.ip || 'Interno'}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <h4 className="text-[11px] font-bold text-text-secondary uppercase flex items-center gap-2">
                                    <Eye size={12} />
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
                                <Clock size={12} />
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
