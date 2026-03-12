import { useCallback, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ══════════════════════════════════════════════════════
   HeroSection — Cinematic immersive scroll hero
   Single pinned ScrollTrigger with unified scrub timeline.
   All layers animate from a single coordinated timeline.
   ══════════════════════════════════════════════════════ */

interface HeroSectionProps {
    onIntroStateChange?: (completed: boolean) => void;
}

export function HeroSection({ onIntroStateChange }: HeroSectionProps) {
    const heroRef      = useRef<HTMLElement>(null);
    const contentRef   = useRef<HTMLDivElement>(null);
    const gridRef      = useRef<HTMLDivElement>(null);
    const glowRef      = useRef<HTMLDivElement>(null);
    const logoWrapRef  = useRef<HTMLDivElement>(null);
    const logoRef      = useRef<HTMLDivElement>(null);
    const hexStrokeRef = useRef<SVGPathElement>(null);
    const easyRef      = useRef<HTMLSpanElement>(null);
    const dieselRef    = useRef<HTMLSpanElement>(null);
    const taglineRef   = useRef<HTMLParagraphElement>(null);
    const ctaRef       = useRef<HTMLButtonElement>(null);
    const p1Ref        = useRef<HTMLDivElement>(null);
    const p2Ref        = useRef<HTMLDivElement>(null);
    const p3Ref        = useRef<HTMLDivElement>(null);
    const p4Ref        = useRef<HTMLDivElement>(null);

    const onChangeRef = useRef(onIntroStateChange);
    onChangeRef.current = onIntroStateChange;

    const scrollToContent = useCallback(() => {
        const hero = heroRef.current;
        if (hero) {
            const pinEnd = hero.offsetTop + hero.offsetHeight * 3;
            window.scrollTo({ top: pinEnd + 10, behavior: 'smooth' });
        }
    }, []);

    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            onChangeRef.current?.(true);
            return;
        }

        const hero = heroRef.current;
        if (!hero) return;

        const gsapCtx = gsap.context(() => {
            /* ── Hex stroke measure ── */
            const hexPath = hexStrokeRef.current;
            let hexLen = 300;
            if (hexPath) {
                hexLen = hexPath.getTotalLength();
                gsap.set(hexPath, { strokeDasharray: hexLen, strokeDashoffset: hexLen });
            }

            /* ── Initial hidden state ── */
            gsap.set(gridRef.current, { opacity: 0 });
            gsap.set(glowRef.current, { opacity: 0, scale: 0.3 });
            gsap.set(logoRef.current, { rotateY: 90, scale: 0.5, opacity: 0 });
            gsap.set(easyRef.current, { clipPath: 'inset(0 100% 0 0)', opacity: 0 });
            gsap.set('.hero-letter', { y: 80, opacity: 0, rotateX: 40 });
            gsap.set(taglineRef.current, { y: 16, opacity: 0 });
            gsap.set(ctaRef.current, { scaleY: 0, opacity: 0, transformOrigin: 'top center' });
            gsap.set([p1Ref.current, p2Ref.current, p3Ref.current, p4Ref.current], { opacity: 0, scale: 0 });

            /* ═══════════════════════════════════
               ENTRANCE — plays once on load
            ═══════════════════════════════════ */
            const entrance = gsap.timeline({ delay: 0.2 });

            entrance
                .to(gridRef.current, { opacity: 1, duration: 1, ease: 'power2.out' }, 0)
                .to(glowRef.current, { opacity: 1, scale: 1, duration: 1.4, ease: 'power3.out' }, 0)
                .to(logoRef.current, { rotateY: 0, scale: 1, opacity: 1, duration: 1, ease: 'power3.out' }, 0.15);

            if (hexPath) {
                entrance.to(hexPath, { strokeDashoffset: 0, duration: 1, ease: 'power2.inOut' }, 0.2);
            }

            entrance
                .to([p1Ref.current, p2Ref.current, p3Ref.current, p4Ref.current], {
                    opacity: 1, scale: 1, stagger: 0.08, duration: 0.5, ease: 'back.out(1.8)',
                }, 0.3)
                .to(easyRef.current, { clipPath: 'inset(0 0% 0 0)', opacity: 1, duration: 0.55, ease: 'power2.out' }, 0.85)
                .to('.hero-letter', { y: 0, opacity: 1, rotateX: 0, stagger: 0.05, duration: 0.45, ease: 'power3.out' }, 1)
                .to(taglineRef.current, { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }, 1.45)
                .to(ctaRef.current, { scaleY: 1, opacity: 1, duration: 0.35, ease: 'power2.out' }, 1.6);

            /* Continuous ambient particle orbits */
            gsap.to(p1Ref.current, { rotation: 360, repeat: -1, duration: 16, ease: 'none' });
            gsap.to(p2Ref.current, { rotation: -360, repeat: -1, duration: 22, ease: 'none' });
            gsap.to(p3Ref.current, { y: '-=15', x: '+=10', repeat: -1, yoyo: true, duration: 4, ease: 'sine.inOut' });
            gsap.to(p4Ref.current, { y: '+=12', x: '-=8', repeat: -1, yoyo: true, duration: 5, ease: 'sine.inOut' });

            /* ═══════════════════════════════════
               SCRUB EXIT — ONE pinned ScrollTrigger
               with a single master timeline
            ═══════════════════════════════════ */
            const scrubTL = gsap.timeline({ paused: true });

            // 0–0.3: letters scatter (fromTo — from final entrance state so scroll-back restores correctly)
            const letters = hero.querySelectorAll('.hero-letter');
            const yOffsets = [-120, -80, -150, -95, -130, -65];
            const xOffsets = [-40, 20, -30, 50, -20, 35];
            letters.forEach((letter, i) => {
                scrubTL.fromTo(letter,
                    { y: 0, x: 0, opacity: 1, scale: 1, rotateZ: 0 },
                    { y: yOffsets[i], x: xOffsets[i], opacity: 0, scale: 0.6, rotateZ: (i % 2 === 0 ? -15 : 15), duration: 0.35, ease: 'power2.in' },
                0);
            });

            // 0–0.25: "easy" slides left and fades
            scrubTL.fromTo(easyRef.current,
                { x: 0, opacity: 1 },
                { x: -60, opacity: 0, duration: 0.25, ease: 'power2.in' },
            0);

            // 0–0.3: tagline + CTA fade out
            scrubTL.fromTo([taglineRef.current, ctaRef.current],
                { opacity: 1, y: 0 },
                { opacity: 0, y: -30, duration: 0.2, ease: 'power2.in' },
            0);

            // 0.1–0.55: logo floats up gently, subtle tilt, soft fade
            scrubTL.fromTo(logoRef.current,
                { y: 0, scale: 1, rotateY: 0, opacity: 1 },
                { y: -60, scale: 0.85, rotateY: 20, opacity: 0, duration: 0.45, ease: 'none' },
            0.1);

            // 0.1–0.6: grid drifts + fades
            scrubTL.fromTo(gridRef.current,
                { yPercent: 0, opacity: 1 },
                { yPercent: -15, opacity: 0, duration: 0.5, ease: 'none' },
            0.1);

            // 0.1–0.5: particles scatter at different speeds
            scrubTL.fromTo(p1Ref.current, { yPercent: 0, xPercent: 0, opacity: 1 }, { yPercent: -300, xPercent: -80, opacity: 0, duration: 0.4, ease: 'none' }, 0.1);
            scrubTL.fromTo(p2Ref.current, { yPercent: 0, xPercent: 0, opacity: 1 }, { yPercent: -200, xPercent: 60,  opacity: 0, duration: 0.4, ease: 'none' }, 0.12);
            scrubTL.fromTo(p3Ref.current, { yPercent: 0, xPercent: 0, opacity: 1 }, { yPercent: -350, xPercent: -40, opacity: 0, duration: 0.4, ease: 'none' }, 0.08);
            scrubTL.fromTo(p4Ref.current, { yPercent: 0, xPercent: 0, opacity: 1 }, { yPercent: -250, xPercent: 50,  opacity: 0, duration: 0.4, ease: 'none' }, 0.15);

            // 0.3–0.7: glow expands + dims
            scrubTL.fromTo(glowRef.current,
                { scale: 1, opacity: 1 },
                { scale: 3, opacity: 0.25, duration: 0.4, ease: 'none' },
            0.3);

            // 0.6–1.0: entire content wrapper scales and fades (cinema zoom-out)
            scrubTL.fromTo(contentRef.current,
                { scale: 1, opacity: 1 },
                { scale: 0.7, opacity: 0, duration: 0.4, ease: 'power2.in' },
            0.6);

            // 0.7–1.0: glow final fade
            scrubTL.fromTo(glowRef.current,
                { scale: 3, opacity: 0.25 },
                { opacity: 0, duration: 0.3, ease: 'power2.in' },
            0.7);

            /* ── Create the single pinned ScrollTrigger ── */
            ScrollTrigger.create({
                trigger: hero,
                start: 'top top',
                end: '+=250%',
                pin: true,
                pinSpacing: true,
                scrub: 1,
                animation: scrubTL,
                onLeave:     () => onChangeRef.current?.(true),
                onEnterBack: () => onChangeRef.current?.(false),
            });

        }, hero);

        return () => { gsapCtx.revert(); };
    }, []);

    return (
        <div className="hero-root">
            <section
                ref={heroRef}
                className="h-screen relative overflow-hidden bg-bg-base flex flex-col items-center justify-center px-6"
            >
                {/* ── Capa 0: Grid background ── */}
                <div
                    ref={gridRef}
                    className="hero-layer absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(245,166,35,0.05) 1px, transparent 1px),' +
                            'linear-gradient(90deg, rgba(245,166,35,0.05) 1px, transparent 1px)',
                        backgroundSize: '60px 60px',
                        mask: 'radial-gradient(ellipse at center, black 20%, transparent 70%)',
                        WebkitMask: 'radial-gradient(ellipse at center, black 20%, transparent 70%)',
                    }}
                />

                {/* ── Capa 1: Ambient glow ── */}
                <div
                    ref={glowRef}
                    className="hero-layer absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[900px] md:h-[900px] rounded-full pointer-events-none"
                    style={{
                        background: 'radial-gradient(circle, rgba(245,166,35,0.12) 0%, rgba(245,166,35,0.03) 40%, transparent 70%)',
                    }}
                />

                {/* ── Particles ── */}
                <div ref={p1Ref} className="hero-layer absolute top-[15%] left-[10%] pointer-events-none">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/40 shadow-[0_0_12px_rgba(245,166,35,0.5)]" />
                </div>
                <div ref={p2Ref} className="hero-layer absolute bottom-[20%] right-[10%] pointer-events-none">
                    <div className="w-3 h-3 rounded-full bg-amber-500/25 shadow-[0_0_14px_rgba(245,166,35,0.35)]" />
                </div>
                <div ref={p3Ref} className="hero-layer absolute top-[38%] right-[18%] pointer-events-none">
                    <div className="w-2 h-2 rounded-full bg-amber-500/30 shadow-[0_0_8px_rgba(245,166,35,0.3)]" />
                </div>
                <div ref={p4Ref} className="hero-layer absolute bottom-[28%] left-[22%] pointer-events-none">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500/20 shadow-[0_0_6px_rgba(245,166,35,0.25)]" />
                </div>

                {/* ── Main content wrapper ── */}
                <div ref={contentRef} className="relative z-10 flex flex-col items-center justify-center">
                    {/* Logo */}
                    <div
                        ref={logoWrapRef}
                        className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 mb-6"
                        style={{ perspective: '900px' }}
                    >
                        <div ref={logoRef} className="w-full h-full hero-logo-wrap">
                            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_30px_rgba(245,166,35,0.2)]">
                                <defs>
                                    <radialGradient id="hero-dg" cx="38%" cy="28%" r="70%">
                                        <stop offset="0%" stopColor="#FFD580" />
                                        <stop offset="50%" stopColor="#F5A623" />
                                        <stop offset="100%" stopColor="#AA6A00" />
                                    </radialGradient>
                                    <radialGradient id="hero-hbg" cx="50%" cy="38%" r="62%">
                                        <stop offset="0%" stopColor="#1e1100" />
                                        <stop offset="100%" stopColor="#0a0600" />
                                    </radialGradient>
                                </defs>
                                <path d="M50 5 L91 27.5 L91 72.5 L50 95 L9 72.5 L9 27.5 Z" fill="url(#hero-hbg)" />
                                <line x1="9" y1="44" x2="22" y2="44" stroke="#F5A623" strokeWidth="1.8" strokeLinecap="round" opacity="0.55" />
                                <line x1="9" y1="58" x2="22" y2="58" stroke="#F5A623" strokeWidth="1.8" strokeLinecap="round" opacity="0.55" />
                                <line x1="91" y1="44" x2="78" y2="44" stroke="#F5A623" strokeWidth="1.8" strokeLinecap="round" opacity="0.55" />
                                <line x1="91" y1="58" x2="78" y2="58" stroke="#F5A623" strokeWidth="1.8" strokeLinecap="round" opacity="0.55" />
                                <path
                                    ref={hexStrokeRef}
                                    d="M50 5 L91 27.5 L91 72.5 L50 95 L9 72.5 L9 27.5 Z"
                                    stroke="#F5A623" strokeWidth="2.2" fill="none" strokeLinejoin="miter" strokeLinecap="butt"
                                />
                                <path d="M50 21 C50 21 34 43 34 57 C34 67.5 41.3 76 50 76 C58.7 76 66 67.5 66 57 C66 43 50 21 50 21 Z" fill="url(#hero-dg)" />
                                <path d="M44 38 C42.5 44 42 50 43 56" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.22" />
                            </svg>
                        </div>
                    </div>

                    {/* Brand text */}
                    <div className="text-center mb-5">
                        <span
                            ref={easyRef}
                            className="block text-text-secondary text-[20px] md:text-[26px] font-sans font-light tracking-[0.18em] mb-1"
                        >
                            easy
                        </span>
                        <span
                            ref={dieselRef}
                            className="block text-amber-500 font-display text-[64px] md:text-[100px] leading-none tracking-[0.08em]"
                            aria-label="DIESEL"
                        >
                            {'DIESEL'.split('').map((ch, i) => (
                                <span key={i} className="hero-letter inline-block">{ch}</span>
                            ))}
                        </span>
                    </div>

                    {/* Tagline */}
                    <p
                        ref={taglineRef}
                        className="text-center text-text-secondary text-[15px] md:text-[17px] max-w-lg mb-10 leading-relaxed"
                    >
                        Precios regulados de combustible en Colombia.
                        <br />
                        Consulta, compara y encuentra tu estación.
                    </p>

                    {/* CTA */}
                    <button
                        ref={ctaRef}
                        onClick={scrollToContent}
                        className="group flex flex-col items-center gap-3 text-amber-500 hover:text-amber-400 transition-colors cursor-pointer"
                    >
                        <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Explorar precios</span>
                        <div className="relative w-px h-12 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-amber-500 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-b from-amber-500 to-transparent hero-scan-line" />
                        </div>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="hero-chevron">
                            <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
            </section>
        </div>
    );
}
