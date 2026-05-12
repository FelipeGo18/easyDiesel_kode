# Informe de Resultados de Pruebas del Sistema — EasyDiesel

Este documento detalla los resultados obtenidos tras la ejecución de las pruebas de carga y estrés utilizando la herramienta **k6**, contrastándolos paso a paso con el plan de pruebas definido.

---

## 1. Resumen Ejecutivo de la Ejecución
- **Entorno:** Local (Backend) + Supabase (Base de Datos en la Nube).
- **Herramienta:** k6 v0.51.0.
- **Límite de Estabilidad Detectado:** **10 Usuarios Virtuales (VUs)** concurrentes con 0% de error.
- **Punto de Quiebre:** **15-30 VUs** (debido a latencia de red y bloqueos de fila en base de datos remota).

---

## 2. Resultados Detallados por Caso de Prueba (CPS)

### CPS-001 — Desempeño: Tiempo de Respuesta bajo Carga (RNF-01)
**Objetivo:** Verificar que el sistema procesa transacciones en menos de 3 segundos bajo carga concurrente.

| Paso | Acción | Resultado Esperado | Resultado Actual (10 VUs) | Estado |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Configurar usuarios virtuales (VUs) en k6 enviando peticiones POST. | El sistema inicia la recepción de carga sin bloqueos ni caídas. | k6 escaló a 10 VUs sin errores de handshake o conexión. | **PASS** |
| **2** | Ejecutar la prueba de forma sostenida (15-30 segundos). | El servidor procesa las peticiones de forma continua y estable. | Se completaron 30 iteraciones de flujo completo sin interrupciones. | **PASS** |
| **3** | Revisar métrica `http_req_duration` p(95) para el registro de ventas. | El tiempo de respuesta debe ser inferior a 3000ms. | El p(95) de la operación de venta fue de **1210ms**. | **PASS** |

> **Nota técnica:** Al subir a 30 VUs, el p(95) subió a **13.07s**, fallando este paso debido a la latencia de red con Supabase.

---

### CPS-002 — Disponibilidad: Tasa de Errores bajo Estrés (RNF-02)
**Objetivo:** Garantizar una disponibilidad mínima del 99% (tasa de error < 1%) bajo condiciones de carga.

| Paso | Acción | Resultado Esperado | Resultado Actual (10 VUs) | Estado |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Lanzar rampa de usuarios (0 a 10 VUs) en k6. | El sistema escala los recursos y mantiene la conectividad. | Escalado fluido sin picos de error durante la subida. | **PASS** |
| **2** | Verificar la métrica `http_req_failed` tras la ejecución. | La tasa de errores debe ser inferior al 1.0%. | Tasa de error final: **0.00%** (0 fallos de 201 peticiones). | **PASS** |

> **Nota técnica:** A partir de 15 VUs, la tasa de error sube al **2.47%**, y a 50 VUs llega al **16.41%**, excediendo el límite del plan.

---

### CPS-005 — Prueba Funcional End-to-End bajo Carga
**Objetivo:** Validar que el flujo completo de negocio funciona correctamente bajo concurrencia.

| Paso | Acción | Resultado Esperado | Resultado Actual (10 VUs) | Estado |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Realizar Login masivo para obtener tokens JWT. | Cada VU obtiene un token válido (HTTP 200). | 100% de los logins exitosos. Tokens generados correctamente. | **PASS** |
| **2** | Ejecutar flujo: Consulta Tanques -> Registro Venta. | Las operaciones retornan códigos 200 y 201 respectivamente. | Tanques consultados en 680ms avg. Ventas registradas en 1.2s avg. | **PASS** |
| **3** | Consultar Dashboard para verificar agregación de datos. | El dashboard refleja las nuevas ventas (HTTP 200). | Dashboard consultado exitosamente con datos actualizados. | **PASS** |

---

## 3. Conclusiones y Recomendaciones
1.  **Cumplimiento:** El sistema cumple con todos los criterios de aceptación para una carga de **10 usuarios concurrentes**.
2.  **Limitación de Infraestructura:** El fallo en cargas superiores (30+ VUs) no es por lógica de software, sino por el **bloqueo de fila en el tanque** y la **latencia de red** hacia Supabase.
3.  **Acción Recomendada:** Para despliegues que requieran >50 usuarios concurrentes reales, se recomienda:
    *   Migrar a una base de datos con mayor pool de conexiones (Supabase Pro).
    *   Asegurar que el Backend y la DB estén en la misma región/red.
    *   Optimizar el middleware de Rate Limit para permitir ráfagas de estaciones de servicio autorizadas.

**Fecha de Informe:** 2026-04-11  
**Responsable:** Kode Group (Asistente AI Trae)
