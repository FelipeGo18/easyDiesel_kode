import { useCallback, useEffect, useState } from 'react';
import { BookOpen, Building2, Fuel, MapPin, Scale, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { KpiCard } from '@/components/ui/KpiCard';
import { useToast } from '@/components/ui/useToast';
import { getErrorMessage } from '@/lib/http';
import { zonasService, preciosService, decretosService, type Zona, type Precio, type Decreto } from '@/services/admin';
import { estacionesService } from '@/services/actores';
import type { EstacionServicio } from '@/types';

function formatCurrency(value: number) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
    }).format(value);
}

export function ReguladorPanelPage() {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [zonas, setZonas] = useState<Zona[]>([]);
    const [precios, setPrecios] = useState<Precio[]>([]);
    const [decretos, setDecretos] = useState<Decreto[]>([]);
    const [estaciones, setEstaciones] = useState<EstacionServicio[]>([]);
    const [filtroZona, setFiltroZona] = useState<string>('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [zonasData, preciosData, decretosData, estacionesData] = await Promise.all([
                zonasService.getAll(),
                preciosService.getAll({ activo: 'true' }),
                decretosService.getAll(),
                estacionesService.getAll({ limit: 200 }),
            ]);
            setZonas(zonasData);
            setPrecios(preciosData);
            setDecretos(decretosData);
            setEstaciones(estacionesData.data ?? []);
        } catch (error: unknown) {
            toast.error(`Error al cargar datos regulatorios: ${getErrorMessage(error)}`);
        } finally {
            setLoading(false);
        }
    }, []); // toast excluded — stable ref

    useEffect(() => { fetchData(); }, [fetchData]);

    const decretoActivos = decretos.filter(d => d.activo);
    const preciosFiltrados = filtroZona ? precios.filter(p => p.zonaId === filtroZona) : precios;
    const estacionesFiltradas = filtroZona ? estaciones.filter(e => e.zonaId === filtroZona) : estaciones;

    return (
        <div className="space-y-6 animate-enter">
            {/* ── Header ── */}
            <section className="relative overflow-hidden rounded-[28px] border border-emerald-500/20 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_30%),linear-gradient(135deg,rgba(18,18,16,1)_0%,rgba(12,12,10,1)_55%,rgba(2,28,20,1)_100%)] p-6 sm:p-8">
                <div className="relative">
                    <Badge variant="green" className="mb-4">ROL REGULATORIO · INSPECCIÓN</Badge>
                    <h1 className="text-3xl font-semibold text-white">Regulación y Cumplimiento</h1>
                    <p className="mt-2 text-sm text-white/65 max-w-2xl">
                        Panel de inspección: precios vigentes por zona, decretos normativos y estaciones supervisadas. Solo lectura.
                    </p>

                    {/* Zone filter pills */}
                    {zonas.length > 0 && (
                        <div className="mt-5 flex flex-wrap gap-2">
                            <button
                                onClick={() => setFiltroZona('')}
                                className={`px-3 py-1.5 rounded-[10px] text-[12px] font-medium border transition-colors ${
                                    !filtroZona
                                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                                        : 'border-white/10 bg-white/5 text-white/55 hover:bg-white/10'
                                }`}
                            >
                                Todas las zonas
                            </button>
                            {zonas.map(z => (
                                <button
                                    key={z.id}
                                    onClick={() => setFiltroZona(z.id)}
                                    className={`px-3 py-1.5 rounded-[10px] text-[12px] font-medium border transition-colors ${
                                        filtroZona === z.id
                                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                                            : 'border-white/10 bg-white/5 text-white/55 hover:bg-white/10'
                                    }`}
                                >
                                    {z.nombre}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ── KPIs ── */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <KpiCard
                    label="Zonas regulatorias"
                    value={String(zonas.length)}
                    icon={<MapPin className="w-4 h-4" />}
                />
                <KpiCard
                    label="Estaciones supervisadas"
                    value={String(estacionesFiltradas.length)}
                    icon={<Building2 className="w-4 h-4" />}
                />
                <KpiCard
                    label="Precios vigentes"
                    value={String(preciosFiltrados.length)}
                    icon={<Fuel className="w-4 h-4" />}
                />
                <KpiCard
                    label="Decretos activos"
                    value={String(decretoActivos.length)}
                    icon={<BookOpen className="w-4 h-4" />}
                />
            </div>

            {/* ── Main content ── */}
            <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
                {/* Precios vigentes table */}
                <Card className="p-0 overflow-hidden">
                    <div className="flex items-center gap-3 border-b border-border-subtle px-5 py-4">
                        <div className="rounded-[14px] border border-border-subtle bg-bg-elevated p-2.5 text-emerald-400">
                            <Scale className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-[14px] font-semibold text-text-primary">Precios vigentes</h2>
                            <p className="text-[11px] text-text-muted mt-0.5">
                                {preciosFiltrados.length} precios activos
                                {filtroZona ? ` en ${zonas.find(z => z.id === filtroZona)?.nombre}` : ' en todas las zonas'}
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-5 space-y-3">
                            {[1, 2, 3, 4].map(i => <div key={i} className="h-9 bg-bg-elevated rounded animate-pulse" />)}
                        </div>
                    ) : preciosFiltrados.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-text-muted">
                            <Scale className="w-8 h-8 opacity-30" />
                            <p className="text-small">Sin precios vigentes para el filtro seleccionado.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-[12px]">
                                <thead>
                                    <tr className="border-b border-border-subtle">
                                        {['Zona', 'Combustible', 'Servicio', 'Precio/gal', 'Subsidio', 'Decreto'].map(h => (
                                            <th key={h} className="px-4 py-2.5 text-left text-[10px] font-medium text-text-muted uppercase tracking-wider">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-subtle">
                                    {preciosFiltrados.map(p => (
                                        <tr key={p.id} className="hover:bg-bg-elevated/40 transition-colors">
                                            <td className="px-4 py-3 text-text-primary">
                                                <span className="font-medium">{p.zona?.nombre ?? '—'}</span>
                                                {p.zona?.tipoZona && (
                                                    <span className="ml-2 text-[10px] font-mono text-text-muted uppercase">{p.zona.tipoZona}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="amber">{p.tipoCombustible}</Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="blue">{p.tipoServicio}</Badge>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-amber-400 font-medium">
                                                {formatCurrency(Number(p.precioGalon))}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-text-secondary">
                                                {Number(p.subsidioGalon) > 0 ? formatCurrency(Number(p.subsidioGalon)) : '—'}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-[11px] text-text-muted">
                                                {p.decreto?.numero ?? '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>

                {/* Right column */}
                <div className="space-y-6">
                    {/* Decretos activos */}
                    <Card>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="rounded-[14px] border border-border-subtle bg-bg-elevated p-2.5 text-sky-400">
                                <BookOpen className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-[14px] font-semibold text-text-primary">Decretos activos</h3>
                                <p className="text-[11px] text-text-muted mt-0.5">
                                    {decretoActivos.length} instrumentos normativos vigentes
                                </p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="space-y-2">
                                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-bg-elevated rounded animate-pulse" />)}
                            </div>
                        ) : decretoActivos.length === 0 ? (
                            <p className="text-small text-text-muted py-4 text-center">Sin decretos activos.</p>
                        ) : (
                            <div className="space-y-2">
                                {decretoActivos.slice(0, 8).map(d => (
                                    <div key={d.id} className="rounded-brand border border-border-subtle bg-bg-elevated px-3 py-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-[12px] font-medium text-text-primary">Decreto {d.numero}</p>
                                            <Badge variant="green">Vigente</Badge>
                                        </div>
                                        <p className="mt-1 text-[11px] text-text-muted leading-snug line-clamp-2">{d.titulo}</p>
                                        <p className="mt-1 text-[10px] font-mono text-text-muted opacity-60">
                                            Desde {new Date(d.fechaVigencia).toLocaleDateString('es-CO')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Estaciones supervisadas */}
                    <Card>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="rounded-[14px] border border-border-subtle bg-bg-elevated p-2.5 text-amber-400">
                                <ShieldCheck className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-[14px] font-semibold text-text-primary">Estaciones supervisadas</h3>
                                <p className="text-[11px] text-text-muted mt-0.5">
                                    {estacionesFiltradas.length} puntos de distribución
                                </p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="space-y-2">
                                {[1, 2, 3].map(i => <div key={i} className="h-10 bg-bg-elevated rounded animate-pulse" />)}
                            </div>
                        ) : estacionesFiltradas.length === 0 ? (
                            <p className="text-small text-text-muted py-4 text-center">Sin estaciones para este filtro.</p>
                        ) : (
                            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                                {estacionesFiltradas.slice(0, 25).map(e => (
                                    <div key={e.id} className="rounded-brand border border-border-subtle bg-bg-elevated px-3 py-2.5 flex items-center justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="text-[12px] font-medium text-text-primary truncate">{e.nombre}</p>
                                            <p className="text-[10px] text-text-muted font-mono">{e.ciudad} · SICOM {e.codigoSicom}</p>
                                        </div>
                                        <Badge variant="blue" className="shrink-0">{e.zona?.nombre ?? '—'}</Badge>
                                    </div>
                                ))}
                                {estacionesFiltradas.length > 25 && (
                                    <p className="text-[11px] text-text-muted text-center py-1">
                                        y {estacionesFiltradas.length - 25} más…
                                    </p>
                                )}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
