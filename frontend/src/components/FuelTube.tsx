import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ══════════════════════════════════════════════════════
   FuelTube — Vertical scroll indicator (Idea B)
   A glass tube on the right edge that fills with amber
   liquid as the user scrolls. Section notches mark each zone.
   ══════════════════════════════════════════════════════ */

const SECTIONS = ['Hero', 'Precios', 'Ruta', 'Estaciones', 'Noticias'];

export function FuelTube() {
    const tubeRef   = useRef<HTMLDivElement>(null);
    const liquidRef = useRef<HTMLDivElement>(null);
    const bubblesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        if (window.matchMedia('(pointer: coarse)').matches) return; // hide on touch devices

        const tube = tubeRef.current;
        const liquid = liquidRef.current;
        if (!tube || !liquid) return;

        const ctx = gsap.context(() => {
            // Liquid fill tracks overall page scroll
            gsap.to(liquid, {
                height: '100%',
                ease: 'none',
                scrollTrigger: {
                    trigger: document.body,
                    start: 'top top',
                    end: 'bottom bottom',
                    scrub: 0.3,
                },
            });

            // Bubbles animation — continuous
            if (bubblesRef.current) {
                const bubbles = bubblesRef.current.children;
                Array.from(bubbles).forEach((bubble, i) => {
                    gsap.to(bubble, {
                        y: `-=${20 + i * 8}`,
                        x: `+=${(i % 2 === 0 ? 2 : -2)}`,
                        opacity: 0,
                        repeat: -1,
                        duration: 2 + i * 0.5,
                        delay: i * 0.7,
                        ease: 'power1.out',
                        onRepeat() {
                            gsap.set(bubble, { y: 0, x: 0, opacity: 0.6 });
                        },
                    });
                });
            }

            // Fade the tube in after hero scroll starts
            gsap.fromTo(tube,
                { opacity: 0, x: 20 },
                {
                    opacity: 1, x: 0,
                    duration: 0.4,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: document.body,
                        start: '5% top',
                        toggleActions: 'play none none reverse',
                    },
                }
            );
        });

        return () => { ctx.revert(); };
    }, []);

    return (
        <div
            ref={tubeRef}
            className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-center gap-0 opacity-0 pointer-events-none"
        >
            {/* Section notches */}
            <div className="relative h-[200px] w-3 flex flex-col">
                {/* Glass tube */}
                <div className="absolute inset-0 rounded-full border border-amber-500/15 bg-bg-elevated/50 backdrop-blur-sm overflow-hidden">
                    {/* Liquid fill */}
                    <div
                        ref={liquidRef}
                        className="absolute bottom-0 left-0 right-0 h-0 rounded-full fuel-tube-liquid"
                        style={{
                            background: 'linear-gradient(to top, #F5A623, #FFD580)',
                        }}
                    />
                    {/* Bubbles */}
                    <div ref={bubblesRef} className="absolute bottom-1 left-1/2 -translate-x-1/2">
                        <div className="w-1 h-1 rounded-full bg-white/40" />
                        <div className="w-0.5 h-0.5 rounded-full bg-white/30 mt-1" />
                        <div className="w-[3px] h-[3px] rounded-full bg-white/25 mt-0.5" />
                    </div>
                </div>

                {/* Section notch marks */}
                {SECTIONS.map((_, i) => (
                    <div
                        key={i}
                        className="absolute left-full ml-1.5 flex items-center"
                        style={{ top: `${(i / (SECTIONS.length - 1)) * 100}%`, transform: 'translateY(-50%)' }}
                    >
                        <div className="w-1.5 h-px bg-amber-500/30" />
                    </div>
                ))}
            </div>
        </div>
    );
}
