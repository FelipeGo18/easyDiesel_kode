import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/useAuth';
import { publicoService } from '@/services/publico';
import type { PublicZona, PublicPrecio } from '@/services/publico';

import { Preloader } from '@/components/Preloader';
import { CursorGlow } from '@/components/CursorGlow';
import { FuelTube } from '@/components/FuelTube';
import { HeroSection } from '@/components/HeroSection';
import { Marquee } from '@/components/Marquee';

import { HomeNavbar } from '@/components/home/HomeNavbar';
import { HomePrices } from '@/components/home/HomePrices';
import { HomeRouteInfo } from '@/components/home/HomeRouteInfo';
import { HomeStations } from '@/components/home/HomeStations';
import { HomeNews } from '@/components/home/HomeNews';
import { HomeCTA } from '@/components/home/HomeCTA';
import { HomeFooter } from '@/components/home/HomeFooter';

import { useScrollReveal } from '@/hooks/useScrollReveal';

export function HomePage() {
    const { isAuthenticated } = useAuth();
    
    // Global data states
    const [zonas, setZonas] = useState<PublicZona[]>([]);
    const [precios, setPrecios] = useState<PublicPrecio[]>([]);
    
    // Viewer states
    const [zonaSeleccionada, setZonaSeleccionada] = useState<string>('');
    const [combustibleSeleccionado, setCombustibleSeleccionado] = useState<string>('ACPM');
    const [servicioSeleccionado, setServicioSeleccionado] = useState<string>('PARTICULAR');
    
    const [loadingPublicData, setLoadingPublicData] = useState(true);
    const [publicDataError, setPublicDataError] = useState<string | null>(null);

    const [preloaderDone, setPreloaderDone] = useState(false);

    // GSAP ScrollReveal refs
    const navRef = useRef<HTMLElement>(null);
    const pricesRef = useRef<HTMLElement>(null);
    const routeRef = useRef<HTMLElement>(null);
    const stationsRef = useRef<HTMLElement>(null);
    const newsRef = useRef<HTMLElement>(null);
    const ctaRef = useRef<HTMLElement>(null);
    const footerRef = useRef<HTMLElement>(null);

    useScrollReveal({
        navbar: navRef,
        prices: pricesRef,
        route: routeRef,
        stations: stationsRef,
        news: newsRef,
        cta: ctaRef,
        footer: footerRef
    }, preloaderDone);

    // Fetch initial data
    useEffect(() => {
        const loadDatosPublicos = async () => {
            try {
                setLoadingPublicData(true);
                const [zonasData, preciosData] = await Promise.all([
                    publicoService.getZonas(),
                    publicoService.getPrecios()
                ]);
                setZonas(zonasData);
                setPrecios(preciosData);

                // Autoselect Cundinamarca/Bogotá if possible
                if (zonasData.length > 0) {
                    const cundinamarca = zonasData.find((z: PublicZona) => z.nombre.toLowerCase().includes('cundinamarca') || z.nombre.toLowerCase().includes('bogot'));
                    setZonaSeleccionada(cundinamarca ? cundinamarca.id : zonasData[0].id);
                }
            } catch (err: any) {
                console.error("Error loading public data:", err);
                setPublicDataError('No pudimos cargar la información de precios oficiales. Por favor intenta más tarde.');
            } finally {
                setLoadingPublicData(false);
            }
        };

        loadDatosPublicos();
    }, []);

    return (
        <div className="min-h-screen bg-bg-base text-text-primary selection:bg-amber-500/30 font-sans overflow-x-hidden">
            <Preloader onComplete={() => setPreloaderDone(true)} />
            <CursorGlow />
            <FuelTube />

            <HomeNavbar ref={navRef} />

            <main className="relative">
                <HeroSection />

                {/* Separator / Marquee area - Negative margin to overlap with Hero sticky exit */}
                <div className="relative z-20 w-full bg-bg-base border-y border-border-subtle flex flex-col justify-center overflow-hidden -mt-[20vh]">
                    <div className="absolute inset-0 bg-linear-to-r from-bg-base via-transparent to-bg-base z-10 w-full pointer-events-none" />
                    <Marquee />
                </div>

                <HomePrices 
                    ref={pricesRef}
                    zonas={zonas}
                    zonaSeleccionada={zonaSeleccionada}
                    setZonaSeleccionada={setZonaSeleccionada}
                    combustibleSeleccionado={combustibleSeleccionado}
                    setCombustibleSeleccionado={setCombustibleSeleccionado}
                    servicioSeleccionado={servicioSeleccionado}
                    setServicioSeleccionado={setServicioSeleccionado}
                    precios={precios}
                    publicDataError={publicDataError}
                    loadingPublicData={loadingPublicData}
                />

                <HomeRouteInfo ref={routeRef} />

                <HomeStations 
                    ref={stationsRef}
                    precios={precios}
                    combustibleSeleccionado={combustibleSeleccionado}
                    servicioSeleccionado={servicioSeleccionado}
                />

                <HomeNews ref={newsRef} />

                <HomeCTA 
                    ref={ctaRef} 
                    isAuthenticated={isAuthenticated} 
                />
            </main>

            <HomeFooter ref={footerRef} />
        </div>
    );
}
