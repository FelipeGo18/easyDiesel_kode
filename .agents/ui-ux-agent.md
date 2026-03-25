# UI/UX Agent — EasyDiesel Design System

## Perfil
Especialista en diseño de interfaces para aplicaciones industriales/energéticas. Experto en dark mode, sistemas de diseño consistentes y accesibilidad WCAG 2.1 AA.

## Contexto Actual
Panel de despacho (`DespachadorPanelPage.tsx`) usa un degradado lineal ámbar en el hero:
```
bg-[linear-gradient(135deg,rgba(18,18,16,1)_0%,rgba(14,12,8,1)_60%,rgba(30,18,2,1)_100%)]
```

**Problema identificado**: El degradado dorado/ámbar genera:
- Baja legibilidad en ciertos monitores
- Sensación de "sucio" o desgastado
- Inconsistencia con el resto de la UI (que usa superficies sólidas)
- Dificultad para mantener coherencia en modo claro (si se implementa futuro)

---

## Alternativas Recomendadas (sin degradados)

### Opción A: Superficie Sólida con Borde Sutil (Recomendada)
```tsx
<section className="relative overflow-hidden rounded-[24px] border border-amber-500/20 bg-[#141412] px-6 py-5">
    {/* Solo el blur decorativo se mantiene */}
    <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-amber-500/8 blur-[100px] pointer-events-none" />
```
**Ventajas**: Limpia, profesional, consistente con el resto de Cards.

### Opción B: Superficie con Pattern SVG Sutil
```tsx
<section className="relative overflow-hidden rounded-[24px] border border-amber-500/15 bg-[#141412] px-6 py-5">
    {/* Pattern de rejilla técnica */}
    <div className="absolute inset-0 opacity-[0.02]" 
         style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23f59e0b\' fill-opacity=\'1\'%3E%3Cpath fill-rule=\'evenodd\' d=\'M0 0h1v1H0V0zm1 1h1v1H1V1z\'/%3E%3C/g%3E%3C/svg%3E")' }} 
    />
```
**Ventajas**: Añade textura técnica sin degradado, refuerza la identidad industrial.

### Opción C: Glassmorphism Sutil (tendencia 2024)
```tsx
<section className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.02] backdrop-blur-md px-6 py-5">
    <div className="absolute inset-0 bg-amber-500/5" />
```
**Ventajas**: Moderna, consistente con la tarjeta de precios (que ya usa glassmorphism).

### Opción D: Superficie Dividida (Layout estructurado)
```tsx
<section className="relative overflow-hidden rounded-[24px] border border-amber-500/20 flex">
    {/* Izquierda: fondo oscuro sólido */}
    <div className="flex-1 bg-[#141412] px-6 py-5">
        {/* Contenido principal */}
    </div>
    {/* Derecha: acento sólido (no degradado) */}
    <div className="w-1 bg-amber-500/30" />
    <div className="w-64 bg-[#0d0d0b] px-4 py-5">
        {/* Pricing card aquí */}
    </div>
</section>
```
**Ventajas**: Estructura clara, jerarquía visual por separación, no por degradado.

---

## Tokens de Color Consistentes

Para mantener coherencia sin degradados, usar estas superficies:

| Token | Valor | Uso |
|-------|-------|-----|
| `--surface-hero` | `#141412` | Hero sections, cards principales |
| `--surface-elevated` | `#1a1a18` | Cards secundarias, modales |
| `--surface-base` | `#0d0d0b` | Fondo general |
| `--accent-border` | `amber-500/20` | Bordes de acento (no degradados) |
| `--glow-amber` | `amber-500/10` | Blurs decorativos |

---

## Implementación Recomendada (Código Final)

```tsx
{/* Hero compacto — Versión sin degradado */}
<section className="relative overflow-hidden rounded-[24px] border border-amber-500/20 bg-[#141412] px-6 py-5">
    {/* Glow decorativo sutil (no degradado) */}
    <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-amber-500/8 blur-[100px] pointer-events-none" />
    
    <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* ... contenido ... */}
    </div>
</section>
```

---

## Principios Aplicados

1. **No más degradados lineales**: Usar colores sólidos con transparencias
2. **Profundidad por sombras/bordes**: No por transiciones de color
3. **Acentos localizados**: Badges, bordes, iconos — no fondos enteros
4. **Consistencia térmica**: Todo el sistema usa ámbar como único acento cálido

## Referencias
- Apple Design (macOS Sonoma): Superficies sólidas con glassmorphism
- Material You: Color sólido con elevación por sombras
- Vercel Dashboard: Bordes sutiles, sin degradados en cards principales
