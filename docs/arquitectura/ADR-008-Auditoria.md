# IS-00138 Métodos formales en construcción de software

## SEGUIMIENTO DECISIONES DE ARQUITECTURA/DISEÑO DE SOFTWARE

---

**Problema/Preocupación de diseño**

Cómo asegurar que cada cambio sensible en el sistema (ventas, cambios de precio, ajustes de inventario) sea rastreable y auditable por entes de control.

---

**Orientación de la decisión**

Implementación de un sistema de **Auditoría Transversal** mediante una tabla centralizada vinculada a todas las operaciones de negocio.

---

**Supuestos**

*   Cualquier error en el sistema debe poder ser investigado mirando los registros históricos.
*   Los registros de auditoría son inmutables (no se borran).

---

**Restricciones**

*   El registro de auditoría no debe penalizar significativamente el rendimiento de la aplicación.

---

**Requerimientos relacionados**

*   Cumplimiento normativo (Sicom, DIAN).
*   Seguridad y trazabilidad.

---

**Alternativas consideradas**

- **Alternativa 1:** Logs en archivos de texto.
- **Alternativa 2:** Tabla de Auditoría en Base de Datos (Seleccionada).
- **Alternativa 3:** Disparadores (Triggers) de base de datos.

---

**Evaluación de alternativas**

- **Alternativa 1:** Ventaja: Muy rápido. Desventaja: Difícil de consultar y cruzar con datos de usuario.
- **Alternativa 2:** Ventaja: Fácil de reportar, cruzar con entidades y asegurar mediante transacciones.
- **Alternativa 3:** Ventaja: Automático. Desventaja: Difícil de mantener y limita la lógica de aplicación.

---

**Alternativa seleccionada y Justificación**

Se selecciona la **Alternativa 2: Tabla de Auditoría**.
Justificación: Permite generar reportes de auditoría directamente desde la aplicación para los administradores, asegurando que cada acción tenga un responsable y un contexto claro.

---

**Decisiones relacionadas**

- ADR-004: Base de Datos.

---

**Comentarios**

Se almacenarán los datos "Antes" y "Después" de cada operación en formato JSON.
