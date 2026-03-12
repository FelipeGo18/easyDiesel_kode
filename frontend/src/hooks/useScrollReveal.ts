import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ══════════════════════════════════════════════════════
   useScrollReveal — Power Mix Immersive Scroll
   ──────────────────────────────────────────────────────
   • Prices: horizontal scroll pinned + gauge SVG anim
   • Route: fuel drop clip-path wipe + stroke draw
   • Stations: polygon wipe + map zoom + deck stack
   • News: diagonal wipe + character reveal + gradient rotate
   • Footer: zoom reveal + logo reconstruction
   • Transitions: alternating clip-path wipes (C)
   ══════════════════════════════════════════════════════ */

export interface SectionRefs {
    navbar:   React.RefObject<HTMLElement | null>;
    prices:   React.RefObject<HTMLElement | null>;
    route:    React.RefObject<HTMLElement | null>;
    stations: React.RefObject<HTMLElement | null>;
    news:     React.RefObject<HTMLElement | null>;
    cta:      React.RefObject<HTMLElement | null>;
    footer:   React.RefObject<HTMLElement | null>;
}

export function useScrollReveal(refs: SectionRefs, enabled: boolean) {
    const ctx = useRef<gsap.Context | null>(null);
    const initialized = useRef(false);

    useEffect(() => {
        if (!enabled || initialized.current) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        initialized.current = true;

        const raf = requestAnimationFrame(() => {
            ctx.current = gsap.context(() => {

                /* ────────────────────────────────
                   NAVBAR — cinematic slide-in
                   ──────────────────────────────── */
                if (refs.navbar.current) {
                    gsap.set(refs.navbar.current, { y: -100, opacity: 0 });
                    gsap.to(refs.navbar.current, {
                        y: 0, opacity: 1,
                        duration: 0.6,
                        ease: 'power3.out',
                        scrollTrigger: {
                            trigger: refs.prices.current,
                            start: 'top 90%',
                            toggleActions: 'play none none reverse',
                        },
                    });
                }

                /* ────────────────────────────────
                   PRICES — Horizontal scroll pinned
                   Single pin + single gsap.to(x)
                   + gauge arc animation + subsidy bar
                   ──────────────────────────────── */
                if (refs.prices.current) {
                    const pricesInner = refs.prices.current.querySelector<HTMLElement>('.prices-hscroll');
                    if (pricesInner) {
                        const panels = pricesInner.querySelectorAll('.hscroll-panel');
                        if (panels.length > 1) {
                            const getDistance = () => pricesInner.scrollWidth - window.innerWidth;

                            // Single pin + horizontal translate
                            gsap.to(pricesInner, {
                                x: () => -getDistance(),
                                ease: 'none',
                                scrollTrigger: {
                                    trigger: refs.prices.current,
                                    start: 'top top',
                                    end: () => `+=${getDistance()}`,
                                    pin: true,
                                    scrub: 1,
                                    anticipatePin: 1,
                                    invalidateOnRefresh: true,
                                },
                            });

                            // Gauge arc: animate strokeDashoffset based on section scroll
                            const gaugeArc = refs.prices.current.querySelector('.gauge-arc');
                            if (gaugeArc) {
                                gsap.fromTo(gaugeArc,
                                    { strokeDashoffset: 251.3 },
                                    {
                                        strokeDashoffset: 60,
                                        ease: 'power2.out',
                                        scrollTrigger: {
                                            trigger: refs.prices.current,
                                            start: () => `top+=${getDistance() * 0.2} top`,
                                            end: () => `top+=${getDistance() * 0.5} top`,
                                            scrub: 1,
                                        },
                                    }
                                );
                            }

                            // Gauge needle rotation
                            const needle = refs.prices.current.querySelector('.gauge-needle');
                            if (needle) {
                                gsap.fromTo(needle,
                                    { rotation: -90 },
                                    {
                                        rotation: 55,
                                        ease: 'power2.out',
                                        transformOrigin: '100px 100px',
                                        scrollTrigger: {
                                            trigger: refs.prices.current,
                                            start: () => `top+=${getDistance() * 0.2} top`,
                                            end: () => `top+=${getDistance() * 0.5} top`,
                                            scrub: 1,
                                        },
                                    }
                                );
                            }

                            // Subsidy fuel bar fill
                            const subsidyBar = refs.prices.current.querySelector('.fuel-subsidy-bar');
                            if (subsidyBar) {
                                gsap.fromTo(subsidyBar,
                                    { width: '0%' },
                                    {
                                        width: '65%',
                                        ease: 'power2.out',
                                        scrollTrigger: {
                                            trigger: refs.prices.current,
                                            start: () => `top+=${getDistance() * 0.25} top`,
                                            end: () => `top+=${getDistance() * 0.5} top`,
                                            scrub: 1,
                                        },
                                    }
                                );
                            }
                        }
                    }
                }

                /* ────────────────────────────────
                   ROUTE — Fuel drop mask wipe +
                   route stroke draw + feature stagger
                   ──────────────────────────────── */
                if (refs.route.current) {
                    // Clip-path wipe: ellipse expanding from center (fuel drop shape)
                    gsap.fromTo(refs.route.current,
                        { clipPath: 'ellipse(0% 0% at 50% 40%)' },
                        {
                            clipPath: 'ellipse(120% 120% at 50% 40%)',
                            ease: 'power2.out',
                            scrollTrigger: {
                                trigger: refs.route.current,
                                start: 'top 80%',
                                end: 'top 15%',
                                scrub: 0.9,
                            },
                        }
                    );

                    // Route connector line stroke draw
                    const routeConnector = refs.route.current.querySelector('.route-stroke-draw');
                    if (routeConnector) {
                        const len = (routeConnector as SVGGeometryElement).getTotalLength?.() ?? 200;
                        gsap.set(routeConnector, { strokeDasharray: len, strokeDashoffset: len });
                        gsap.to(routeConnector, {
                            strokeDashoffset: 0,
                            ease: 'none',
                            scrollTrigger: {
                                trigger: refs.route.current,
                                start: 'top 50%',
                                end: 'top 5%',
                                scrub: 0.8,
                            },
                        });
                    }

                    // Inner panels — features slide from left with rotateX
                    const routeLeft = refs.route.current.querySelector('.route-left');
                    const routeRight = refs.route.current.querySelector('.route-right');
                    if (routeLeft) {
                        const featureItems = routeLeft.querySelectorAll('.flex.items-start');
                        if (featureItems.length) {
                            gsap.fromTo(featureItems,
                                { x: -50, opacity: 0, rotateX: 10 },
                                {
                                    x: 0, opacity: 1, rotateX: 0,
                                    stagger: 0.12,
                                    ease: 'power3.out',
                                    scrollTrigger: {
                                        trigger: refs.route.current,
                                        start: 'top 50%',
                                        end: 'top 5%',
                                        scrub: 0.7,
                                    },
                                }
                            );
                        }
                    }
                    if (routeRight) {
                        gsap.fromTo(routeRight,
                            { x: 80, opacity: 0, filter: 'blur(12px)' },
                            {
                                x: 0, opacity: 1, filter: 'blur(0px)',
                                ease: 'power2.out',
                                scrollTrigger: {
                                    trigger: refs.route.current,
                                    start: 'top 55%',
                                    end: 'top 10%',
                                    scrub: 0.8,
                                },
                            }
                        );
                    }

                    // Route dots — drop from above with bounce
                    const routeDots = refs.route.current.querySelectorAll('.route-dot');
                    if (routeDots.length) {
                        gsap.fromTo(routeDots,
                            { y: -30, scale: 0, opacity: 0 },
                            {
                                y: 0, scale: 1, opacity: 1,
                                stagger: 0.08,
                                ease: 'bounce.out',
                                scrollTrigger: {
                                    trigger: refs.route.current,
                                    start: 'top 40%',
                                    end: 'top 5%',
                                    scrub: 0.5,
                                },
                            }
                        );
                    }

                    // Ambient glows parallax
                    const glows = refs.route.current.querySelectorAll('.scroll-glow');
                    glows.forEach((glow) => {
                        gsap.to(glow, {
                            yPercent: -40,
                            ease: 'none',
                            scrollTrigger: {
                                trigger: refs.route.current,
                                start: 'top bottom',
                                end: 'bottom top',
                                scrub: true,
                            },
                        });
                    });
                }

                /* ────────────────────────────────
                   STATIONS — Wipe left→right +
                   map zoom + deck stack cards
                   ──────────────────────────────── */
                if (refs.stations.current) {
                    // Section wipe: polygon from left (alternating direction from route)
                    gsap.fromTo(refs.stations.current,
                        { clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)' },
                        {
                            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
                            ease: 'power2.out',
                            scrollTrigger: {
                                trigger: refs.stations.current,
                                start: 'top 85%',
                                end: 'top 30%',
                                scrub: 0.8,
                            },
                        }
                    );

                    // Map zoom from small to full
                    const mapEl = refs.stations.current.querySelector('#stations-map');
                    if (mapEl) {
                        gsap.fromTo(mapEl,
                            { scale: 0.5, opacity: 0, borderRadius: '32px' },
                            {
                                scale: 1, opacity: 1, borderRadius: '4px',
                                ease: 'power2.out',
                                scrollTrigger: {
                                    trigger: refs.stations.current,
                                    start: 'top 60%',
                                    end: 'top 10%',
                                    scrub: 0.8,
                                },
                            }
                        );
                    }

                    // Deck stack cards — each slides from beneath the previous
                    const stationCards = refs.stations.current.querySelectorAll('.scroll-child');
                    if (stationCards.length) {
                        stationCards.forEach((card, i) => {
                            gsap.fromTo(card,
                                {
                                    y: 60 + i * 15,
                                    opacity: 0,
                                    scale: 0.95,
                                    rotateX: 4,
                                },
                                {
                                    y: 0,
                                    opacity: 1,
                                    scale: 1,
                                    rotateX: 0,
                                    ease: 'power3.out',
                                    scrollTrigger: {
                                        trigger: refs.stations.current,
                                        start: `top ${50 - i * 5}%`,
                                        end: `top ${15 - i * 3}%`,
                                        scrub: 0.5 + i * 0.08,
                                    },
                                }
                            );
                        });
                    }
                }

                /* ────────────────────────────────
                   NEWS — Diagonal wipe (right→left) +
                   character reveal + rotating gradient bg
                   ──────────────────────────────── */
                if (refs.news.current) {
                    // Section wipe: diagonal from top-right (alternating from stations)
                    gsap.fromTo(refs.news.current,
                        { clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)' },
                        {
                            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
                            ease: 'power2.out',
                            scrollTrigger: {
                                trigger: refs.news.current,
                                start: 'top 85%',
                                end: 'top 35%',
                                scrub: 0.8,
                            },
                        }
                    );

                    // News cards: character reveal + gradient bg rotation
                    const newsCards = refs.news.current.querySelectorAll('.scroll-child');
                    if (newsCards.length) {
                        newsCards.forEach((card, i) => {
                            // Card container stagger entry
                            gsap.fromTo(card,
                                { y: 50, opacity: 0, rotateY: -6 },
                                {
                                    y: 0, opacity: 1, rotateY: 0,
                                    ease: 'power3.out',
                                    scrollTrigger: {
                                        trigger: refs.news.current,
                                        start: `top ${55 - i * 8}%`,
                                        end: `top ${20 - i * 5}%`,
                                        scrub: 0.6,
                                    },
                                }
                            );

                            // Title character-by-character split reveal
                            const title = card.querySelector('h3');
                            if (title) {
                                const text = title.textContent || '';
                                title.textContent = '';
                                title.setAttribute('aria-label', text);
                                const chars: HTMLSpanElement[] = [];
                                for (const ch of text) {
                                    const span = document.createElement('span');
                                    span.textContent = ch === ' ' ? '\u00A0' : ch;
                                    span.style.display = 'inline-block';
                                    span.style.opacity = '0';
                                    span.style.transform = 'translateY(10px)';
                                    title.appendChild(span);
                                    chars.push(span);
                                }
                                gsap.to(chars, {
                                    opacity: 1, y: 0,
                                    stagger: 0.012,
                                    ease: 'power2.out',
                                    scrollTrigger: {
                                        trigger: card,
                                        start: 'top 78%',
                                        end: 'top 40%',
                                        scrub: 0.5,
                                    },
                                });
                            }

                            // Rotating gradient background on card
                            const htmlCard = card as HTMLElement;
                            gsap.to(htmlCard, {
                                backgroundImage: 'linear-gradient(360deg, rgba(245,166,35,0.02) 0%, transparent 60%)',
                                ease: 'none',
                                scrollTrigger: {
                                    trigger: card,
                                    start: 'top bottom',
                                    end: 'bottom top',
                                    scrub: true,
                                },
                            });
                        });
                    }
                }

                /* ────────────────────────────────
                   CTA BANNER — inset wipe from center
                   ──────────────────────────────── */
                if (refs.cta.current) {
                    gsap.fromTo(refs.cta.current,
                        { clipPath: 'inset(40% 40% 40% 40%)', opacity: 0 },
                        {
                            clipPath: 'inset(0% 0% 0% 0%)', opacity: 1,
                            ease: 'power3.out',
                            scrollTrigger: {
                                trigger: refs.cta.current,
                                start: 'top 90%',
                                end: 'top 50%',
                                scrub: 0.7,
                            },
                        }
                    );
                }

                /* ────────────────────────────────
                   FOOTER — Cinematic zoom reveal +
                   logo reconstruction + credits rise
                   ──────────────────────────────── */
                if (refs.footer.current) {
                    // Zoom from scale(2.5) + blurred → normal
                    gsap.fromTo(refs.footer.current,
                        { scale: 2.5, opacity: 0, filter: 'blur(8px)' },
                        {
                            scale: 1, opacity: 1, filter: 'blur(0px)',
                            ease: 'power3.out',
                            scrollTrigger: {
                                trigger: refs.footer.current,
                                start: 'top 95%',
                                end: 'top 45%',
                                scrub: 0.8,
                            },
                        }
                    );

                    // Logo reconstruction — hex 3D flip in
                    const footerLogo = refs.footer.current.querySelector('.footer-logo');
                    if (footerLogo) {
                        gsap.fromTo(footerLogo,
                            { scale: 0.4, rotateY: 120, opacity: 0 },
                            {
                                scale: 1, rotateY: 0, opacity: 1,
                                ease: 'power3.out',
                                scrollTrigger: {
                                    trigger: refs.footer.current,
                                    start: 'top 85%',
                                    end: 'top 40%',
                                    scrub: 0.7,
                                },
                            }
                        );
                    }

                    // Credits text rises like cinema credits
                    const footerInner = refs.footer.current.querySelector('.footer-credits');
                    if (footerInner) {
                        gsap.fromTo(footerInner,
                            { y: 50, opacity: 0 },
                            {
                                y: 0, opacity: 1,
                                ease: 'power2.out',
                                scrollTrigger: {
                                    trigger: refs.footer.current,
                                    start: 'top 75%',
                                    end: 'top 35%',
                                    scrub: 0.6,
                                },
                            }
                        );
                    }
                }

            }); // end gsap.context
        }); // end rAF

        return () => {
            cancelAnimationFrame(raf);
            ctx.current?.revert();
            ctx.current = null;
            initialized.current = false;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled]);
}
