import { forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export const HomeRouteInfo = forwardRef<HTMLElement, {}>((_, ref) => {
    const navigate = useNavigate();

    return (
        <section ref={ref} className="relative z-10 overflow-hidden border-t border-border-subtle bg-bg-base py-16 px-6 scroll-section">
            <div className="relative max-w-6xl mx-auto">
                {/* Section header */}
                <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <Icon name="navigation" size={18} className="text-amber-500" />
                            <h2 className="text-h1 text-text-primary">Ruta con estaciones en el trayecto</h2>
                            <Badge variant="amber" className="text-[8px] ml-1">NUEVO</Badge>
                        </div>
                        <p className="text-small text-text-secondary max-w-xl">
                            Traza tu viaje entre dos puntos y descubre gasolineras distribuidas a lo largo del recorrido, con precios y tiempos de desvío.
                        </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/ruta-economica')}>
                        <Icon name="navigation" size={14} />
                        Abrir mapa
                    </Button>
                </div>

                {/* Feature card */}
                <div
                    onClick={() => navigate('/ruta-economica')}
                    className="group relative cursor-pointer overflow-hidden rounded-[4px] border border-border-subtle bg-bg-surface transition-all duration-300 hover:border-amber-500/40"
                >

                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr]">
                        {/* ── Left: feature list ── */}
                        <div className="flex flex-col p-7 border-b lg:border-b-0 lg:border-r border-border-subtle route-left">
                            <div className="flex flex-col gap-5 flex-1">
                                <div className="flex items-start gap-3.5">
                                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-brand border border-amber-500/20 bg-amber-500/10">
                                        <Icon name="map" size={15} className="text-amber-500" />
                                    </div>
                                    <div>
                                        <p className="mb-0.5 text-[13px] font-semibold text-text-primary">Ruta origen → destino</p>
                                        <p className="text-[12px] leading-relaxed text-text-secondary">Ingresa dos puntos en Colombia y calcula el trayecto en modo conducción con Mapbox Directions.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3.5">
                                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-brand border border-amber-500/20 bg-amber-500/10">
                                        <Icon name="tank" size={15} className="text-amber-500" />
                                    </div>
                                    <div>
                                        <p className="mb-0.5 text-[13px] font-semibold text-text-primary">Estaciones cada ~10 km</p>
                                        <p className="text-[12px] leading-relaxed text-text-secondary">Detecta la gasolinera más cercana por cada tramo, con un desvío máximo de 3.5 km desde la ruta.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3.5">
                                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-brand border border-amber-500/20 bg-amber-500/10">
                                        <Icon name="search" size={15} className="text-amber-500" />
                                    </div>
                                    <div>
                                        <p className="mb-0.5 text-[13px] font-semibold text-text-primary">Precios y tiempo de desvío</p>
                                        <p className="text-[12px] leading-relaxed text-text-secondary">Consulta el precio por galón según la zona regulada y el desvío real en minutos para cada parada.</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); navigate('/ruta-economica'); }}
                                className="mt-7 flex w-fit items-center gap-2 rounded-brand bg-amber-500 px-5 py-2.5 text-[13px] font-bold text-black transition-all hover:bg-amber-400 active:scale-95"
                            >
                                <Icon name="navigation" size={14} />
                                Trazar mi ruta
                                <Icon name="arrow-right" size={13} />
                            </button>
                        </div>

                        {/* ── Right: visual route preview ── */}
                        <div className="flex flex-col gap-5 p-7 route-right">
                            <div className="flex items-center justify-between">
                                <p className="text-[9px] font-mono uppercase tracking-[0.14em] text-text-muted">Vista del recorrido</p>
                                <span className="rounded border border-amber-500/20 bg-amber-500/6 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-amber-400">Interactivo</span>
                            </div>

                            {/* Route connector diagram */}
                            <div className="flex items-stretch gap-3">
                                <div className="flex flex-col items-center pt-3 relative">
                                    <div className="h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-emerald-500/25 ring-offset-1 ring-offset-bg-surface relative z-10" />
                                    {/* SVG stroke-draw line */}
                                    <svg className="my-1 flex-1 w-[2px] overflow-visible" preserveAspectRatio="none">
                                        <line
                                            className="route-stroke-draw"
                                            x1="1" y1="0" x2="1" y2="100%"
                                            stroke="url(#route-line-grad)"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                        />
                                        <defs>
                                            <linearGradient id="route-line-grad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#2ECC71" stopOpacity="0.6" />
                                                <stop offset="50%" stopColor="#F5A623" stopOpacity="0.4" />
                                                <stop offset="100%" stopColor="#E74C3C" stopOpacity="0.6" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div className="h-3 w-3 rounded-full bg-red-500 ring-2 ring-red-500/25 ring-offset-1 ring-offset-bg-surface relative z-10" />
                                </div>
                                <div className="flex flex-1 flex-col gap-2.5">
                                    <div className="rounded-brand border border-border-subtle bg-bg-elevated px-3 py-2.5">
                                        <p className="text-[9px] font-mono uppercase tracking-wider text-text-muted">Origen</p>
                                        <p className="text-[13px] font-medium text-text-primary">Chapinero, Bogotá</p>
                                    </div>
                                    <div className="flex items-center gap-2.5 px-1 py-1">
                                        {[10, 20, 30, 40].map((km) => (
                                            <div key={km} className="flex flex-col items-center gap-1">
                                                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 transition-colors group-hover:bg-amber-500/18 route-dot">
                                                    <Icon name="tank" size={10} className="text-amber-400" />
                                                </div>
                                                <span className="text-[8px] font-mono text-text-muted">{km} km</span>
                                            </div>
                                        ))}
                                        <div className="flex items-end gap-0.5 pb-3">
                                            <span className="h-1 w-1 rounded-full bg-text-muted/40" />
                                            <span className="h-1 w-1 rounded-full bg-text-muted/30" />
                                            <span className="h-1 w-1 rounded-full bg-text-muted/20" />
                                        </div>
                                    </div>
                                    <div className="rounded-brand border border-border-subtle bg-bg-elevated px-3 py-2.5">
                                        <p className="text-[9px] font-mono uppercase tracking-wider text-text-muted">Destino</p>
                                        <p className="text-[13px] font-medium text-text-primary">Ubaté, Cundinamarca</p>
                                    </div>
                                </div>
                            </div>


                        </div>
                    </div>

                    {/* Bottom accent */}
                    <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
                </div>
            </div>
        </section>
    );
});

HomeRouteInfo.displayName = 'HomeRouteInfo';
