import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const MARQUEE_TEXT = 'PRECIOS REGULADOS · DECRETO 1428 · MINMINAS · COLOMBIA 2026 · ';

export function Marquee() {
    const wrapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const wrap = wrapRef.current;
        if (!wrap) return;

        const inner = wrap.querySelector<HTMLDivElement>('.marquee-inner');
        if (!inner) return;

        // Simple infinite loop: translate the inner from 0 to -50% (since we duplicate content)
        const ctx = gsap.context(() => {
            gsap.to(inner, {
                xPercent: -50,
                repeat: -1,
                duration: 30,
                ease: 'none',
            });

            // Subtle background gradient shift on scroll
            gsap.fromTo(wrap,
                { background: 'linear-gradient(180deg, var(--color-bg-base) 0%, var(--color-bg-surface) 100%)' },
                {
                    background: 'linear-gradient(180deg, var(--color-bg-surface) 0%, var(--color-bg-base) 100%)',
                    ease: 'none',
                    scrollTrigger: {
                        trigger: wrap,
                        start: 'top bottom',
                        end: 'bottom top',
                        scrub: true,
                    },
                }
            );
        }, wrap);

        return () => { ctx.revert(); };
    }, []);

    // Duplicate text enough to fill wide screens
    const repeated = MARQUEE_TEXT.repeat(6);

    return (
        <div
            ref={wrapRef}
            className="relative overflow-hidden py-6 md:py-10 select-none pointer-events-none"
        >
            <div className="marquee-inner whitespace-nowrap flex">
                <span className="font-display text-[72px] md:text-[120px] leading-none text-amber-500/[0.07] tracking-wider shrink-0">
                    {repeated}
                </span>
                <span className="font-display text-[72px] md:text-[120px] leading-none text-amber-500/[0.07] tracking-wider shrink-0">
                    {repeated}
                </span>
            </div>
        </div>
    );
}
