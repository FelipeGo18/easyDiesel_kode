# Gestionar Defectos y Errores de la Actividad de Documentación - EasyDiesel

Este documento define el proceso para identificar, registrar, clasificar y resolver los defectos encontrados durante la revisión de la documentación de EasyDiesel, con ejemplos reales de cada tipo de defecto basados en los documentos del proyecto (SRS, SDS, manuales, ayudas, estándares).

---

## 1. Objetivo

Establecer un proceso sistemático para gestionar los defectos detectados en los documentos del proyecto EasyDiesel, asegurando su trazabilidad, corrección oportuna y cierre formal.

---

## 2. Alcance

Aplica a los defectos encontrados en **todos** los documentos del proyecto EasyDiesel durante la actividad de elaboración y revisión de documentación:

| Documento | Tipo |
|-----------|------|
| `SRS.md` | Requerimientos |
| `SDS.md` | Diseño y arquitectura |
| `MANUAL_USUARIO.md` | Documentación de usuario |
| `MANUAL_TECNICO.md` | Documentación técnica |
| `AYUDAS_PRODUCTO.md` | Ayudas integradas al producto |
| `REVISION_DOCUMENTOS.md` | Proceso de revisión |
| `PLAN_DE_CALIDAD.md` | Calidad |
| `PLAN_PRUEBAS_UNITARIAS.md` | Pruebas |
| `Pruebas_Integracion_UC01.md` | Pruebas de integración |
| `ESTANDARES_CODIFICACION.md` | Estándares de código |
| `PLANEACION_IMPLEMENTACION.md` | Planeación |
| `Resumen_Casos_de_Uso.md` | Casos de uso |
| `decreto.md` | Normativa de referencia |

---

## 3. Clasificación de Defectos

### 3.1 Por Tipo — con ejemplos reales del proyecto EasyDiesel

| Tipo | Descripción | Ejemplo real en EasyDiesel |
|------|-------------|----------------------------|
| **Error de contenido** | Información técnicamente incorrecta o desactualizada | `MANUAL_TECNICO.md` indica puerto `5432` para `DATABASE_URL` en producción, cuando debe ser `6543` (PgBouncer) |
| **Error de omisión** | Información faltante o sección incompleta | `MANUAL_USUARIO.md` no documenta el flujo de cierre de turno del Trabajador de Estación |
| **Error de consistencia** | Contradicción entre documentos del mismo proyecto | `SRS.md` llama al actor "Conductor" pero `MANUAL_USUARIO.md` lo llama "Trabajador de Estación" |
| **Error de formato** | Incumplimiento del estándar de documentación definido | Tabla en `AYUDAS_PRODUCTO.md` sin cabecera; documento sin sección de Referencias al final |
| **Error de redacción** | Ambigüedad, mala gramática o instrucción poco clara | Tooltip del campo "Tipo de servicio" dice "seleccione el tipo" sin explicar qué implica cada opción según el Decreto 1428 |
| **Error de referencia** | Referencia a documento, sección, UC o módulo inexistente | `AYUDAS_PRODUCTO.md` referencia `MANUAL_USUARIO.md` sección 3.2 que fue renumerada a sección 6 |

### 3.2 Por Severidad

| Severidad | Criterio | Tiempo máximo de corrección |
|-----------|----------|-----------------------------|
| **Crítica** | Impide la comprensión o uso correcto del sistema | 1 día hábil |
| **Alta** | Afecta significativamente la utilidad del documento | 3 días hábiles |
| **Media** | Genera confusión pero tiene solución alternativa conocida | 5 días hábiles |
| **Baja** | Error menor de formato o redacción sin impacto funcional | Próxima iteración |

---

## 4. Proceso de Gestión de Defectos

### 4.1 Flujo General

```
Defecto detectado (revisión / uso)
          ↓
    Registro del defecto
          ↓
  Clasificación y asignación
          ↓
    Corrección por autor
          ↓
  Verificación por revisor
          ↓
   ¿Corrección aceptada?
      /          \
    No             Sí
     ↓              ↓
Reabrir defecto   Cierre y registro
```

### 4.2 Campos del Registro de Defecto

| Campo | Descripción |
|-------|-------------|
| **ID** | Identificador único (DOC-XXX) |
| **Documento afectado** | Nombre del archivo `.md` |
| **Sección afectada** | Número/título de la sección |
| **Tipo** | Tipo de defecto (ver sección 3.1) |
| **Severidad** | Nivel de severidad (Crítica / Alta / Media / Baja) |
| **Descripción** | Descripción clara del defecto encontrado |
| **Detectado por** | Nombre del revisor que encontró el defecto |
| **Fecha detección** | Fecha en que fue registrado |
| **Asignado a** | Responsable de la corrección |
| **Fecha corrección** | Fecha en que fue corregido |
| **Estado** | Abierto / En corrección / Verificando / Cerrado |
| **Descripción corrección** | Qué se hizo para corregirlo |

---

## 5. Registro de Defectos de Documentación

> Completar durante el proceso de revisión formal. Los ejemplos pre-cargados (DOC-001 a DOC-005) ilustran defectos típicos del tipo encontrado en proyectos similares a EasyDiesel; deben verificarse o reemplazarse con los hallazgos reales de la revisión.

| ID | Documento | Sección afectada | Tipo | Severidad | Descripción del defecto | Detectado por | Fecha detección | Asignado a | Fecha corrección | Estado | Descripción corrección |
|----|-----------|-----------------|------|-----------|------------------------|---------------|-----------------|------------|-----------------|--------|------------------------|
| DOC-001 | `MANUAL_TECNICO.md` | Sección 5.1 Variables de Entorno | Error de contenido | **Alta** | `DATABASE_URL` debe usar puerto `6543` (PgBouncer) en producción, no el `5432` directo que rompe el pooling | Revisor | | Autor Manual Técnico | | Abierto | |
| DOC-002 | `MANUAL_USUARIO.md` | Sección 6 M3 | Error de omisión | **Alta** | No se documenta el flujo de "Recepción de Cisterna" (ingreso número de remisión, tanque destino, volumen) | Revisor | | Autor Manual Usuario | | Abierto | |
| DOC-003 | `AYUDAS_PRODUCTO.md` | Sección 3 Mensajes Zod | Error de consistencia | Media | El mensaje para "placa inválida" en `AYUDAS_PRODUCTO.md` dice formato `AAA000` pero el SRS especifica `3 letras + 3 números` sin formato fijo | Revisor | | Autor Ayudas | | Abierto | |
| DOC-004 | `SRS.md` | Sección UC-05 | Error de referencia | Media | UC-05 referencia el "Catálogo RUNT" pero no existe sección que explique cómo se sincroniza (debi ó referenciar UC-10) | Revisor | | Autor SRS | | Abierto | |
| DOC-005 | `ESTANDARES_CODIFICACION.md` | Sección 1.2 | Error de omisión | Baja | No menciona el uso obligatorio de `async/await` con `try/catch` en los controllers para manejar errores de Prisma | Revisor | | Autor Estándares | | Abierto | |

---

## 6. Métricas de Seguimiento

| Métrica | Cómo calcular | Meta del proyecto |
|---------|--------------|-------------------|
| **Total de defectos registrados** | Contar filas en la tabla de registro | — |
| **Tasa de defectos cerrados** | (Cerrados / Total) × 100 | ≥ 95% al cierre de la actividad |
| **Tiempo promedio de corrección** | Suma de días entre detección y corrección / Total defectos cerrados | ≤ 3 días hábiles promedio |
| **Defectos críticos + altos pendientes** | Contar filas con Severidad=Crítica o Alta y Estado=Abierto | 0 al cierre |
| **Defectos por documento** | Agrupar tabla por columna "Documento" | Identificar los documentos con más problemas |
| **Defectos por tipo** | Agrupar tabla por columna "Tipo" | Si >50% son "Error de contenido", revisar fuente de datos del SDS/SRS |
| **Defectos de consistencia entre documentos** | Filtrar tabla por Tipo = "Error de consistencia" | 0 al cierre (inconsistencias dañan la confianza en la documentación) |

**Indicadores de alerta temprana:**
- Si se detectan > 3 defectos de tipo **Error de consistencia** entre `SRS.md`, `SDS.md` y los manuales, se debe convocar una revisión conjunta de los 3 documentos antes de continuar.
- Si el `MANUAL_TECNICO.md` tiene defectos de **Error de contenido** relacionados con el stack tecnológico (React, Node.js, Prisma, Supabase), se debe verificar directamente contra el `SDS.md` como fuente de verdad.

---

## 7. Criterios de Cierre de la Actividad

- El 100% de los defectos de severidad **Crítica** y **Alta** han sido cerrados.
- El 95% o más de los defectos de severidad **Media** han sido cerrados.
- Los defectos de severidad **Baja** están registrados y programados para corrección.
- El `LOG_DEFECTOS_INSPECCION.md` está actualizado con el resumen final.

---

## 8. Responsables

| Rol | Documentos a su cargo | Responsabilidad |
|-----|----------------------|----------------|
| **Líder de Proyecto** | Todos | Supervisar el proceso, priorizar defectos Críticos, aprobar el cierre de la actividad |
| **Líder de Desarrollo** | `SRS.md`, `SDS.md`, `MANUAL_TECNICO.md`, `ESTANDARES_CODIFICACION.md` | Corregir defectos de contenido técnico (stack, módulos M1-M8, flujos técnicos) |
| **Líder de Calidad (QA)** | `PLAN_DE_CALIDAD.md`, `PLAN_PRUEBAS_UNITARIAS.md`, `Pruebas_Integracion_UC01.md` | Detectar defectos en documentos de pruebas; verificar correcciones de todos los documentos |
| **Analista de Documentación** | `MANUAL_USUARIO.md`, `AYUDAS_PRODUCTO.md` | Corregir defectos de redacción, omisión y consistencia en manuales y textos de ayuda |
| **Revisor asignado** | Documento en revisión | Detectar defectos aplicando el checklist de `REVISION_DOCUMENTOS.md`, registrarlos en este documento con ID `DOC-XXX` |

---

## 9. Referencias

- `LOG_DEFECTOS_INSPECCION.md` — Log general de defectos del proyecto
- `REVISION_DOCUMENTOS.md` — Proceso de revisión de documentos
- `PLAN_DE_CALIDAD.md` — Plan de calidad del proyecto EasyDiesel

---

**Proyecto:** EasyDiesel  
**Versión:** 1.0  
**Actividad padre:** Elaborar documentación del producto de software  
**Fecha de elaboración:** Marzo 2026
