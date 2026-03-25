import { useState, type FormEvent } from 'react';
import { Car, Fuel, Receipt, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/FormFields';
import { useToast } from '@/components/ui/useToast';
import { useAuth } from '@/context/useAuth';
import { getErrorMessage } from '@/lib/http';
import { inventarioService } from '@/services/inventario';
import type { TransaccionCombustible } from '@/types';

function formatCurrency(value: number) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
    }).format(value);
}

function formatGallons(value: number) {
    return new Intl.NumberFormat('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(value);
}

function normalizePlate(value: string) {
    return value.trim().toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9-]/g, '');
}

export function ParticularPanelPage() {
    const { user } = useAuth();
    const toast = useToast();
    const [placa, setPlaca] = useState('');
    const [inputPlaca, setInputPlaca] = useState('');
    const [transactions, setTransactions] = useState<TransaccionCombustible[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const total = transactions.reduce((acc, t) => acc + Number(t.precioTotal), 0);
    const galonesTotal = transactions.reduce((acc, t) => acc + Number(t.galones), 0);

    const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const normalized = normalizePlate(inputPlaca);
        if (!normalized) {
            toast.error('Ingresa una placa válida.');
            return;
        }
        setLoading(true);
        setSearched(true);
        setPlaca(normalized);
        try {
            const result = await inventarioService.listarTransacciones({ placaVehiculo: normalized, limit: 50 });
            setTransactions(result.data ?? []);
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, 'No fue posible consultar el historial'));
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-enter">
            {/* ── Header ── */}
            <div>
                <Badge variant="amber" className="mb-3">USUARIO REGISTRADO</Badge>
                <h1 className="text-h1 text-text-primary">
                    Bienvenido, {user?.nombre?.split(' ')[0] || 'usuario'}
                </h1>
                <p className="text-small text-text-secondary mt-1">
                    Consulta el historial de recargas por placa de vehículo.
                </p>
            </div>

            {/* ── Search ── */}
            <Card className="p-6">
                <div className="flex items-center gap-3 mb-5">
                    <div className="rounded-[14px] border border-amber-500/20 bg-amber-500/[0.08] p-2.5 text-amber-400">
                        <Car size={16} />
                    </div>
                    <div>
                        <h2 className="text-[14px] font-medium text-text-primary">Buscar por placa</h2>
                        <p className="text-[12px] text-text-muted mt-0.5">Ingresa la placa del vehículo para ver su historial de recargas.</p>
                    </div>
                </div>

                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                    <InputField
                        label="Placa del vehículo"
                        placeholder="ABC123"
                        value={inputPlaca}
                        onChange={e => setInputPlaca(e.target.value.toUpperCase())}
                        className="flex-1 font-mono tracking-widest"
                        maxLength={10}
                    />
                    <Button type="submit" isLoading={loading} className="w-full sm:w-auto">
                        Consultar
                    </Button>
                </form>
            </Card>

            {/* ── KPIs (only shown after search) ── */}
            {searched && !loading && transactions.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-[20px] border border-white/10 bg-bg-card p-4">
                        <div className="flex items-center gap-2 text-text-muted mb-2">
                            <Receipt size={14} />
                            <span className="text-[11px] font-mono uppercase tracking-wider">Recargas</span>
                        </div>
                        <p className="text-2xl font-semibold text-text-primary">{transactions.length}</p>
                        <p className="text-[12px] text-text-muted mt-1">registros encontrados</p>
                    </div>
                    <div className="rounded-[20px] border border-white/10 bg-bg-card p-4">
                        <div className="flex items-center gap-2 text-text-muted mb-2">
                            <Fuel size={14} />
                            <span className="text-[11px] font-mono uppercase tracking-wider">Galones</span>
                        </div>
                        <p className="text-2xl font-semibold text-text-primary">{formatGallons(galonesTotal)}</p>
                        <p className="text-[12px] text-text-muted mt-1">comprados en total</p>
                    </div>
                    <div className="rounded-[20px] border border-white/10 bg-bg-card p-4">
                        <div className="flex items-center gap-2 text-text-muted mb-2">
                            <TrendingUp size={14} />
                            <span className="text-[11px] font-mono uppercase tracking-wider">Total pagado</span>
                        </div>
                        <p className="text-2xl font-semibold text-amber-400">{formatCurrency(total)}</p>
                        <p className="text-[12px] text-text-muted mt-1">placa {placa}</p>
                    </div>
                </div>
            )}

            {/* ── Results table ── */}
            {searched && (
                <Card>
                    <div className="p-5 border-b border-border-subtle flex items-center justify-between">
                        <div>
                            <h2 className="text-[14px] font-medium text-text-primary">Historial de recargas</h2>
                            <p className="text-[12px] text-text-muted mt-0.5">
                                {loading ? 'Buscando...' : transactions.length > 0 ? `${transactions.length} registros para placa ${placa}` : `Sin registros para placa ${placa}`}
                            </p>
                        </div>
                    </div>

                    {loading && (
                        <div className="p-6 space-y-3">
                            {[1, 2, 3].map(i => <div key={i} className="h-10 bg-bg-elevated rounded animate-pulse" />)}
                        </div>
                    )}

                    {!loading && transactions.length === 0 && searched && (
                        <div className="flex flex-col items-center justify-center py-14 gap-3 text-text-muted">
                            <Receipt size={32} className="opacity-30" />
                            <p className="text-small">No se encontraron recargas para la placa <span className="font-mono">{placa}</span>.</p>
                        </div>
                    )}

                    {!loading && transactions.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-[12px]">
                                <thead>
                                    <tr className="border-b border-border-subtle">
                                        {['Fecha', 'Estación', 'Combustible', 'Servicio', 'Galones', 'Precio/gal', 'Total'].map(h => (
                                            <th key={h} className="text-left px-4 py-2.5 text-text-muted font-medium tracking-wide uppercase text-[10px]">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-subtle">
                                    {transactions.map(t => (
                                        <tr key={t.id} className="hover:bg-bg-elevated/40 transition-colors">
                                            <td className="px-4 py-3 font-mono text-text-muted">
                                                {new Date((t as any).createdAt ?? t.fecha).toLocaleDateString('es-CO', {
                                                    year: 'numeric', month: 'short', day: 'numeric',
                                                })}
                                            </td>
                                            <td className="px-4 py-3 text-text-primary">
                                                {(t as any).estacion?.nombre ?? '—'}
                                                {(t as any).estacion?.ciudad && (
                                                    <span className="ml-1 text-text-muted">{(t as any).estacion.ciudad}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="amber">{t.tipoCombustible}</Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="blue">{t.tipoServicio}</Badge>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-text-secondary">
                                                {formatGallons(Number(t.galones))}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-text-muted">
                                                {formatCurrency(Number(t.precioUnitario))}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-amber-400 font-medium">
                                                {formatCurrency(Number(t.precioTotal))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
}
