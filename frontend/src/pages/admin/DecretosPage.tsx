import { useState, useEffect, type FormEvent } from 'react';
import { Plus, Pencil, FileText } from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { InputField, TextAreaField, CheckboxField } from '@/components/ui/FormFields';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { decretosService, type Decreto } from '@/services/admin';

export function DecretosPage() {
    const toast = useToast();
    const [decretos, setDecretos] = useState<Decreto[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Decreto | null>(null);

    // Form
    const [numero, setNumero] = useState('');
    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [entidad, setEntidad] = useState('');
    const [fechaExpedicion, setFechaExpedicion] = useState('');
    const [fechaVigencia, setFechaVigencia] = useState('');
    const [activo, setActivo] = useState(true);
    const [documentoUrl, setDocumentoUrl] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchDecretos = async () => {
        try {
            setLoading(true);
            const data = await decretosService.getAll();
            setDecretos(data);
        } catch (err: any) {
            toast.error('Error al cargar decretos: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDecretos(); }, []);

    const openCreate = () => {
        setEditing(null);
        setNumero(''); setTitulo(''); setDescripcion(''); setEntidad('');
        setFechaExpedicion(''); setFechaVigencia('');
        setActivo(true); setDocumentoUrl('');
        setModalOpen(true);
    };

    const openEdit = (d: Decreto) => {
        setEditing(d);
        setNumero(d.numero);
        setTitulo(d.titulo);
        setDescripcion(d.descripcion || '');
        setEntidad(d.entidad || '');
        setFechaExpedicion(d.fechaExpedicion?.slice(0, 10) || '');
        setFechaVigencia(d.fechaVigencia?.slice(0, 10) || '');
        setActivo(d.activo);
        setDocumentoUrl(d.documentoUrl || '');
        setModalOpen(true);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                numero,
                titulo,
                descripcion: descripcion || null,
                entidad: entidad || null,
                fechaExpedicion,
                fechaVigencia,
                activo,
                documentoUrl: documentoUrl || null,
            };

            if (editing) {
                await decretosService.update(editing.id, payload);
                toast.success('Decreto actualizado correctamente');
            } else {
                await decretosService.create(payload);
                toast.success('Decreto creado correctamente');
            }

            setModalOpen(false);
            fetchDecretos();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Error al guardar decreto');
        } finally {
            setSubmitting(false);
        }
    };

    const columns: Column<Decreto>[] = [
        {
            key: 'numero',
            header: 'Número',
            render: (d) => (
                <div className="flex items-center gap-2">
                    <FileText size={14} className="text-amber-500 shrink-0" />
                    <span className="font-mono text-[13px] font-medium">{d.numero}</span>
                </div>
            ),
        },
        { key: 'titulo', header: 'Título' },
        {
            key: 'entidad',
            header: 'Entidad',
            render: (d) => <span className="text-[12px] text-text-secondary">{d.entidad || '—'}</span>,
        },
        {
            key: 'fechaVigencia',
            header: 'Vigencia',
            render: (d) => (
                <span className="font-mono text-[11px] text-text-secondary">
                    {d.fechaVigencia ? new Date(d.fechaVigencia).toLocaleDateString('es-CO') : '—'}
                </span>
            ),
        },
        {
            key: 'activo',
            header: 'Estado',
            render: (d) => <Badge variant={d.activo ? 'green' : 'red'}>{d.activo ? 'Activo' : 'Inactivo'}</Badge>,
        },
    ];

    return (
        <div className="animate-enter">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-h1 text-text-primary">Decretos normativos</h1>
                    <p className="text-small text-text-secondary mt-1">
                        Gestiona los decretos que regulan los precios de combustibles.
                    </p>
                </div>
                <Button onClick={openCreate}>
                    <Plus size={14} strokeWidth={1.5} />
                    Nuevo decreto
                </Button>
            </div>

            <DataTable
                columns={columns}
                data={decretos}
                loading={loading}
                searchPlaceholder="Buscar por número o título..."
                emptyMessage="No hay decretos registrados. Crea el primero."
                actions={(d) => (
                    <button
                        onClick={(e) => { e.stopPropagation(); openEdit(d); }}
                        className="p-1.5 rounded-brand hover:bg-bg-elevated interactive text-text-muted hover:text-amber-500"
                        title="Editar"
                    >
                        <Pencil size={14} />
                    </button>
                )}
            />

            {/* Modal */}
            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editing ? 'Editar decreto' : 'Nuevo decreto'}
                maxWidth="520px"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <InputField
                            label="Número"
                            id="decreto-numero"
                            value={numero}
                            onChange={(e) => setNumero(e.target.value)}
                            placeholder="1428/2025"
                            required
                        />
                        <InputField
                            label="Entidad"
                            id="decreto-entidad"
                            value={entidad}
                            onChange={(e) => setEntidad(e.target.value)}
                            placeholder="Min. Minas y Energía"
                        />
                    </div>
                    <InputField
                        label="Título"
                        id="decreto-titulo"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        placeholder="Título del decreto"
                        required
                    />
                    <TextAreaField
                        label="Descripción"
                        id="decreto-desc"
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        placeholder="Descripción del contenido del decreto"
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <InputField
                            label="Fecha expedición"
                            id="decreto-fexp"
                            type="date"
                            value={fechaExpedicion}
                            onChange={(e) => setFechaExpedicion(e.target.value)}
                            required
                        />
                        <InputField
                            label="Fecha vigencia"
                            id="decreto-fvig"
                            type="date"
                            value={fechaVigencia}
                            onChange={(e) => setFechaVigencia(e.target.value)}
                            required
                        />
                    </div>
                    <InputField
                        label="URL del documento"
                        id="decreto-url"
                        type="url"
                        value={documentoUrl}
                        onChange={(e) => setDocumentoUrl(e.target.value)}
                        placeholder="https://..."
                    />
                    <CheckboxField
                        label="Decreto activo (vigente)"
                        checked={activo}
                        onChange={setActivo}
                        id="decreto-activo"
                    />
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" isLoading={submitting}>
                            {editing ? 'Guardar cambios' : 'Crear decreto'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
