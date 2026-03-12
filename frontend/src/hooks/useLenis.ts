import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';

gsap.registerPlugin(ScrollTrigger);

/**
 * Singleton Lenis smooth-scroll instance bridged to GSAP ScrollTrigger.
 * Mount once at the App root — one Lenis instance per page.
 */
export function useLenis() {
    const lenisRef = useRef<Lenis | null>(null);

    useEffect(() => {
        const lenis = new Lenis({
            lerp: 0.1,
            smoothWheel: true,
            syncTouch: false,
        });

        lenisRef.current = lenis;

        // Expose globally so components can call programmatic scrollTo
        (window as any).__lenis = lenis;
        lenis.on('scroll', ScrollTrigger.update);

        const rafTicker = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(rafTicker);
        gsap.ticker.lagSmoothing(0);

        return () => {
            gsap.ticker.remove(rafTicker);
            lenis.destroy();
            lenisRef.current = null;
            delete (window as any).__lenis;
        };
    }, []);

    return lenisRef;
}
