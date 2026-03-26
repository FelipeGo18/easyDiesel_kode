import { forwardRef } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';

export const HomeNews = forwardRef<HTMLElement, {}>((_, ref) => {
    return (
        <section ref={ref} id="noticias" className="relative z-10 py-16 px-6 border-t border-border-subtle bg-bg-base scroll-section">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Icon name="news" size={18} className="text-amber-500" />
                            <h2 className="text-h1 text-text-primary">Noticias y regulación</h2>
                        </div>
                        <p className="text-small text-text-secondary">Últimas actualizaciones del sector hidrocarburos en Colombia.</p>
                    </div>
                    <Button variant="ghost" size="sm">
                        Ver todas
                        <Icon name="arrow-right" size={14} />
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Mock news skeleton */}
                    {[1, 2, 3].map(i => (
                        <div key={i} className="group cursor-pointer">
                            <div className="w-full h-48 rounded-[4px] bg-bg-elevated mb-4 overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <div className="absolute bottom-3 left-3 flex gap-2">
                                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 text-[10px] font-mono font-bold backdrop-blur-sm border border-amber-500/30">SIC</span>
                                    <span className="px-2 py-0.5 rounded bg-black/40 text-text-muted text-[10px] font-sans backdrop-blur-sm border border-white/10">Hace 2 horas</span>
                                </div>
                            </div>
                            <h3 className="text-[16px] font-display text-text-primary group-hover:text-amber-500 transition-colors leading-tight mb-2">
                                {i === 1 ? 'Nuevas medidas de control para estaciones de servicio de frontera' :
                                 i === 2 ? 'MinMinas anuncia ajustes en la fórmula de paridad de exportación' :
                                 'Sanciones por especulación en el precio del ACPM: Qué debes saber'}
                            </h3>
                            <p className="text-[13px] text-text-secondary line-clamp-2 leading-relaxed">
                                {i === 1 ? 'La Superintendencia de Industria y Comercio ha publicado directrices actualizadas para el monitoreo de volúmenes en zonas limítrofes, afectando a más de 200 EDS.' :
                                 i === 2 ? 'El Ministerio de Minas y Energía confirmó una ligera reducción en la ponderación del flete marítimo, lo que podría impactar tarifas a partir del próximo mes.' :
                                 'Durante el último trimestre, tres redes de distribución fueron multadas severamente por exceder el margen máximo permitido (MMP) en ciudades principales.'}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
});

HomeNews.displayName = 'HomeNews';
