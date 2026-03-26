import { forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import type { PublicZona, PublicPrecio } from '@/services/publico';

interface HomePricesProps {
    zonas: PublicZona[];
    zonaSeleccionada: string;
    setZonaSeleccionada: (zona: string) => void;
    combustibleSeleccionado: string;
    setCombustibleSeleccionado: (combustible: string) => void;
    servicioSeleccionado: string;
    setServicioSeleccionado: (servicio: string) => void;
    precios: PublicPrecio[];
    publicDataError: string | null;
    loadingPublicData: boolean;
}

const tiposCombustible = [
    { id: 'ACPM', label: 'ACPM (Diésel)' },
    { id: 'GASOLINA_CORRIENTE', label: 'Gasolina Corriente' },
];

const tiposServicio = [
    { id: 'PARTICULAR', label: 'Particular' },
    { id: 'PUBLICO', label: 'Público' },
    { id: 'OFICIAL', label: 'Oficial' },
    { id: 'DIPLOMATICO', label: 'Diplomático' },
];

export const HomePrices = forwardRef<HTMLElement, HomePricesProps>(({
    zonas,
    zonaSeleccionada,
    setZonaSeleccionada,
    combustibleSeleccionado,
    setCombustibleSeleccionado,
    servicioSeleccionado,
    setServicioSeleccionado,
    precios,
    publicDataError,
    loadingPublicData,
}, ref) => {
    const navigate = useNavigate();

    const precioActual = precios.find(p => {
        return p.zonaId === zonaSeleccionada && p.tipoCombustible === combustibleSeleccionado && p.tipoServicio === servicioSeleccionado;
    });

    const formatCOP = (n: number) =>
        new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);

    return (
        <section
            ref={ref}
            id="precios"
            className="relative z-10 border-t border-border-subtle"
        >
            {/* Atmospheric grid minimal */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(#222 1px, transparent 1px), linear-gradient(90deg, #222 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                    mask: 'radial-gradient(ellipse 70% 80% at 30% 50%, black 20%, transparent 80%)',
                    WebkitMask: 'radial-gradient(ellipse 70% 80% at 30% 50%, black 20%, transparent 80%)',
                }} />
            </div>

            {/* ── Header + Config ── */}
            <div className="relative z-10 max-w-6xl mx-auto w-full px-8 md:px-16 pt-10 lg:pt-14 pb-4">
                <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6 lg:gap-10">
                    {/* Title block */}
                    <div className="prices-header-block flex-1 max-w-2xl pt-2">
                        <span className="font-mono text-[9px] text-amber-500/60 tracking-[0.25em] uppercase block mb-3">Tarifas oficiales e información regulatoria</span>
                        <h2 className="font-display text-[40px] lg:text-[48px] leading-tight text-text-primary mb-3 tracking-wide whitespace-nowrap overflow-hidden text-ellipsis">
                            CONSULTOR DE <span className="text-amber-500">PRECIOS</span>
                        </h2>
                        <p className="text-[13px] text-text-secondary font-sans leading-relaxed max-w-sm">
                            Descubre al instante la tarifa exacta del combustible de acuerdo con tu ubicación, categoría de vehículo y normativa legal vigente.
                        </p>
                        
                        {publicDataError && (
                            <div className="mt-4 flex items-start gap-3 rounded-[4px] border border-amber-500/20 bg-amber-500/5 px-4 py-3 max-w-sm">
                                <Icon name="alert" size={14} className="text-amber-500 mt-0.5 shrink-0" />
                                <p className="text-[11px] text-amber-300/80 font-sans leading-relaxed">{publicDataError}</p>
                            </div>
                        )}
                    </div>

                    {/* Right: Config Form */}
                    <div className="config-card w-full xl:max-w-[480px] shrink-0 bg-[#0c0c0c] border border-[#333] rounded-[4px] p-4 lg:p-5">
                        <div className="space-y-4">
                            {/* Zona */}
                            <div className="form-group">
                                <label htmlFor="select-zona" className="font-mono text-[9px] text-gray-400 uppercase tracking-[0.2em] block mb-2">
                                    Zona de distribución
                                </label>
                                <div className="relative">
                                    <select
                                        id="select-zona"
                                        value={zonaSeleccionada}
                                        onChange={(e) => setZonaSeleccionada(e.target.value)}
                                        disabled={!zonas.length}
                                        className="w-full px-3 py-2.5 bg-[#151515] border border-[#444] rounded-[4px] text-gray-200 text-[12px] font-sans appearance-none cursor-pointer pr-8 focus:border-amber-500/60 focus:outline-none transition-colors"
                                    >
                                        {!zonas.length ? <option value="">Sin zonas</option> : null}
                                        {zonas.map(z => <option key={z.id} value={z.id}>{z.nombre}</option>)}
                                    </select>
                                    <Icon name="chevron-down" size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Combustible */}
                            <div className="form-group">
                                <span className="font-mono text-[9px] text-gray-400 uppercase tracking-[0.2em] block mb-2">Tipo de combustible</span>
                                <div className="flex gap-2 h-[38px]">
                                    {tiposCombustible.map(tc => (
                                        <button key={tc.id} onClick={() => setCombustibleSeleccionado(tc.id)}
                                            className={`flex-1 rounded-[4px] text-[10px] font-mono uppercase tracking-wider cursor-pointer transition-colors border ${
                                                combustibleSeleccionado === tc.id
                                                    ? 'bg-amber-500 border-amber-500 text-black font-bold'
                                                    : 'bg-[#151515] border-[#444] text-gray-400 hover:border-[#666] hover:text-white'
                                            }`}
                                        >
                                            {tc.id === 'ACPM' ? 'ACPM' : 'Gasolina'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Servicio */}
                            <div className="form-group">
                                <span className="font-mono text-[9px] text-gray-400 uppercase tracking-[0.2em] block mb-2">Categoría de vehículo</span>
                                <div className="grid grid-cols-2 gap-2">
                                    {tiposServicio.map(ts => (
                                        <button key={ts.id} onClick={() => setServicioSeleccionado(ts.id)}
                                            className={`py-2 px-1 rounded-[4px] text-[9px] font-mono uppercase tracking-wider cursor-pointer border text-center transition-colors h-[32px] ${
                                                servicioSeleccionado === ts.id
                                                    ? 'bg-amber-500 border-amber-500 text-black font-bold'
                                                    : 'bg-[#151515] border-[#444] text-gray-400 hover:border-[#666] hover:text-white'
                                            }`}
                                        >
                                            {ts.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ 3 Result Cards ═══ */}
            <div className="max-w-6xl mx-auto px-8 md:px-16 pb-12 lg:pb-16 flex-1">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 h-full">

                    {/* ── Card 0 — Precio Vigente + Gauge ── */}
                    <div className="price-card relative overflow-hidden rounded-[4px] border border-[#222] bg-[#0c0c0c] p-5 lg:p-6 flex flex-col justify-between">
                        <div className="pointer-events-none absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-amber-500/60 via-amber-500/20 to-transparent" />

                            <span className="font-mono text-[9px] text-amber-500/60 tracking-[0.25em] uppercase block mb-4">Precio vigente</span>

                        {/* Context */}
                        <div className="flex flex-wrap items-center gap-2 mb-6">
                            <span className="text-[11px] text-text-secondary font-sans">{zonas.find(z => z.id === zonaSeleccionada)?.nombre ?? '—'}</span>
                            <span className="w-1 h-1 rounded-full bg-border-strong" />
                            <span className="text-[11px] text-text-secondary font-sans">{tiposCombustible.find(t => t.id === combustibleSeleccionado)?.label ?? '—'}</span>
                            <Badge variant={Number(precioActual?.subsidioGalon) > 0 ? 'green' : 'amber'}>
                                {Number(precioActual?.subsidioGalon) > 0 ? 'Con subsidio' : 'Sin subsidio'}
                            </Badge>
                        </div>

                        {/* Compact Gauge */}
                        <div className="relative w-full max-w-[200px] mx-auto h-28 mb-4">
                            <svg viewBox="0 0 200 110" className="w-full h-full drop-shadow-[0_0_40px_rgba(245,166,35,0.1)]">
                                <defs>
                                    <linearGradient id="gauge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#2ECC71" />
                                        <stop offset="50%" stopColor="#F5A623" />
                                        <stop offset="100%" stopColor="#E74C3C" />
                                    </linearGradient>
                                    <filter id="gauge-glow">
                                        <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
                                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                                    </filter>
                                </defs>
                                <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#1a1a1a" strokeWidth="12" strokeLinecap="round" />
                                {[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180].map((angle, i) => {
                                    const rad = ((angle - 180) * Math.PI / 180);
                                    return (
                                        <line key={i}
                                            x1={100 + 88 * Math.cos(rad)} y1={100 + 88 * Math.sin(rad)}
                                            x2={100 + 80 * Math.cos(rad)} y2={100 + 80 * Math.sin(rad)}
                                            stroke="#2a2a2a" strokeWidth="1.5" strokeLinecap="round" />
                                    );
                                })}
                                <path className="gauge-arc" d="M 20 100 A 80 80 0 0 1 180 100"
                                    fill="none" stroke="url(#gauge-grad)" strokeWidth="12" strokeLinecap="round"
                                    strokeDasharray="251.3" strokeDashoffset="251.3" filter="url(#gauge-glow)" />
                                <line className="gauge-needle" x1="100" y1="100" x2="100" y2="26"
                                    stroke="#F5A623" strokeWidth="2" strokeLinecap="round"
                                    style={{ transformOrigin: '100px 100px', transform: 'rotate(-90deg)' }} />
                                <circle cx="100" cy="100" r="5" fill="#F5A623" />
                                <circle cx="100" cy="100" r="2.5" fill="#080808" />
                                <text x="12" y="110" fill="#333" fontSize="7" fontFamily="JetBrains Mono,monospace">$0</text>
                                <text x="158" y="110" fill="#333" fontSize="7" fontFamily="JetBrains Mono,monospace">MAX</text>
                            </svg>
                        </div>

                        {/* Price number */}
                        <div className="text-center">
                            <span className="font-display text-[48px] md:text-[56px] leading-none text-amber-500 tracking-wide">
                                {loadingPublicData ? '···' : precioActual ? formatCOP(Number(precioActual.precioGalon)) : '—'}
                            </span>
                            <span className="block text-[10px] text-text-muted font-mono tracking-[0.15em] mt-2 uppercase">por galón</span>
                        </div>

                        {/* Subsidy bar */}
                        {precioActual && Number(precioActual.subsidioGalon) > 0 && (
                            <div className="w-full mt-5">
                                <div className="flex justify-between font-mono text-[9px] text-text-muted mb-1.5">
                                    <span>Subsidio aplicado</span>
                                    <span className="text-green-500">{formatCOP(Number(precioActual.subsidioGalon))} / gal</span>
                                </div>
                                <div className="h-[3px] w-full bg-bg-elevated rounded-full overflow-hidden">
                                    <div className="fuel-subsidy-bar h-full bg-gradient-to-r from-green-500/80 to-green-500/30 rounded-full" style={{ width: '0%' }} />
                                </div>
                            </div>
                        )}
                        {!loadingPublicData && !precioActual && (
                            <p className="text-[11px] text-amber-300/70 font-mono mt-4 text-center">Sin precio vigente</p>
                        )}
                    </div>

                    {/* ── Card 1 — Detalle Regulatorio ── */}
                    <div className="price-card relative overflow-hidden rounded-[4px] border border-[#222] bg-[#0c0c0c] p-5 lg:p-6 flex flex-col justify-between">
                        <div className="pointer-events-none absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-green-500/60 via-green-500/20 to-transparent" />

                        <span className="font-mono text-[9px] text-amber-500/60 tracking-[0.25em] uppercase block mb-6">Detalle regulatorio</span>

                        {precioActual ? (
                            <div className="space-y-4 lg:space-y-5">
                                {/* Subsidio big number */}
                                <div>
                                    <span className="font-mono text-[9px] text-text-muted uppercase tracking-[0.2em] block mb-1">Subsidio por galón</span>
                                    <div className="flex items-end justify-between gap-3">
                                        <span className={`font-display text-[32px] lg:text-[40px] leading-none ${Number(precioActual.subsidioGalon) > 0 ? 'text-green-500' : 'text-text-muted'}`}>
                                            {Number(precioActual.subsidioGalon) > 0 ? formatCOP(Number(precioActual.subsidioGalon)) : 'N/A'}
                                        </span>
                                        {Number(precioActual.subsidioGalon) > 0 && (
                                            <div className="shrink-0 w-9 h-9 rounded-full border border-green-500/30 bg-green-500/10 flex items-center justify-center mb-1">
                                                <Icon name="trending-down" size={16} className="text-green-500" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Stats grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-bg-elevated/50 rounded-[6px] px-4 py-3">
                                        <span className="font-mono text-[8px] text-text-muted uppercase tracking-[0.2em] block mb-1">Decreto</span>
                                        <span className="font-mono text-[18px] text-text-primary font-semibold">{precioActual.decreto?.numero ?? 'N/A'}</span>
                                    </div>
                                    <div className="bg-bg-elevated/50 rounded-[6px] px-4 py-3">
                                        <span className="font-mono text-[8px] text-text-muted uppercase tracking-[0.2em] block mb-1">Categoría</span>
                                        <span className="font-mono text-[14px] text-amber-500 font-semibold leading-tight">
                                            {tiposServicio.find(t => t.id === servicioSeleccionado)?.label ?? '—'}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-bg-elevated/50 rounded-[6px] px-4 py-3">
                                    <span className="font-mono text-[8px] text-text-muted uppercase tracking-[0.2em] block mb-1">Zona</span>
                                    <span className="font-sans text-[13px] text-text-primary font-medium">
                                        {zonas.find(z => z.id === zonaSeleccionada)?.nombre ?? '—'}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-40">
                                <span className="font-mono text-[10px] text-text-muted uppercase tracking-[0.2em]">Sin datos</span>
                            </div>
                        )}
                    </div>

                    {/* ── Card 2 — Comparativa ACPM vs Gasolina ── */}
                    <div className="price-card relative overflow-hidden rounded-[4px] border border-[#222] bg-[#0c0c0c] p-5 lg:p-6 flex flex-col justify-between">
                        <div className="pointer-events-none absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-amber-500/40 via-amber-500/10 to-transparent" />

                        <span className="font-mono text-[9px] text-amber-500/60 tracking-[0.25em] uppercase block mb-3">Comparativa</span>
                        <h3 className="font-display text-[24px] lg:text-[28px] text-text-primary leading-none mb-4">
                            ACPM <span className="text-text-muted text-[16px] lg:text-[20px]">vs</span> GASOLINA
                        </h3>

                        <div className="space-y-2">
                            {tiposCombustible.map((tc) => {
                                const p = precios.find(pr => pr.zonaId === zonaSeleccionada && pr.tipoCombustible === tc.id && pr.tipoServicio === servicioSeleccionado);
                                const isActive = tc.id === combustibleSeleccionado;
                                const hasSubsidy = p && Number(p.subsidioGalon) > 0;
                                return (
                                    <button
                                        key={tc.id}
                                        onClick={() => setCombustibleSeleccionado(tc.id)}
                                        className={`group relative w-full text-left rounded-[8px] p-4 interactive cursor-pointer border transition-all duration-300 overflow-hidden ${
                                            isActive
                                                ? 'border-amber-500/30 bg-bg-elevated'
                                                : 'border-border-subtle bg-bg-elevated/50 hover:border-border-strong'
                                        }`}
                                    >
                                        {isActive && (
                                            <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-amber-500" />
                                        )}
                                        <span className="font-mono text-[8px] text-text-muted uppercase tracking-[0.2em] block mb-2">
                                            {tc.id === 'ACPM' ? 'ACPM · Diésel' : 'Gasolina Corriente'}
                                        </span>
                                        <span className={`font-display text-[36px] leading-none block transition-colors duration-300 ${
                                            isActive ? 'text-amber-500' : 'text-text-primary'
                                        }`}>
                                            {p ? formatCOP(Number(p.precioGalon)) : '—'}
                                        </span>
                                        <span className="font-mono text-[8px] text-text-muted block mt-1">por galón</span>
                                        {hasSubsidy && (
                                            <div className="mt-2 flex items-center gap-1.5">
                                                <Icon name="trending-down" size={10} className="text-green-500" />
                                                <span className="font-mono text-[8px] text-green-500">{formatCOP(Number(p!.subsidioGalon))} subsidio</span>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => navigate('/ruta-economica')}
                            className="mt-5 flex items-center gap-2 text-[10px] font-mono text-amber-500 hover:text-amber-400 transition-colors interactive cursor-pointer"
                        >
                            Ver tabla completa por zona
                            <Icon name="arrow-right" size={11} />
                        </button>
                    </div>

                </div>
            </div>
        </section>
    );
});

HomePrices.displayName = 'HomePrices';
