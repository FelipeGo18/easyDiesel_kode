import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';

interface PreloaderProps {
    onComplete: () => void;
}

export function Preloader({ onComplete }: PreloaderProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const hexRef = useRef<SVGPathElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    const dropRef = useRef<SVGPathElement>(null);
    const [progress, setProgress] = useState(0);
    const [gone, setGone] = useState(false);

    const stableComplete = useCallback(onComplete, [onComplete]);

    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            stableComplete();
            return;
        }

        const root = rootRef.current;
        const hexPath = hexRef.current;
        if (!root || !hexPath) return;

        const hexLen = hexPath.getTotalLength();
        gsap.set(hexPath, { strokeDasharray: hexLen, strokeDashoffset: hexLen });
        if (dropRef.current) gsap.set(dropRef.current, { opacity: 0 });

        const tl = gsap.timeline({
            onComplete() {
                // Iris-open: shrink the overlay via clip-path circle
                gsap.to(root, {
                    clipPath: 'circle(0% at 50% 50%)',
                    duration: 0.7,
                    ease: 'power3.in',
                    onComplete() {
                        setGone(true);
                        stableComplete();
                    },
                });
            },
        });

        // Phase 1: hex stroke draw + drop fade
        tl.to(hexPath, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut' }, 0);
        if (dropRef.current) {
            tl.to(dropRef.current, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 0.9);
        }

        // Phase 2: progress bar
        const proxy = { val: 0 };
        tl.to(proxy, {
            val: 100,
            duration: 2,
            ease: 'power1.inOut',
            onUpdate() {
                const v = Math.round(proxy.val);
                setProgress(v);
                if (progressRef.current) progressRef.current.style.width = `${v}%`;
            },
        }, 0);

        // Phase 3: typewriter messages
        const msgs = [
            'CARGANDO DATOS DE COMBUSTIBLE...',
            'CONECTANDO CON MINMINAS...',
            'SISTEMA LISTO',
        ];
        msgs.forEach((msg, i) => {
            tl.call(() => { if (textRef.current) textRef.current.textContent = msg; }, [], 0.3 + i * 0.65);
        });

        // Hold a beat at 100% before iris-open
        tl.to({}, { duration: 0.35 });

        return () => { tl.kill(); };
    }, [stableComplete]);

    if (gone) return null;

    return (
        <div
            ref={rootRef}
            className="fixed inset-0 z-[9999] bg-bg-base flex flex-col items-center justify-center"
            style={{ clipPath: 'circle(150% at 50% 50%)' }}
        >
            {/* Hex logo */}
            <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24 md:w-32 md:h-32 mb-8">
                <defs>
                    <radialGradient id="pl-dg" cx="38%" cy="28%" r="70%">
                        <stop offset="0%" stopColor="#FFD580" />
                        <stop offset="50%" stopColor="#F5A623" />
                        <stop offset="100%" stopColor="#AA6A00" />
                    </radialGradient>
                </defs>
                <path
                    ref={hexRef}
                    d="M50 5 L91 27.5 L91 72.5 L50 95 L9 72.5 L9 27.5 Z"
                    stroke="#F5A623"
                    strokeWidth="2"
                    fill="none"
                />
                <path
                    ref={dropRef}
                    d="M50 21 C50 21 34 43 34 57 C34 67.5 41.3 76 50 76 C58.7 76 66 67.5 66 57 C66 43 50 21 50 21 Z"
                    fill="url(#pl-dg)"
                />
            </svg>

            {/* Mono typewriter text */}
            <span
                ref={textRef}
                className="font-mono text-[11px] text-amber-500/60 tracking-[0.2em] uppercase mb-6 h-4"
            >
                INICIALIZANDO...
            </span>

            {/* Progress bar */}
            <div className="w-48 md:w-64 h-[2px] bg-white/5 rounded-full overflow-hidden">
                <div
                    ref={progressRef}
                    className="h-full bg-amber-500 rounded-full transition-none"
                    style={{ width: '0%' }}
                />
            </div>

            {/* Progress number */}
            <span className="mt-3 font-mono text-[10px] text-text-muted tracking-widest">
                {progress}%
            </span>
        </div>
    );
}
