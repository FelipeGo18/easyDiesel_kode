# easyDiesel — Brand Identity

> Dirección visual: **Industrial Precision**
> Plataforma de gestión de combustibles · Colombia · 2026

---

## Logotipo

El logo combina un **isotipo hexagonal** con el **wordmark** en dos pesos tipográficos distintos que crean tensión entre accesibilidad ("easy") e industria ("DIESEL").

### Construcción del isotipo

```
┌─────────────────────────────────────┐
│                                     │
│         ╱‾‾‾‾‾‾‾‾‾╲               │
│        ╱             ╲             │
│       │   ▼ (gota)    │            │
│       │    ●          │            │
│       │   ╱│╲         │            │
│        ╲             ╱             │
│         ╲___________╱              │
│                                     │
│   Hexágono + gota de combustible    │
│   Stroke: #F5A623 / Fill: #1a0e00  │
└─────────────────────────────────────┘
```

- **Forma base:** Hexágono — evoca estructura molecular, tuercas industriales, precisión técnica
- **Símbolo interior:** Gota de combustible centrada con highlight de transparencia
- **Ticks laterales:** Dos marcas horizontales que evocan escala de medición / gauge analógico
- **Filosofía:** El hexágono contiene y protege. La gota es el producto. Juntos: control del combustible.

### Variantes del logotipo

| Variante | Uso |
|----------|-----|
| **Horizontal completo** — isotipo + wordmark | Navbar, headers, documentos |
| **Isotipo solo** — hexágono + gota | Favicon, app icon, loading screen |
| **Wordmark solo** — sin isotipo | Firmas de correo, pie de página |
| **Negativo** — sobre fondo claro | Impresión, documentos oficiales |

### Zona de protección

La zona de protección mínima alrededor del logo equivale a la altura de la letra **D** del wordmark en todos los lados. No colocar ningún elemento dentro de esta zona.

---

## Paleta de Colores

### Primarios

| Token | Hex | RGB | Uso |
|-------|-----|-----|-----|
| `--amber-500` | `#F5A623` | 245 · 166 · 35 | Acento principal, CTAs, links activos, highlights |
| `--amber-600` | `#D4891A` | 212 · 137 · 26 | Hover states, botones presionados |
| `--amber-dim` | `#2a1a00` | 42 · 26 · 0 | Fondos de badges, backgrounds de acento |

### Neutros (base oscura)

| Token | Hex | RGB | Uso |
|-------|-----|-----|-----|
| `--bg-base` | `#080808` | 8 · 8 · 8 | Fondo principal de la app |
| `--bg-surface` | `#0f0f0f` | 15 · 15 · 15 | Cards, panels, sidebar |
| `--bg-elevated` | `#161616` | 22 · 22 · 22 | Dropdowns, modals, tooltips |
| `--bg-hover` | `#1d1d1d` | 29 · 29 · 29 | Estados hover de filas y elementos |

### Bordes

| Token | Hex | Uso |
|-------|-----|-----|
| `--border-subtle` | `#1a1a1a` | Bordes de cards y separadores suaves |
| `--border-default` | `#222222` | Bordes estándar de inputs y panels |
| `--border-strong` | `#2a2a2a` | Bordes de elementos con foco |

### Texto

| Token | Hex | Uso |
|-------|-----|-----|
| `--text-primary` | `#E8E8E8` | Títulos, valores importantes, texto principal |
| `--text-secondary` | `#888888` | Descripciones, labels, metadata |
| `--text-muted` | `#444444` | Placeholders, texto deshabilitado |
| `--text-inverted` | `#080808` | Texto sobre fondo ámbar |

### Semánticos (estados del sistema)

| Token | Hex | Uso |
|-------|-----|-----|
| `--green-500` | `#2ECC71` | Confirmado, activo, nivel OK |
| `--green-dim` | `#0a2a15` | Fondo de badge verde |
| `--red-500` | `#E74C3C` | Error, alerta crítica, nivel bajo |
| `--red-dim` | `#2a0a08` | Fondo de badge rojo |
| `--yellow-500` | `#F1C40F` | Advertencia, pendiente, nivel medio |
| `--yellow-dim` | `#2a2200` | Fondo de badge amarillo |
| `--blue-500` | `#3498DB` | Información, entrada de combustible |
| `--blue-dim` | `#0a1a2a` | Fondo de badge azul |

### Variables CSS completas

```css
:root {
  /* Acento principal */
  --amber-500:   #F5A623;
  --amber-600:   #D4891A;
  --amber-dim:   #2a1a00;

  /* Fondos */
  --bg-base:     #080808;
  --bg-surface:  #0f0f0f;
  --bg-elevated: #161616;
  --bg-hover:    #1d1d1d;

  /* Bordes */
  --border-subtle:  #1a1a1a;
  --border-default: #222222;
  --border-strong:  #2a2a2a;

  /* Texto */
  --text-primary:   #E8E8E8;
  --text-secondary: #888888;
  --text-muted:     #444444;
  --text-inverted:  #080808;

  /* Semánticos */
  --green-500:   #2ECC71;
  --green-dim:   #0a2a15;
  --red-500:     #E74C3C;
  --red-dim:     #2a0a08;
  --yellow-500:  #F1C40F;
  --yellow-dim:  #2a2200;
  --blue-500:    #3498DB;
  --blue-dim:    #0a1a2a;
}
```

---

## Tipografía

### Stack tipográfico

| Rol | Fuente | Peso | Uso |
|-----|--------|------|-----|
| **Display / Wordmark** | Bebas Neue | 400 (única) | Título "DIESEL" en el logo, grandes KPIs numéricos |
| **UI / Títulos** | Syne | 700, 800 | Headings de página, nombres de módulo |
| **Cuerpo** | DM Sans | 300, 400, 500 | Párrafos, descripciones, labels de formulario |
| **Código / Datos** | JetBrains Mono | 400, 600 | IDs de transacción, placas, precios, terminal log |

### Import Google Fonts

```css
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;600&display=swap');
```

### Escala tipográfica

```css
/* Display — KPIs grandes, héroe */
.text-display  { font-family: 'Bebas Neue'; font-size: 64px; letter-spacing: 0.02em; }

/* H1 — Títulos de página */
.text-h1       { font-family: 'Syne'; font-size: 28px; font-weight: 800; letter-spacing: -0.02em; }

/* H2 — Secciones */
.text-h2       { font-family: 'Syne'; font-size: 20px; font-weight: 700; letter-spacing: -0.01em; }

/* Body — Texto general */
.text-body     { font-family: 'DM Sans'; font-size: 14px; font-weight: 400; line-height: 1.6; }

/* Small — Metadata, labels */
.text-small    { font-family: 'DM Sans'; font-size: 12px; font-weight: 400; color: var(--text-secondary); }

/* Mono — Datos técnicos */
.text-mono     { font-family: 'JetBrains Mono'; font-size: 12px; font-weight: 400; }

/* Label — Encabezados de tabla, badges */
.text-label    { font-family: 'JetBrains Mono'; font-size: 9px; font-weight: 400;
                 letter-spacing: 0.12em; text-transform: uppercase; }
```

---

## Iconografía

### Sistema de iconos

Librería base: **Lucide Icons** (`lucide-react`) — stroke-based, 1.5px, estilo lineal limpio.

Los iconos siempre usan `stroke-width: 1.5`. Nunca filled, salvo el ícono de la gota de combustible del logo que es la excepción de marca.

### Iconos por módulo

| Módulo | Ícono Lucide | Significado |
|--------|-------------|-------------|
| M1 — Auth | `Lock` / `LogIn` | Seguridad y acceso |
| M2 — Usuarios | `Users` | Gestión de personas |
| M3 — Gestión de Estación | `Fuel` | Operación de bomba |
| M4 — Precios y Zonas | `MapPin` + `Tag` | Ubicación y precio |
| M5 — Normativa | `FileText` | Decretos y documentos |
| M6 — Reportes | `BarChart2` | Métricas y análisis |
| M7 — Auditoría | `Shield` | Control y seguridad |
| M8 — Dashboard | `LayoutDashboard` | Vista general |

### Iconos de estado

| Estado | Ícono | Color |
|--------|-------|-------|
| Confirmado | `CheckCircle` | `--green-500` |
| Pendiente | `Clock` | `--yellow-500` |
| Error / Alerta | `AlertTriangle` | `--red-500` |
| Información | `Info` | `--blue-500` |
| Activo | `Circle` relleno | `--green-500` |
| Inactivo | `Circle` vacío | `--text-muted` |

### Tamaños estándar

```tsx
// Navbar / Sidebar
<Icon size={16} strokeWidth={1.5} />

// Botones
<Icon size={14} strokeWidth={1.5} />

// Headings de módulo
<Icon size={20} strokeWidth={1.5} />

// Alertas y estados grandes
<Icon size={24} strokeWidth={1.5} />
```

---

## Animaciones y Motion

### Principios

- **Propósito sobre decoración** — cada animación comunica algo: carga, éxito, error, estado en vivo.
- **Máximo una animación llamativa por pantalla** — el pulse del estado del sistema en el topbar es suficiente.
- **Duración corta** — transiciones de UI entre 100ms y 300ms. Animaciones de entrada máximo 400ms.
- **Sin bounce exagerado** — easing `ease` o `cubic-bezier(0.4, 0, 0.2, 1)`. Nunca `spring` agresivo.

### Animaciones de marca

```css
/* 1. Fade-in-up — entrada de componentes */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-enter { animation: fadeInUp 0.3s ease both; }

/* 2. Pulse — indicador de sistema en vivo */
@keyframes pulse-live {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.35; }
}
.status-live { animation: pulse-live 2s ease infinite; }

/* 3. Pulse-ring — alerta o evento activo */
@keyframes pulse-ring {
  0%   { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(2.4); opacity: 0; }
}
.alert-ring::after {
  content: '';
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 1px solid var(--amber-500);
  animation: pulse-ring 1.4s ease infinite;
}

/* 4. Scan-line — loading de datos en tabla */
@keyframes scan {
  from { transform: translateY(-100%); }
  to   { transform: translateY(400%); }
}
.loading-scan::before {
  content: '';
  position: absolute;
  left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--amber-500), transparent);
  animation: scan 1.5s linear infinite;
}

/* 5. Count-up — números de KPI al cargar */
@keyframes countUp {
  from { transform: translateY(16px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
.kpi-value { animation: countUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) both; }

/* 6. Stagger — lista de cards al cargar */
.card:nth-child(1) { animation-delay: 0.05s; }
.card:nth-child(2) { animation-delay: 0.10s; }
.card:nth-child(3) { animation-delay: 0.15s; }
.card:nth-child(4) { animation-delay: 0.20s; }
```

### Transiciones de UI

```css
/* Hover en nav items, botones y filas de tabla */
.interactive {
  transition: background 0.15s ease,
              border-color 0.15s ease,
              color 0.15s ease;
}

/* Apertura de modals y dropdowns */
.overlay-enter {
  animation: fadeInUp 0.2s ease both;
}

/* Focus ring en inputs */
.input:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--amber-500);
  transition: box-shadow 0.15s ease;
}
```

---

## Componentes de UI — Guía rápida

### Badges de estado

```tsx
// Verde — confirmado
<span className="badge-green">Confirmado</span>

// Estructura CSS
.badge-green {
  background: var(--green-dim);
  color: var(--green-500);
  border: 1px solid var(--green-500);
  font-family: 'JetBrains Mono';
  font-size: 9px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 2px 7px;
  border-radius: 2px;
}
```

### Botones

```css
/* Primario */
.btn-primary {
  background: var(--amber-500);
  color: var(--text-inverted);
  font-family: 'JetBrains Mono';
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  padding: 8px 16px;
  border-radius: 4px;
  border: 1px solid var(--amber-500);
  transition: background 0.15s ease;
}

.btn-primary:hover { background: var(--amber-600); }

/* Fantasma */
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-strong);
}

.btn-ghost:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}
```

### Borde izquierdo de acento (nav activo)

```css
.nav-item.active::before {
  content: '';
  position: absolute;
  left: -1px;
  top: 25%; bottom: 25%;
  width: 2px;
  background: var(--amber-500);
  border-radius: 0 2px 2px 0;
}
```

---

## Tailwind Config

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        amber: {
          500: '#F5A623',
          600: '#D4891A',
          dim: '#2a1a00',
        },
        bg: {
          base:     '#080808',
          surface:  '#0f0f0f',
          elevated: '#161616',
          hover:    '#1d1d1d',
        },
        border: {
          subtle:  '#1a1a1a',
          default: '#222222',
          strong:  '#2a2a2a',
        },
        text: {
          primary:   '#E8E8E8',
          secondary: '#888888',
          muted:     '#444444',
          inverted:  '#080808',
        },
        status: {
          green:      '#2ECC71',
          'green-dim':'#0a2a15',
          red:        '#E74C3C',
          'red-dim':  '#2a0a08',
          yellow:     '#F1C40F',
          'yellow-dim':'#2a2200',
          blue:       '#3498DB',
          'blue-dim': '#0a1a2a',
        },
      },
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        sans:    ['DM Sans', 'sans-serif'],
        heading: ['Syne', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        brand: '4px',  /* radio estándar de todos los componentes */
      },
    },
  },
  plugins: [],
}

export default config
```

---

## shadcn/ui — Configuración de tema

Al inicializar shadcn, elegir las siguientes opciones:

```bash
pnpm dlx shadcn@latest init
```

```
✔ Which style would you like to use? › Default
✔ Which color would you like to use as base color? › Neutral
✔ Would you like to use CSS variables for colors? › yes
```

Luego en `globals.css`, reemplazar las variables del tema dark:

```css
@layer base {
  .dark {
    --background:       8 8 8;        /* #080808 */
    --foreground:       232 232 232;  /* #E8E8E8 */
    --card:             15 15 15;     /* #0f0f0f */
    --card-foreground:  232 232 232;
    --border:           34 34 34;     /* #222222 */
    --input:            34 34 34;
    --primary:          245 166 35;   /* #F5A623 */
    --primary-foreground: 8 8 8;
    --muted:            22 22 22;     /* #161616 */
    --muted-foreground: 136 136 136;  /* #888888 */
    --accent:           42 26 0;      /* #2a1a00 */
    --accent-foreground: 245 166 35;
    --destructive:      231 76 60;    /* #E74C3C */
    --ring:             245 166 35;   /* #F5A623 */
    --radius:           0.25rem;
  }
}
```

---

## Do's and Don'ts

### ✅ Hacer

- Usar ámbar solo para elementos de acción o estado activo — nunca como fondo masivo
- Mantener el fondo siempre oscuro (`#080808`) como base
- Usar JetBrains Mono para todos los datos técnicos: placas, IDs, precios, coordenadas
- Mantener `border-radius: 4px` en todos los componentes — nunca redondo completo
- Respetar la jerarquía: Bebas Neue → Syne → DM Sans → JetBrains Mono

### ❌ No hacer

- No usar el ámbar en más del 15% del área visual de cualquier pantalla
- No usar fondos blancos o grises claros — la identidad es 100% dark
- No mezclar el isotipo con texto en ángulo ni distorsionarlo
- No usar otras fuentes fuera del stack definido
- No usar sombras `box-shadow` grandes — los bordes sutiles reemplazan las sombras

---

*easyDiesel · Brand Identity v1.0 · Universidad Piloto de Colombia · 2026*
