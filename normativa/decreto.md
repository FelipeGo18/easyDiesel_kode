---
name: normativa
description: Reglas del Decreto 1428/2025, lógica del motor de precios y tipos de servicio
---

# Normativa — Motor de Precios y Decretos

## Marco regulatorio

| Norma | Fecha | Entidad | Descripción |
|-------|-------|---------|-------------|
| **Decreto 1428/2025** | 24 dic 2025 (DO 26 dic) | Min. Hacienda y Crédito Público | Mecanismo diferencial de estabilización de precios ACPM. Adiciona el Decreto Único Reglamentario 1068/2015 del Sector Hacienda |
| **Decreto 763/2024** | 18 jun 2024 | — | Regulación de precios para Grandes Consumidores (>20.000 gal/mes ACPM). Excluye transporte masivo, emergencias y ZNI |
| **Decreto 318/2003** | — | — | Regulación de distribución y control de combustibles líquidos |
| **Resolución 40200/2025** | 2025 | Min. Minas y Energía | Lineamientos sobre precios, zonas de distribución y mecanismos de reporte |

## Decreto 1428/2025 — Regla principal

### Objetivo
Crear un mecanismo diferencial de estabilización de precios del ACPM para corregir distorsiones del FEPC, proteger el transporte público y fortalecer la sostenibilidad fiscal.

### Motivación
- **Reducción del déficit fiscal**: los subsidios al diésel representaban un costo elevado para el Estado; el desmonte gradual busca aliviar la presión sobre las finanzas públicas.
- **Alineación con precios internacionales**: el ACPM en Colombia estaba muy por debajo del valor de referencia internacional.
- **Equidad en el consumo**: se mantiene un esquema diferenciado para transporte público y de carga (sectores esenciales para la economía y el costo de vida).

### ACPM — Precios diferenciados

| Tipo de servicio | Código enum | ¿Subsidio? | Regla de precio |
|------------------|-------------|------------|-----------------|
| **Particular** | `TipoServicio.PARTICULAR` | ❌ No | Precio ≥ paridad internacional, ≤ paridad de importación |
| **Diplomático** | `TipoServicio.DIPLOMATICO` | ❌ No | Igual que particular |
| **Oficial** | `TipoServicio.OFICIAL` | ❌ No | Igual que particular |
| **Transporte público** | `TipoServicio.PUBLICO` | ✅ Sí | Precio estabilizado (FEPC) |
| **Carga** | `TipoServicio.CARGA` | ✅ Sí | Precio estabilizado (FEPC) |

> El ingreso al productor para vehículos de servicio particular, diplomático y oficial será, como mínimo, el precio de paridad internacional, sin superar el precio de paridad de importación.

### Impacto esperado
- Incremento gradual en el precio del ACPM para particulares, oficiales y diplomáticos.
- Alzas superiores a **$3.000 por galón** en algunos casos, dependiendo de ciudad y etapa.
- Aplicación inicial en principales ciudades, extensión progresiva al resto del país.
- Protección al transporte público y de carga con esquema diferenciado.

### Gasolina
- Todos los tipos de servicio pagan el **mismo precio** (sin diferenciación).

## Decreto 763/2024 — Grandes Consumidores

- Aplica a consumidores de **>20.000 galones de ACPM/mes**.
- Su precio se ajusta al **precio de paridad internacional**.
- **Excluidos**: sistemas de transporte masivo, servicios de emergencia, generación eléctrica en Zonas No Interconectadas (ZNI).

## Motor de precios — Lógica

```
ENTRADA: tipoCombustible, tipoServicio, zona, esGranConsumidor
SALIDA:  precioGalón, subsidioAplicado (sí/no)

1. Buscar en `precios_vigentes` WHERE:
   - tipo_combustible = entrada.tipoCombustible
   - tipo_servicio    = entrada.tipoServicio
   - zona_id          = entrada.zona
   - activo           = true
   - vigencia_desde  <= hoy
   - (vigencia_hasta IS NULL OR vigencia_hasta >= hoy)

2. Si tipoCombustible == ACPM && tipoServicio IN (PARTICULAR, DIPLOMATICO, OFICIAL):
   → subsidioAplicado = false
   → precioGalón = precio_paridad_internacional (sin subsidio FEPC)

3. Si tipoCombustible == ACPM && tipoServicio IN (PUBLICO, CARGA):
   → subsidioAplicado = true
   → precioGalón = precio_base - subsidio_galon (precio estabilizado FEPC)

4. Si tipoCombustible == ACPM && esGranConsumidor == true (>20k gal/mes):
   → subsidioAplicado = false
   → precioGalón = precio_paridad_internacional (Decreto 763/2024)
   → EXCEPTO si es transporte masivo, emergencias o ZNI

5. Si tipoCombustible != ACPM (gasolina, etc.):
   → Precio igual para todos los tipos de servicio
```

## Zonas de distribución

Las zonas se determinan según el Decreto 318/2003 y la Resolución 40200/2025. Cada zona puede tener precios diferentes para el mismo combustible.

### Variables que afectan el precio por zona
- Modalidad de transporte
- Ubicación geográfica de estaciones y distribuidores
- Distancia de la estación de servicios

## Actores de la plataforma

| Actor | Responsabilidades |
|-------|-------------------|
| **Usuario particular** | Compra ACPM/gasolina a precio sin subsidio |
| **Usuario con subsidio** | Compra ACPM a precio estabilizado (público/carga) |
| **Estación de servicio** | Carga datos de inventario, visualiza precios vigentes por zona/tipo |
| **Distribuidor mayorista** | Registra entregas con datos de vehículos, volumen y destino |
| **Autoridad reguladora** | Obtiene informes en formatos exigidos por decretos y resoluciones |
| **Administrador del sistema** | Define zonas, reglas de validación, gestiona usuarios y permisos |

## Reportes regulatorios

- Generación de informes en formatos exigidos por el Ministerio de Minas y Energía (Decreto 318/2003, Decreto 763/2024, Resolución 40200/2025).
- Exportación a PDF/Excel para auditorías.

## Auditoría

Toda aplicación de precio debe registrar:
- Decreto aplicado (número y fecha)
- Subsidio aplicado (sí/no, monto)
- Zona de la estación
- Tipo de servicio del vehículo
- Trazabilidad completa de operaciones
