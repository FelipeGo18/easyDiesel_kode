import { useNavigate } from 'react-router-dom';
import { EconomicRouteMap } from '@/features/economic-route/EconomicRouteMap';
import { Badge } from '@/components/ui/Badge';
import logoSrc from '@/assets/easydiesel_isotipo.svg';

export function EconomicRoutePage() {
    const navigate = useNavigate();

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-[#050709] text-text-primary">
            {/* ── Compact nav ── */}
            <nav className="z-50 flex-none border-b border-white/6 bg-[#050709]/90 backdrop-blur-md">
                <div className="mx-auto flex h-12 max-w-[1920px] items-center justify-between px-4 lg:px-6">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-1.5 text-white/50 transition-colors hover:text-white cursor-pointer"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
                        <span className="text-[11px] font-sans hidden sm:inline">Volver</span>
                    </button>

                    <div className="flex items-center gap-2.5">
                        <img src={logoSrc} alt="easyDiesel" className="h-5 w-5" />
                        <span className="text-[12px] font-heading font-bold text-white tracking-tight">
                            Ruta Económica
                        </span>
                        <Badge variant="amber" className="text-[7px]">BETA</Badge>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] font-mono text-white/30">
                        <span className="hidden md:inline">easyDiesel · UPC 2026</span>
                    </div>
                </div>
            </nav>

            {/* ── Full-bleed map workspace ── */}
            <main className="relative min-h-0 flex-1">
                <EconomicRouteMap />
            </main>
        </div>
    );
}
