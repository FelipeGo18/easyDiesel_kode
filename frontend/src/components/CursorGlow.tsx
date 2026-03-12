import { useEffect, useRef } from 'react';

/* ══════════════════════════════════════════════════════
   CursorGlow — Particle trail cursor effect
   A chain of dots that follow the mouse with staggered
   delay — each dot inherits position from the previous
   one, creating a snake/comet tail effect.
   Desktop only (pointer: fine).
   ══════════════════════════════════════════════════════ */

const TRAIL_LENGTH = 7;

export function CursorGlow() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (window.matchMedia('(pointer: coarse)').matches) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const container = containerRef.current;
        if (!container) return;

        // Build trail dot elements — appended to body so z-index is unambiguous
        const dots: HTMLDivElement[] = [];
        for (let i = 0; i < TRAIL_LENGTH; i++) {
            const dot = document.createElement('div');
            const progress = 1 - i / TRAIL_LENGTH; // 1 = head, 0 = tail
            // Head: 5px, tail: ~1.5px — thin, refined
            const size = Math.max(1.5, 5 * progress);
            // Head: 0.55 opacity, tail fades to nearly 0
            const opacity = 0.55 * progress * progress;
            dot.style.cssText = `
                position: fixed; top: 0; left: 0;
                width: ${size}px; height: ${size}px;
                border-radius: 50%;
                pointer-events: none;
                will-change: transform;
                z-index: 9990;
                background: rgba(245,166,35,${opacity});
                box-shadow: 0 0 ${4 * progress}px rgba(245,166,35,${opacity * 0.6});
            `;
            document.body.appendChild(dot);
            dots.push(dot);
        }

        // Subtle ring cursor
        const ring = document.createElement('div');
        ring.style.cssText = `
            position: fixed; top: 0; left: 0;
            width: 24px; height: 24px;
            border-radius: 50%;
            border: 1px solid rgba(245,166,35,0.35);
            pointer-events: none;
            will-change: transform;
            z-index: 9990;
            transition: width 0.2s ease, height 0.2s ease, border-color 0.2s ease, opacity 0.2s ease;
            opacity: 0;
        `;
        document.body.appendChild(ring);

        // Trail positions — each index stores [x, y]
        const positions: [number, number][] = Array.from({ length: TRAIL_LENGTH }, () => [-100, -100]);
        let mouseX = -100;
        let mouseY = -100;
        let raf: number;
        let isOnInteractive = false;

        const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

        const onMove = (e: MouseEvent) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        };

        const onOver = (e: MouseEvent) => {
            const t = e.target as HTMLElement;
            const interactive = !!t.closest('button, a, [role="button"], select, .interactive');
            if (interactive !== isOnInteractive) {
                isOnInteractive = interactive;
                if (interactive) {
                    ring.style.width = '34px';
                    ring.style.height = '34px';
                    ring.style.borderColor = 'rgba(245,166,35,0.55)';
                    ring.style.opacity = '0.9';
                } else {
                    ring.style.width = '24px';
                    ring.style.height = '24px';
                    ring.style.borderColor = 'rgba(245,166,35,0.35)';
                    ring.style.opacity = '0.6';
                }
            }
        };

        const tick = () => {
            // Head follows mouse with light lerp
            positions[0][0] = lerp(positions[0][0], mouseX, 0.28);
            positions[0][1] = lerp(positions[0][1], mouseY, 0.28);

            // Each subsequent dot follows the one ahead
            for (let i = 1; i < TRAIL_LENGTH; i++) {
                const lag = 0.22 - i * 0.008;
                positions[i][0] = lerp(positions[i][0], positions[i - 1][0], Math.max(0.06, lag));
                positions[i][1] = lerp(positions[i][1], positions[i - 1][1], Math.max(0.06, lag));
            }

            // Apply transforms
            for (let i = 0; i < TRAIL_LENGTH; i++) {
                const half = parseFloat(dots[i].style.width) / 2;
                dots[i].style.transform = `translate(${positions[i][0] - half}px, ${positions[i][1] - half}px)`;
            }

            // Ring follows head
            ring.style.transform = `translate(${positions[0][0] - 16}px, ${positions[0][1] - 16}px)`;

            raf = requestAnimationFrame(tick);
        };

        // Show ring once mouse enters
        const onEnter = () => { ring.style.opacity = '0.6'; };
        const onLeave = () => { ring.style.opacity = '0'; };

        window.addEventListener('mousemove', onMove, { passive: true });
        window.addEventListener('mouseover', onOver, { passive: true });
        document.addEventListener('mouseenter', onEnter);
        document.addEventListener('mouseleave', onLeave);
        raf = requestAnimationFrame(tick);

        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseover', onOver);
            document.removeEventListener('mouseenter', onEnter);
            document.removeEventListener('mouseleave', onLeave);
            cancelAnimationFrame(raf);
            dots.forEach(d => d.parentNode && d.parentNode.removeChild(d));
            ring.parentNode && ring.parentNode.removeChild(ring);
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="hidden md:block"
            style={{ zIndex: 9990, pointerEvents: 'none' }}
        />
    );
}
