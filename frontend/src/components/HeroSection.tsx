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
    const canvasRef    = useRef<HTMLCanvasElement>(null);
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

    /* ══════════════════════════════════════════════════════
       Canvas particle background — flowing constellation
       + nebulae + rising ember sparks + connection web
    ══════════════════════════════════════════════════════ */
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let raf: number;
        let W = 0, H = 0;
        let mouseX = -1, mouseY = -1;

        interface Dot {
            x: number; y: number;
            vx: number; vy: number;
            r: number; alpha: number;
            alphaSpeed: number; alphaDir: number;
        }

        interface Ember {
            x: number; y: number;
            vy: number; vx: number;
            life: number; maxLife: number;
            r: number;
        }

        const DOTS = 75;
        const EMBERS = 30;
        const CONNECTION_DIST = 140;
        const dots: Dot[] = [];
        const embers: Ember[] = [];

        const resize = () => {
            W = canvas.width  = canvas.offsetWidth  || window.innerWidth;
            H = canvas.height = canvas.offsetHeight || window.innerHeight;
        };
        resize();
        const retryId = setTimeout(resize, 100);
        window.addEventListener('resize', resize, { passive: true });

        const onMouse = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
        };
        window.addEventListener('mousemove', onMouse, { passive: true });

        // Spawn dots
        for (let i = 0; i < DOTS; i++) {
            dots.push({
                x: Math.random() * (W || window.innerWidth),
                y: Math.random() * (H || window.innerHeight),
                vx: (Math.random() - 0.5) * 0.35,
                vy: (Math.random() - 0.5) * 0.25,
                r: Math.random() * 2 + 0.5,
                alpha: Math.random() * 0.5 + 0.15,
                alphaSpeed: Math.random() * 0.003 + 0.001,
                alphaDir: Math.random() > 0.5 ? 1 : -1,
            });
        }

        // Spawn initial embers
        const spawnEmber = (): Ember => ({
            x: Math.random() * (W || window.innerWidth),
            y: (H || window.innerHeight) + Math.random() * 20,
            vy: -(Math.random() * 0.8 + 0.3),
            vx: (Math.random() - 0.5) * 0.4,
            life: 0,
            maxLife: 180 + Math.random() * 120,
            r: Math.random() * 1.5 + 0.4,
        });
        for (let i = 0; i < EMBERS; i++) {
            const e = spawnEmber();
            e.y = Math.random() * (H || window.innerHeight);
            e.life = Math.random() * e.maxLife;
            embers.push(e);
        }

        // Nebula angles
        let ang1 = 0, ang2 = Math.PI, ang3 = Math.PI * 0.5;

        const draw = () => {
            ctx.clearRect(0, 0, W, H);

            // ── Nebula blobs (3) ──
            ang1 += 0.0014; ang2 += 0.001; ang3 += 0.0018;
            const drawNeb = (cx: number, cy: number, r: number, a: number) => {
                const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
                g.addColorStop(0, `rgba(245,166,35,${a})`);
                g.addColorStop(0.5, `rgba(245,166,35,${a * 0.35})`);
                g.addColorStop(1, 'transparent');
                ctx.fillStyle = g;
                ctx.fillRect(0, 0, W, H);
            };
            drawNeb(
                W * 0.5 + Math.cos(ang1) * W * 0.18,
                H * 0.45 + Math.sin(ang1 * 1.3) * H * 0.12,
                W * 0.32, 0.08
            );
            drawNeb(
                W * 0.35 + Math.cos(ang2) * W * 0.12,
                H * 0.6 + Math.sin(ang2 * 0.8) * H * 0.15,
                W * 0.24, 0.055
            );
            drawNeb(
                W * 0.7 + Math.sin(ang3) * W * 0.1,
                H * 0.35 + Math.cos(ang3 * 1.1) * H * 0.1,
                W * 0.20, 0.045
            );

            // ── Connection lines between nearby dots ──
            ctx.lineWidth = 0.5;
            for (let i = 0; i < DOTS; i++) {
                for (let j = i + 1; j < DOTS; j++) {
                    const dx = dots[i].x - dots[j].x;
                    const dy = dots[i].y - dots[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < CONNECTION_DIST) {
                        const lineAlpha = (1 - dist / CONNECTION_DIST) * 0.12;
                        ctx.strokeStyle = `rgba(245,166,35,${lineAlpha})`;
                        ctx.beginPath();
                        ctx.moveTo(dots[i].x, dots[i].y);
                        ctx.lineTo(dots[j].x, dots[j].y);
                        ctx.stroke();
                    }
                }
                // Also connect to mouse if close
                if (mouseX > 0 && mouseY > 0) {
                    const dmx = dots[i].x - mouseX;
                    const dmy = dots[i].y - mouseY;
                    const dMouse = Math.sqrt(dmx * dmx + dmy * dmy);
                    if (dMouse < 180) {
                        const lineAlpha = (1 - dMouse / 180) * 0.2;
                        ctx.strokeStyle = `rgba(245,166,35,${lineAlpha})`;
                        ctx.beginPath();
                        ctx.moveTo(dots[i].x, dots[i].y);
                        ctx.lineTo(mouseX, mouseY);
                        ctx.stroke();
                    }
                }
            }

            // ── Dots ──
            for (const d of dots) {
                // Gentle attraction toward mouse
                if (mouseX > 0 && mouseY > 0) {
                    const dmx = mouseX - d.x;
                    const dmy = mouseY - d.y;
                    const dist = Math.sqrt(dmx * dmx + dmy * dmy);
                    if (dist < 250 && dist > 1) {
                        const force = 0.012 * (1 - dist / 250);
                        d.vx += (dmx / dist) * force;
                        d.vy += (dmy / dist) * force;
                    }
                }
                // Dampen velocity
                d.vx *= 0.998;
                d.vy *= 0.998;

                d.x += d.vx;
                d.y += d.vy;
                if (d.x < 0) d.x = W; if (d.x > W) d.x = 0;
                if (d.y < 0) d.y = H; if (d.y > H) d.y = 0;

                d.alpha += d.alphaSpeed * d.alphaDir;
                if (d.alpha > 0.65) { d.alpha = 0.65; d.alphaDir = -1; }
                if (d.alpha < 0.08) { d.alpha = 0.08; d.alphaDir = 1; }

                ctx.beginPath();
                ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(245,166,35,${d.alpha})`;
                ctx.fill();
            }

            // ── Rising embers ──
            for (const e of embers) {
                e.x += e.vx + Math.sin(e.life * 0.03) * 0.15;
                e.y += e.vy;
                e.life++;
                const progress = e.life / e.maxLife;
                const eAlpha = progress < 0.2
                    ? progress / 0.2
                    : progress > 0.7
                        ? 1 - (progress - 0.7) / 0.3
                        : 1;

                ctx.beginPath();
                ctx.arc(e.x, e.y, e.r * (1 - progress * 0.4), 0, Math.PI * 2);
                ctx.fillStyle = `rgba(245,166,35,${eAlpha * 0.5})`;
                ctx.fill();

                if (e.life >= e.maxLife) {
                    Object.assign(e, spawnEmber());
                }
            }

            raf = requestAnimationFrame(draw);
        };
        draw();

        return () => {
            cancelAnimationFrame(raf);
            clearTimeout(retryId);
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', onMouse);
        };
    }, []);

    const scrollToContent = useCallback(() => {
        const root = heroRef.current?.parentElement;
        if (root) {
            const pinEnd = root.offsetTop + root.offsetHeight;
            window.scrollTo({ top: pinEnd, behavior: 'smooth' });
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

            /* ── Create the single hooked ScrollTrigger for sticky element ── */
            ScrollTrigger.create({
                trigger: hero.parentElement, // Trigger on the hero-root wrapper
                start: 'top top',
                end: 'bottom bottom', // End when the root wrapper finishes scrolling
                scrub: 1,
                animation: scrubTL,
                onLeave: () => {
                    onChangeRef.current?.(true);
                    // Smooth snap to #precios without stopping Lenis —
                    // stopping Lenis causes a deadlock in v1.x because the RAF
                    // loop is halted so onComplete never fires and start() is
                    // never called, permanently locking scroll.
                    const l = (window as any).__lenis;
                    const target = document.getElementById('precios');
                    if (l && target) {
                        l.scrollTo(target, {
                            offset: 0,
                            duration: 1.2,
                            easing: (t: number) => 1 - Math.pow(1 - t, 4),
                        });
                    }
                },
                onEnterBack: () => onChangeRef.current?.(false),
            });

        }, hero);

        return () => { gsapCtx.revert(); };
    }, []);

    /* ── Logo hover interaction (outside gsap.context to avoid conflicts) ── */
    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const logoWrap = logoWrapRef.current;
        const logoEl   = logoRef.current;
        const hexPath  = hexStrokeRef.current;
        if (!logoWrap || !logoEl) return;

        const onLogoEnter = () => {
            gsap.to(logoEl, { scale: 1.08, rotateY: 12, rotateX: -6, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
            gsap.to(logoWrap, { filter: 'drop-shadow(0 0 40px rgba(245,166,35,0.55))', duration: 0.35, ease: 'power2.out', overwrite: 'auto' });
            if (hexPath) {
                const len = hexPath.getTotalLength();
                gsap.fromTo(hexPath,
                    { strokeDashoffset: len },
                    { strokeDashoffset: 0, duration: 0.65, ease: 'power2.out', overwrite: 'auto' }
                );
            }
        };

        const onLogoLeave = () => {
            gsap.to(logoEl, { scale: 1, rotateY: 0, rotateX: 0, duration: 0.55, ease: 'elastic.out(1, 0.45)', overwrite: 'auto' });
            gsap.to(logoWrap, { filter: 'drop-shadow(0 0 0px transparent)', duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
        };

        const onLogoMove = (e: MouseEvent) => {
            const rect = logoWrap.getBoundingClientRect();
            const dx = (e.clientX - rect.left - rect.width  / 2) / (rect.width  / 2);
            const dy = (e.clientY - rect.top  - rect.height / 2) / (rect.height / 2);
            gsap.to(logoEl, { rotateY: dx * 18, rotateX: -dy * 14, duration: 0.25, ease: 'power2.out', overwrite: 'auto' });
        };

        logoWrap.addEventListener('mouseenter', onLogoEnter);
        logoWrap.addEventListener('mouseleave', onLogoLeave);
        logoWrap.addEventListener('mousemove',  onLogoMove);

        return () => {
            logoWrap.removeEventListener('mouseenter', onLogoEnter);
            logoWrap.removeEventListener('mouseleave', onLogoLeave);
            logoWrap.removeEventListener('mousemove',  onLogoMove);
        };
    }, []);

    return (
        <div className="hero-root" style={{ height: '190vh' }}>
            <section
                ref={heroRef}
                className="h-screen sticky top-0 overflow-hidden bg-bg-base flex flex-col items-center justify-center px-6"
            >
                {/* ── Capa -1: Animated canvas background ── */}
                <canvas
                    ref={canvasRef}
                    className="hero-layer absolute inset-0 w-full h-full pointer-events-none"
                    style={{ opacity: 0.9 }}
                />
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
                        className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 mb-6 cursor-pointer interactive"
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
