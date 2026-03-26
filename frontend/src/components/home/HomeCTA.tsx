import { forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';

interface HomeCTAProps {
    isAuthenticated: boolean;
}

export const HomeCTA = forwardRef<HTMLElement, HomeCTAProps>(({ isAuthenticated }, ref) => {
    const navigate = useNavigate();

    return (
        <section ref={ref} className="relative z-10 py-24 px-6 bg-[#0a0a0a] border-y border-border-subtle scroll-section overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_center,rgba(245,166,35,0.08),transparent_70%)] pointer-events-none" />
            <div className="max-w-3xl mx-auto text-center relative z-10">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-amber-700 p-px rounded-2xl relative shadow-[0_0_30px_rgba(245,166,35,0.2)]">
                    <div className="w-full h-full bg-[#050505] rounded-[15px] flex items-center justify-center">
                        <Icon name="dashboard" size={24} className="text-amber-500" />
                    </div>
                </div>
                <h2 className="text-[32px] md:text-[40px] font-display text-text-primary mb-4">¿Operas una estación de servicio?</h2>
                <p className="text-[14px] text-text-secondary max-w-xl mx-auto mb-8 leading-relaxed">
                    Accede al panel de control exclusivo para administradores. Monitorea ingresos, gestiona tanques, descarga facturas PDF en tiempo real y usa la calculadora ISOM.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={() => navigate(isAuthenticated ? '/panel' : '/login')}
                        className="w-full sm:w-auto px-8 py-3 bg-white text-black font-medium rounded-[4px] interactive hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2 cursor-pointer"
                    >
                        {isAuthenticated ? 'Abrir mi panel' : 'Iniciar sesión institucional'}
                        <Icon name="arrow-right" size={16} />
                    </button>
                    {!isAuthenticated && (
                        <button className="w-full sm:w-auto px-8 py-3 border border-border-strong text-text-primary font-medium rounded-[4px] interactive hover:bg-bg-elevated transition-colors cursor-pointer">
                            Contactar ventas
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
});

HomeCTA.displayName = 'HomeCTA';
