# IS-00138 Métodos formales en construcción de software

## SEGUIMIENTO DECISIONES DE ARQUITECTURA/DISEÑO DE SOFTWARE

---

**Problema/Preocupación de diseño**

Cómo organizar el código fuente de EasyDiesel para asegurar que sea mantenible, escalable y que la lógica de negocio no dependa de la tecnología externa (Bases de datos, Frameworks).

---

**Orientación de la decisión**

Se adopta el **Estilo Arquitectónico en Capas** (N-Tier). Se dividen las responsabilidades en: Presentación (React), Aplicación (API REST), Dominio (Servicios de Negocio) e Infraestructura (Persistencia con Prisma).

---

**Supuestos**

*   Se asume que la lógica de negocio cambiará con menos frecuencia que la interfaz de usuario.
*   El uso de TypeScript facilitará la comunicación entre estas capas mediante interfaces.

---

**Restricciones**

*   Debe mantenerse la compatibilidad con el entorno de ejecución Node.js.

---

**Requerimientos relacionados**

*   RF-Gestión de inventario.
*   RF-Control de transacciones.

---

**Alternativas consideradas**

- **Alternativa 1:** Monolito sin capas (todo en controladores).
- **Alternativa 2:** Arquitectura de microservicios (demasiado compleja para la fase inicial).
- **Alternativa 3:** Arquitectura en capas (Seleccionada).

---

**Evaluación de alternativas**

- **Alternativa 1:** Ventaja: Desarrollo rápido. Desventaja: Difícil de testear y mantener.
- **Alternativa 2:** Ventaja: Escalabilidad extrema. Desventaja: Costo de infraestructura y latencia de red.
- **Alternativa 3:** Ventaja: Equilibrio perfecto entre orden y velocidad de desarrollo.

---

**Alternativa seleccionada y Justificación**

Se selecciona la **Alternativa 3: Capas**.
Justificación: Permite una separación clara de responsabilidades. Si mañana se decide cambiar la base de datos PostgreSQL por otra, solo se vería afectada la capa de Infraestructura, manteniendo el resto del sistema intacto.

---

**Decisiones relacionadas**

- ADR-002: Estilo Cliente-Servidor.
- ADR-004: Uso de Prisma ORM.

---

**Comentarios**

Esta estructura facilita el onboarding de nuevos desarrolladores al tener carpetas bien definidas por responsabilidad.
