import { useEffect, useRef } from 'react';

/* ══════════════════════════════════════════════════════
   CursorGlow — Soft amber trail that follows the cursor
   Only on desktop (pointer: fine). Over interactive
   elements it expands into a larger blob.
   ══════════════════════════════════════════════════════ */

export function CursorGlow() {
    const glowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Only desktop with fine pointer
        if (window.matchMedia('(pointer: coarse)').matches) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const glow = glowRef.current;
        if (!glow) return;

        let mouseX = 0;
        let mouseY = 0;
        let currentX = 0;
        let currentY = 0;
        let raf: number;
        let isHovering = false;

        const onMove = (e: MouseEvent) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        };

        const onOverInteractive = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest('button, a, [role="button"], select, .interactive')) {
                if (!isHovering) {
                    isHovering = true;
                    glow.style.width = '80px';
                    glow.style.height = '80px';
                    glow.style.opacity = '0.18';
                }
            } else if (isHovering) {
                isHovering = false;
                glow.style.width = '40px';
                glow.style.height = '40px';
                glow.style.opacity = '0.10';
            }
        };

        const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

        const tick = () => {
            currentX = lerp(currentX, mouseX, 0.15);
            currentY = lerp(currentY, mouseY, 0.15);
            glow.style.transform = `translate(${currentX - 20}px, ${currentY - 20}px)`;
            raf = requestAnimationFrame(tick);
        };

        window.addEventListener('mousemove', onMove, { passive: true });
        window.addEventListener('mouseover', onOverInteractive, { passive: true });
        raf = requestAnimationFrame(tick);

        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseover', onOverInteractive);
            cancelAnimationFrame(raf);
        };
    }, []);

    // Don't render on touch/coarse devices — the effect ref just won't init
    return (
        <div
            ref={glowRef}
            className="fixed top-0 left-0 z-[9990] pointer-events-none rounded-full hidden md:block"
            style={{
                width: '40px',
                height: '40px',
                opacity: 0.10,
                background: 'radial-gradient(circle, rgba(245,166,35,0.5) 0%, transparent 70%)',
                transition: 'width 0.3s ease, height 0.3s ease, opacity 0.3s ease',
                willChange: 'transform',
            }}
        />
    );
}
