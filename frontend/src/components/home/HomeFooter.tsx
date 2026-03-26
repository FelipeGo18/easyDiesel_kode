import { forwardRef } from 'react';

export const HomeFooter = forwardRef<HTMLElement, {}>((_, ref) => {
    return (
        <footer ref={ref} className="relative z-10 bg-[#050505] pt-16 pb-8 px-6 border-t border-border-subtle scroll-section">
            <div className="max-w-6xl mx-auto flex flex-col items-center">
                {/* Minimal Logo SVG for Footer */}
                <div className="w-12 h-12 mb-6">
                    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                        <defs>
                            <radialGradient id="dg-ft" cx="38%" cy="28%" r="70%">
                                <stop offset="0%" stopColor="#FFD580" />
                                <stop offset="50%" stopColor="#F5A623" />
                                <stop offset="100%" stopColor="#AA6A00" />
                            </radialGradient>
                            <radialGradient id="hbg-ft" cx="50%" cy="38%" r="62%">
                                <stop offset="0%" stopColor="#1e1100" />
                                <stop offset="100%" stopColor="#060400" />
                            </radialGradient>
                        </defs>
                        <path d="M50 5 L91 27.5 L91 72.5 L50 95 L9 72.5 L9 27.5 Z" fill="url(#hbg-ft)" />
                        <line x1="9" y1="44" x2="22" y2="44" stroke="#F5A623" strokeWidth="1.8" strokeLinecap="round" opacity="0.65" />
                        <line x1="9" y1="58" x2="22" y2="58" stroke="#F5A623" strokeWidth="1.8" strokeLinecap="round" opacity="0.65" />
                        <line x1="91" y1="44" x2="78" y2="44" stroke="#F5A623" strokeWidth="1.8" strokeLinecap="round" opacity="0.65" />
                        <line x1="91" y1="58" x2="78" y2="58" stroke="#F5A623" strokeWidth="1.8" strokeLinecap="round" opacity="0.65" />
                        <path d="M50 5 L91 27.5 L91 72.5 L50 95 L9 72.5 L9 27.5 Z" stroke="#F5A623" strokeWidth="2.2" fill="none" strokeLinejoin="miter" />
                        <path d="M50 21 C50 21 34 43 34 57 C34 67.5 41.3 76 50 76 C58.7 76 66 67.5 66 57 C66 43 50 21 50 21 Z" fill="url(#dg-ft)" />
                        <path d="M44 38 C42.5 44 42 50 43 56" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.28" />
                    </svg>
                </div>
                
                <p className="text-[11px] text-text-muted font-sans text-center mb-8 max-w-md mx-auto">
                    Plataforma operativa y de consulta regulatoria para el sector de hidrocarburos e insumos energéticos líquidos en Colombia.
                </p>

                <div className="flex flex-wrap justify-center gap-6 text-[10px] uppercase font-mono tracking-[0.15em] text-text-muted/60 mb-8">
                    <a href="#" className="hover:text-amber-500 transition-colors">Normatividad</a>
                    <a href="#" className="hover:text-amber-500 transition-colors">Auditorías</a>
                    <a href="#" className="hover:text-amber-500 transition-colors">Términos</a>
                    <a href="#" className="hover:text-amber-500 transition-colors">Privacidad</a>
                    <a href="#" className="hover:text-amber-500 transition-colors">API</a>
                </div>

                <div className="text-[10px] text-text-muted/40 font-mono text-center">
                    &copy; 2026 EasyDiesel. Todos los derechos reservados.
                </div>
            </div>
        </footer>
    );
});

HomeFooter.displayName = 'HomeFooter';
