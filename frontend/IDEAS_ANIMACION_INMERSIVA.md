# 🔥 easyDIESEL — Ideas de Animación Inmersiva

> Inspirado en: **SŌM** (drinksom.eu) · **Elecctro** (elecctro.com) · **Fluid Glass** (fluid.glass) · **Sulax** (sulax.com.tr)  
> Stack: **GSAP 3.14 + ScrollTrigger + Lenis + React + Tailwind v4**

---

## Estado actual vs. Objetivo

| Ahora | Objetivo |
|-------|----------|
| Hero estático con timeline de entrada | Experiencia tipo **SŌM**: cada scroll revela algo nuevo, todo es cinematográfico |
| Secciones aparecen con fade simple | Transiciones **Fluid Glass**: mask wipes, clip-paths, horizontales |
| Sin preloader | **Elecctro**: preloader con progress bar cinematográfico |
| Navbar siempre visible | Navbar que se transforma según la sección activa |
| Cards con hover básico | Cards con tilt 3D, magnetic hover, glow reactivo |

---

## IDEA A — "Cinematic Fuel Scroll" (Estilo SŌM)

### Concepto
Toda la página es una narrativa vertical. Cada sección es una "escena" que se pinta y despinta con el scroll. El usuario siente que está recorriendo una película sobre combustible.

### Fases del scroll

```
[PRELOADER] → [HERO pin] → [TEXTO REVELADO] → [PRECIOS horizontal] → [RUTA immersive] → [MAPA full-bleed] → [NOTICIAS stagger] → [FOOTER cinematic]
```

#### 1. PRELOADER CINEMATOGRÁFICO
- Fondo negro, el hexágono logo se dibuja stroke a stroke (SVG dashoffset)
- Un texto en font mono va contando: `CARGANDO DATOS DE COMBUSTIBLE...`
- Progress bar ámbar ultra-delgado (2px) en la parte inferior
- Al completar: mask circular desde el logo que revela el hero (efecto "iris open")
- **Referencia**: Elecctro preloader + SŌM intro

#### 2. HERO — PIN + PARALLAX MULTICAPA
- **Pinned 200vh** (el hero ocupa 2x la pantalla en scroll)
- Capa 0: Grid pattern se mueve a velocidad 0.1x (parallax profundo)
- Capa 1: Glow ámbar pulsa y crece con el scroll
- Capa 2: Logo rota en 3D (rotateY scrub vinculado al scroll, no timeline)
- Capa 3: Texto "easy" aparece con clip-path desde la izquierda
- Capa 4: "DIESEL" cada letra tiene parallax Y diferente — se "ensamblan" al llegar al centro
- Capa 5: Partículas flotantes con velocidades distintas (parallax profundo)
- **Al salir**: todo hace scale(0.85) y mask circular se cierra — transición tipo "portal"
- **Referencia**: SŌM hero con múltiples capas

#### 3. TEXTO DE TRANSICIÓN — "MARQUEE INFINITO"
- Entre hero y precios: un band horizontal con texto en loop infinito
- Texto: `PRECIOS REGULADOS · DECRETO 1428 · MINMINAS · COLOMBIA 2026 ·`
- Font display 120px, color ámbar/15 (muy sutil)
- Se mueve de derecha a izquierda con `xPercent: -100, repeat: -1`
- El fondo hace un gradient shift de `bg-base` a `bg-surface` durante este scroll
- **Referencia**: SŌM marquee horizontal repetido

#### 4. PRECIOS — HORIZONTAL SCROLL DENTRO DE VERTICAL
- La sección de precios está **pinned** y hace scroll **horizontal**
- Panel 1: Zona selector (slide desde la izquierda)
- Panel 2: El precio KPI gigante (scale 0.3 → 1 con scrub) con glow detrás
- Panel 3: Cards de subsidio/decreto/servicio (stagger horizontal)
- Panel 4: Comparación ACPM vs Gasolina (las dos cards flotan y se comparan side by side)
- Connector visual: una línea ámbar con puntos recorre los paneles horizontalmente
- **Referencia**: Fluid Glass horizontal layout + Elecctro interactive scroll

#### 5. RUTA — MASK WIPE REVEAL
- Al llegar a esta sección: un mask SVG con forma de gota de combustible se abre desde el centro
- Dentro del mask: el mapa preview con la ruta dibujante (stroke dashoffset animado con scrub)
- El mapa empieza blur(20px) y se aclara progresivamente → blur(0)
- Los puntos de estación "gotean" (caen desde arriba con bounce physics)
- Left panel features hacen un stagger con rotateX (como cartas de poker que se giran)
- **Referencia**: Fluid Glass mask wipe + Sulax interactive map

#### 6. ESTACIONES — SCROLL-DRIVEN MAP ZOOM
- El mapa arranca muy alejado (scale 0.5) y con el scroll hace zoom hasta la ubicación del usuario
- Los station pins "aterrizan" con un efecto de bouncing (drop animation escalonado)
- Las cards de estaciones se revelan con un efecto de **deck stack** — cada card se desliza desde abajo de la anterior como una baraja
- Al hover sobre una card, el pin correspondiente en el mapa pulsa
- **Referencia**: Sulax interactive map + pin animations

#### 7. NOTICIAS — TEXT REVEAL CHARACTER BY CHARACTER
- Cada título de noticia se revela **carácter por carácter** con el scroll (usando SplitText o split manual)
- Las cards tienen un fondo animado con gradient que rota 360° lentamente
- Al hacer scroll out, las cards se "barajan" (salen rotadas y staggered)
- **Referencia**: SŌM text reveal por línea

#### 8. FOOTER — CINEMATIC CLOSE
- El footer hace zoom-in desde scale(3) a scale(1) revelando el contenido
- El logo central se reconstruye pieza por pieza (el hexágono, la gota, el texto)
- Texto final tipo créditos de película (sube como créditos de cine)
- **Referencia**: Elecctro footer animation

---

## IDEA B — "Brutalist Data Dashboard" (Estilo Elecctro)

### Concepto
La página se siente como un dashboard de control de una refinería. Todo es data-driven, con counters, medidores y visualizaciones que se animan con el scroll. Estética brutal pero elegante.

### Elementos clave

#### 1. Preloader tipo "sistema arrancando"
```
[INITIALIZING]
[LOADING FUEL DATA]     ████████████░░ 78%
[CONNECTING TO MINMINAS] ██████████████ 100%
[SYSTEM READY]
```
- Cada línea aparece en secuencia con efecto de terminal/typewriter
- Los caracteres ████ se llenan progresivamente
- Al final: glitch effect + fade to hero

#### 2. HUD Overlay global
- Un overlay semi-transparente con datos en las esquinas (estilo videojuego)
- Esquina superior-izq: coordenadas del usuario (lat/lon)
- Esquina superior-der: precio actual del ACPM como ticker cambiante
- Esquina inferior-izq: zona actual detectada
- Esquina inferior-der: scroll progress indicator circular
- Todos estos datos hacen **counter animation** al cambiar

#### 3. Precios con METER GAUGE
- En vez de solo un número grande, el precio se muestra como un **medidor circular SVG**
- La aguja rota de 0 a $X,XXX con easing elastic
- Debajo: una barra horizontal tipo "fuel gauge" que muestra el subsidio
- Los filtros no son botones normales — son **dials rotativos** (como perillas de radio)

#### 4. Scroll progress como "tubo de combustible"
- En el lateral derecho, una barra vertical tipo tubo de vidrio
- Conforme scrolleas, un líquido ámbar sube por el tubo
- Burbujas animadas dentro del líquido (CSS + GSAP)
- Cada sección tiene un marcador/notch en el tubo

---

## IDEA C — "Fluid Immersion" (Estilo Fluid Glass)

### Concepto
Todo se siente líquido, como combustible fluyendo. Transiciones de mask SVG entre secciones, text clips con video de fondo, y blur/glass transitions.

### Elementos clave

#### 1. Video-text hero
- El texto "DIESEL" es un clip-mask sobre un video background (combustible fluyendo, degradados ámbar)
- Solo se ve el video A TRAVÉS de las letras — el resto es negro
- Con el scroll, el mask se expande y el video se revela full screen momentáneamente → luego se contrae al siguiente section

#### 2. Glassmorphism dinámico
- Cada card/panel tiene un `backdrop-filter: blur()` que varía con la distancia al centro del viewport
- Más cerca del centro = más blur de fondo = más "cristal"
- Se controla con ScrollTrigger scrub

#### 3. Section wipes
- Cada transición de sección es un **wipe** (no un fade)
- Dirección alterna: izq→der, arriba→abajo, circular, diagonal
- Implementado con `clipPath` animado en GSAP
- Ejemplo: `clipPath: 'polygon(0 0, X% 0, X% 100%, 0 100%)'` donde X va de 0 a 100 con scrub

#### 4. Cursor trail / glow follow
- El cursor deja un trail ámbar suave (8-10 puntos que siguen con delay)
- Sobre cards interactivas: el cursor se convierte en un blob ámbar expandido
- **Solo en desktop** (detectar `pointer: fine`)

---

## MI RECOMENDACIÓN: Mezcla "Power Mix"

Combinar los mejores elementos de las 3 ideas para algo único:

| Componente | Técnica | De cuál idea |
|-----------|---------|--------------|
| **Preloader** | Terminal typewriter + iris open | B + A |
| **Hero** | Pin multicapa + letras parallax + mask portal exit | A |
| **Marquee** | Texto infinito horizontal entre secciones | A |
| **Precios** | Horizontal scroll pinned con gauge SVG | A + B |
| **Ruta** | Mask wipe gota + ruta stroke dibujante | A |
| **Estaciones** | Map zoom + deck stack cards | A |
| **Noticias** | Character reveal + gradient bg rotativo | A |
| **Footer** | Zoom reveal + logo reconstrucción | A |
| **Global** | Fuel tube scroll indicator + cursor glow | B + C |
| **Transiciones** | Clip-path wipes alternando dirección | C |

---

## Prioridad de implementación

1. **🔴 Preloader** — primera impresión, fácil ganar wow
2. **🔴 Hero multilayer pin** — ya existe base, mejorar a multicapa
3. **🟡 Clip-path wipes** entre secciones — máximo impacto visual
4. **🟡 Horizontal scroll precios** — lo más "raro" y diferenciador
5. **🟡 Marquee infinito** — sutil pero premium
6. **🟢 Ruta mask wipe** — complementa el feature section
7. **🟢 Map zoom + deck cards** — mejora estaciones
8. **🟢 Scroll fuel tube** — detalle global
9. **🟢 Character text reveal** — noticias
10. **🟢 Footer cinematográfico** — cierre memorable

---

## Notas técnicas

- **GSAP ScrollTrigger** maneja todo el scrub. No CSS scroll-driven animations (no hay soporte universal)
- **Lenis** ya integrado; todos los scrub son smooth por defecto
- **`will-change: transform, opacity`** en todo lo animado; `will-change: auto` después del trigger
- **Horizontal scroll**: usar `pin: true` + animar `x` del contenedor wrapper
- **Mask wipes**: `clipPath` con `polygon()` o `circle()` animado con `gsap.to`
- **Text split**: usar `.split('')` manual en React (ya hecho con "DIESEL"), extender a más textos
- **Preloader**: overlay absoluto con z-50 encima de todo, se remueve del DOM al completar
- **Reducted motion**: SIEMPRE respetar `prefers-reduced-motion` — todo se salta y muestra contenido directo

---

*¿Cuántas de estas ideas quieres implementar? Dime cuáles te convencen y arrancamos.*
