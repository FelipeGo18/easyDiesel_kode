import { useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

/* ═══════════════════════════════════════════════════
   Configurable animation speed / behavior
   Adjust these values to tune the scroll experience.
   ═══════════════════════════════════════════════════ */
const CONFIG = {
  /** Total scroll distance for the hero pin (% of viewport height) */
  scrollDistance: '170%',
  /** ScrollTrigger scrub smoothing in seconds (lower = snappier) */
  scrub: 1,
  /** Lenis smooth-scroll duration */
  lenisDuration: 1.2,
};

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface HeroSectionProps {
  onIntroStateChange?: (completed: boolean) => void;
  startAtEnd?: boolean;
}

export function HeroSection({ onIntroStateChange, startAtEnd }: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const hexStrokeRef = useRef<SVGPathElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const introCompletedRef = useRef(false);

  /* ── Scroll to #precios (uses Lenis when available, native fallback) ── */
  const scrollToPrecios = useCallback(() => {
    const target = document.getElementById('precios');
    if (!target) return;
    lenisRef.current
      ? lenisRef.current.scrollTo(target, { offset: -80 })
      : target.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    if (!section || !content) return;

    const updateIntroState = (completed: boolean) => {
      if (introCompletedRef.current === completed) {
        return;
      }

      introCompletedRef.current = completed;
      onIntroStateChange?.(completed);
    };

    /* ── Reduced-motion fallback: show everything, skip pin ── */
    if (prefersReducedMotion()) {
      updateIntroState(true);
      section
        .querySelectorAll<HTMLElement>('[class*="hero-"]')
        .forEach((el) => {
          el.style.opacity = '1';
          el.style.transform = 'none';
        });
      return;
    }

    /* ═══ Lenis smooth scroll ═══ */
    const lenis = new Lenis({
      duration: CONFIG.lenisDuration,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    lenis.on('scroll', ScrollTrigger.update);
    const rafCb = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(rafCb);
    gsap.ticker.lagSmoothing(0);

    /* ═══ GSAP Context for proper React cleanup ═══ */
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(section);

      /* ═══ SVG stroke-draw prep ═══ */
      const hexStroke = hexStrokeRef.current;

      /* ═══ Everything starts VISIBLE — no black screen ═══ */
      gsap.set(q('.hero-grid'), { opacity: 1 });
      gsap.set(q('.hero-glow'), { opacity: 1, scale: 1, force3D: true });
      gsap.set(q('.hero-hex-fill'), { opacity: 1, force3D: true });
      gsap.set(q('.hero-tick'), { scaleX: 1, transformOrigin: 'center', force3D: true });
      gsap.set(q('.hero-drop'), { opacity: 1, force3D: true });
      gsap.set(q('.hero-text-easy'), { opacity: 1, force3D: true });
      gsap.set(q('.hero-text-diesel'), { opacity: 1, force3D: true });
      gsap.set(q('.hero-tagline'), { opacity: 1, force3D: true });
      gsap.set(q('.hero-cta'), { opacity: 1, force3D: true });
      gsap.set(q('.hero-particle'), { opacity: 0.35, scale: 1, force3D: true });
      gsap.set(q('.hero-line-deco'), { scaleY: 1, transformOrigin: 'top', force3D: true });
      gsap.set(q('.hero-sep'), { scaleX: 1, transformOrigin: 'center', force3D: true });
      if (hexStroke) {
        gsap.set(hexStroke, { strokeDasharray: 'none', strokeDashoffset: 0 });
      }

      /* ═══ Entrance tween — plays once on mount (no scroll needed) ═══ */
      const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });

      /* subtle pulse: glow breathes in */
      intro.from(q('.hero-glow'), { scale: 0.7, opacity: 0, duration: 1.2 }, 0);
      intro.from(q('.hero-grid'), { opacity: 0, duration: 0.8 }, 0);
      /* logo assembles */
      intro.from(q('.hero-hex-fill'), { opacity: 0, scale: 0.5, duration: 0.9, ease: 'back.out(1.4)' }, 0.15);
      if (hexStroke) {
        const len = hexStroke.getTotalLength();
        gsap.set(hexStroke, { strokeDasharray: len, strokeDashoffset: len });
        intro.to(hexStroke, { strokeDashoffset: 0, duration: 1.0, ease: 'power2.inOut' }, 0.2);
      }
      intro.from(q('.hero-tick'), { scaleX: 0, stagger: 0.06, duration: 0.4, ease: 'back.out(3)' }, 0.5);
      intro.from(q('.hero-drop'), { opacity: 0, y: -40, scale: 0.3, duration: 0.8, ease: 'back.out(1.7)' }, 0.55);
      /* brand text flies in */
      intro.from(q('.hero-text-easy'), { opacity: 0, y: 20, letterSpacing: '0.5em', duration: 0.7 }, 0.7);
      intro.from(q('.hero-text-diesel'), { opacity: 0, scale: 1.6, y: 30, duration: 0.8, ease: 'expo.out' }, 0.8);
      /* tagline and rest */
      intro.from(q('.hero-tagline'), { opacity: 0, y: 30, duration: 0.6 }, 1.1);
      intro.from(q('.hero-cta'), { opacity: 0, y: 20, duration: 0.5 }, 1.3);
      intro.from(q('.hero-particle'), { opacity: 0, scale: 0, stagger: 0.04, duration: 0.5 }, 0.9);
      intro.from(q('.hero-line-deco'), { scaleY: 0, stagger: 0.08, duration: 0.6 }, 1.0);
      intro.from(q('.hero-sep'), { scaleX: 0, duration: 0.5 }, 1.3);
      /* ambient scan line sweeps once */
      intro.fromTo(q('.hero-scan'), { y: '-10vh' }, { y: '110vh', duration: 2.0, ease: 'none' }, 0);

      /* ═══ Scroll-scrubbed EXIT timeline ═══ */
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: `+=${CONFIG.scrollDistance}`,
          pin: true,
          scrub: CONFIG.scrub,
          anticipatePin: 1,
          onUpdate: (self) => {
            if (self.progress >= 0.999) updateIntroState(true);
          },
          onLeave: () => updateIntroState(true),
        },
      });

      /* Phase 1 — particles & decorations fly out first (0.00 → 0.25) */
      tl.to(q('.hero-particle'), {
        opacity: 0, scale: 2.5, stagger: 0.01, duration: 0.20, ease: 'power2.in',
      }, 0);
      tl.to(q('.hero-line-deco'), {
        scaleY: 0, opacity: 0, stagger: 0.02, duration: 0.15, transformOrigin: 'bottom',
      }, 0.05);
      tl.to(q('.hero-sep'), { scaleX: 0, opacity: 0, duration: 0.10 }, 0.05);

      /* Phase 2 — CTA + tagline slide down & fade (0.10 → 0.35) */
      tl.to(q('.hero-cta'), { opacity: 0, y: 50, duration: 0.15, ease: 'power2.in' }, 0.10);
      tl.to(q('.hero-tagline'), { opacity: 0, y: 40, duration: 0.15, ease: 'power2.in' }, 0.15);

      /* Phase 3 — brand text spectacularly splits (0.25 → 0.50) */
      tl.to(q('.hero-text-easy'), {
        opacity: 0, x: -80, letterSpacing: '0.4em', duration: 0.20, ease: 'power3.in',
      }, 0.25);
      tl.to(q('.hero-text-diesel'), {
        opacity: 0, scale: 2.2, y: -20, duration: 0.22, ease: 'power3.in',
      }, 0.28);

      /* Phase 4 — logo disassembles (0.40 → 0.65) */
      tl.to(q('.hero-drop'), {
        opacity: 0, y: -60, scale: 0.2, duration: 0.18, ease: 'power2.in',
      }, 0.40);
      tl.to(q('.hero-tick'), {
        scaleX: 0, stagger: 0.01, duration: 0.10, ease: 'power2.in',
      }, 0.42);
      if (hexStroke) {
        const len = hexStroke.getTotalLength();
        tl.to(hexStroke, { strokeDashoffset: len, duration: 0.20, ease: 'power2.inOut' }, 0.45);
      }
      tl.to(q('.hero-hex-fill'), { opacity: 0, scale: 0.6, duration: 0.15 }, 0.55);

      /* Phase 5 — ambient fade out (0.60 → 0.80) */
      tl.to(q('.hero-glow'), {
        opacity: 0, scale: 1.6, duration: 0.20, ease: 'power1.in',
      }, 0.60);
      tl.to(q('.hero-grid'), { opacity: 0, duration: 0.15 }, 0.65);

      /* Phase 6 — final content scale-away (0.80 → 1.00) */
      tl.to(content, {
        scale: 0.88, opacity: 0, duration: 0.20, ease: 'power2.in',
      }, 0.80);

      /* ── If returning from below, jump instantly to the end ── */
      if (startAtEnd && tl.scrollTrigger) {
        gsap.delayedCall(0.05, () => {
          if (tl.scrollTrigger) {
            const endPos = tl.scrollTrigger.end - 5;
            window.scrollTo({ top: endPos, left: 0, behavior: 'instant' });
          }
        });
      }

    }, section);

    /* ═══ Cleanup ═══ */
    return () => {
      lenis.destroy();
      lenisRef.current = null;
      gsap.ticker.remove(rafCb);
      ctx.revert();
    };
  }, [onIntroStateChange]);

  return (
    <div className="hero-unmount-wrapper">
      <section
        ref={sectionRef}
        className="h-screen relative overflow-hidden bg-bg-base"
        style={{ zIndex: 0 }}
      >
        {/* ── Background grid (masked radial) ── */}
        <div
          className="hero-grid absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(245,166,35,0.03) 1px, transparent 1px),' +
              'linear-gradient(90deg, rgba(245,166,35,0.03) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            mask: 'radial-gradient(ellipse at center, black 20%, transparent 65%)',
            WebkitMask: 'radial-gradient(ellipse at center, black 20%, transparent 65%)',
          }}
        />

        {/* ── Radial amber glow ── */}
        <div
          className="hero-glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] md:w-[700px] md:h-[700px] rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(245,166,35,0.07) 0%, rgba(245,166,35,0.02) 45%, transparent 70%)',
            willChange: 'transform, opacity',
          }}
        />

        {/* ── Scan line (sweeps top → bottom) ── */}
        <div
          className="hero-scan absolute left-0 right-0 h-px pointer-events-none"
          style={{
            top: 0,
            background:
              'linear-gradient(90deg, transparent 5%, rgba(245,166,35,0.3) 30%, rgba(245,166,35,0.5) 50%, rgba(245,166,35,0.3) 70%, transparent 95%)',
            willChange: 'transform',
          }}
        />

        {/* ── Content container ── */}
        <div
          ref={contentRef}
          className="relative z-10 h-full flex flex-col items-center justify-center px-6"
          style={{ willChange: 'transform, opacity' }}
        >
          {/* ── Logo SVG ── */}
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 mb-6 md:mb-8">
            <svg
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
              aria-label="easyDiesel logo"
            >
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

              {/* Hex fill */}
              <path
                className="hero-hex-fill"
                d="M50 5 L91 27.5 L91 72.5 L50 95 L9 72.5 L9 27.5 Z"
                fill="url(#hero-hbg)"
              />

              {/* Hex stroke (draw-on animation) */}
              <path
                ref={hexStrokeRef}
                d="M50 5 L91 27.5 L91 72.5 L50 95 L9 72.5 L9 27.5 Z"
                stroke="#F5A623"
                strokeWidth="2.2"
                fill="none"
                strokeLinejoin="miter"
              />

              {/* Gauge ticks */}
              <line className="hero-tick" x1="9" y1="44" x2="22" y2="44" stroke="#F5A623" strokeWidth="1.8" strokeLinecap="round" opacity="0.65" />
              <line className="hero-tick" x1="9" y1="58" x2="22" y2="58" stroke="#F5A623" strokeWidth="1.8" strokeLinecap="round" opacity="0.65" />
              <line className="hero-tick" x1="91" y1="44" x2="78" y2="44" stroke="#F5A623" strokeWidth="1.8" strokeLinecap="round" opacity="0.65" />
              <line className="hero-tick" x1="91" y1="58" x2="78" y2="58" stroke="#F5A623" strokeWidth="1.8" strokeLinecap="round" opacity="0.65" />

              {/* Fuel drop */}
              <path
                className="hero-drop"
                d="M50 21 C50 21 34 43 34 57 C34 67.5 41.3 76 50 76 C58.7 76 66 67.5 66 57 C66 43 50 21 50 21 Z"
                fill="url(#hero-dg)"
              />
              {/* Drop highlight */}
              <path
                className="hero-drop"
                d="M44 38 C42.5 44 42 50 43 56"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
                opacity="0.28"
              />
            </svg>
          </div>

          {/* ── Brand text ── */}
          <div className="text-center mb-3 md:mb-5">
            <span className="hero-text-easy block text-text-secondary text-[16px] sm:text-[18px] md:text-[22px] font-sans font-light tracking-[0.15em] leading-none mb-1">
              easy
            </span>
            <span className="hero-text-diesel block text-amber-500 font-display text-[48px] sm:text-[64px] md:text-[80px] lg:text-[96px] leading-none tracking-[0.08em]">
              DIESEL
            </span>
          </div>

          {/* ── Tagline ── */}
          <p className="hero-tagline text-center text-text-secondary text-[13px] sm:text-[14px] md:text-[16px] font-sans font-light max-w-sm md:max-w-md leading-relaxed mb-6 md:mb-8">
            Precios regulados de combustible en Colombia.
            <br className="hidden sm:block" />
            {' '}Consulta, compara y encuentra tu estación.
          </p>

          {/* ── CTA ── */}
          <button
            onClick={scrollToPrecios}
            className="hero-cta group inline-flex flex-col items-center gap-2 text-amber-500 hover:text-amber-600 transition-colors cursor-pointer"
            aria-label="Ir a consulta de precios"
          >
            <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.2em]">
              Explorar precios
            </span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="animate-bounce">
              <path
                d="M10 3L10 17M4 11L10 17L16 11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* ── Decorative particles (amber dots) ── */}
          <div className="hero-particle absolute top-[16%] left-[20%] w-1.5 h-2.5 rounded-full bg-amber-500/30 blur-[0.5px]" />
          <div className="hero-particle absolute top-[28%] right-[16%] w-1 h-1.5 rounded-full bg-amber-500/25" />
          <div className="hero-particle absolute bottom-[26%] left-[14%] w-2 h-3 rounded-full bg-amber-500/15 blur-[1px]" />
          <div className="hero-particle absolute top-[20%] right-[30%] w-1 h-1 rounded-full bg-amber-500/20" />
          <div className="hero-particle absolute bottom-[22%] right-[20%] w-1.5 h-2 rounded-full bg-amber-500/20 blur-[0.5px]" />
          <div className="hero-particle absolute top-[50%] left-[7%] w-1 h-1 rounded-full bg-amber-500/15" />
          <div className="hero-particle absolute bottom-[38%] right-[8%] w-1 h-1.5 rounded-full bg-amber-500/[0.18]" />
          <div className="hero-particle absolute top-[65%] left-[28%] w-0.5 h-0.5 rounded-full bg-amber-500/20" />

          {/* ── Mini-hexagons (molecular/industrial motif) ── */}
          <svg className="hero-particle absolute top-[12%] left-[18%] w-6 h-6 md:w-8 md:h-8 pointer-events-none" viewBox="0 0 30 30" fill="none">
            <path d="M15 2L27 8.5L27 21.5L15 28L3 21.5L3 8.5Z" stroke="rgba(245,166,35,0.15)" strokeWidth="0.5" />
          </svg>
          <svg className="hero-particle absolute bottom-[15%] right-[22%] w-5 h-5 pointer-events-none" viewBox="0 0 30 30" fill="none">
            <path d="M15 2L27 8.5L27 21.5L15 28L3 21.5L3 8.5Z" stroke="rgba(245,166,35,0.12)" strokeWidth="0.5" />
          </svg>
          <svg className="hero-particle absolute top-[35%] right-[10%] w-4 h-4 pointer-events-none" viewBox="0 0 30 30" fill="none">
            <path d="M15 2L27 8.5L27 21.5L15 28L3 21.5L3 8.5Z" stroke="rgba(245,166,35,0.10)" strokeWidth="0.5" />
          </svg>

          {/* ── Vertical accent lines (desktop only) ── */}
          <div className="hero-line-deco absolute left-[13%] top-[16%] w-px h-20 bg-gradient-to-b from-transparent via-amber-500/15 to-transparent hidden md:block" />
          <div className="hero-line-deco absolute right-[13%] top-[20%] w-px h-28 bg-gradient-to-b from-transparent via-amber-500/10 to-transparent hidden md:block" />
          <div className="hero-line-deco absolute left-[7%] bottom-[22%] w-px h-16 bg-gradient-to-b from-transparent via-amber-500/8 to-transparent hidden lg:block" />
          <div className="hero-line-deco absolute right-[7%] bottom-[28%] w-px h-24 bg-gradient-to-b from-transparent via-amber-500/10 to-transparent hidden lg:block" />

          {/* ── Bottom separator hint ── */}
          <div className="hero-sep absolute bottom-8 left-1/2 -translate-x-1/2 w-12 h-px bg-amber-500/20" />
        </div>
      </section>
    </div>
  );
}
