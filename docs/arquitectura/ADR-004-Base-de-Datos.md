# IS-00138 Métodos formales en construcción de software

## SEGUIMIENTO DECISIONES DE ARQUITECTURA/DISEÑO DE SOFTWARE

---

**Problema/Preocupación de diseño**

Cómo gestionar la persistencia de datos de forma segura, relacional y eficiente, minimizando el código SQL manual propenso a errores.

---

**Orientación de la decisión**

Uso de **PostgreSQL** como motor de base de datos relacional y **Prisma ORM** como herramienta de mapeo objeto-relacional.

---

**Supuestos**

*   Los datos del sistema son altamente relacionales (Usuarios -> Roles -> Estaciones -> Tanques).
*   Se requiere soporte para transacciones atómicas.

---

**Restricciones**

*   Dependencia de la sintaxis y limitaciones del ORM Prisma.

---

**Requerimientos relacionados**

*   Consistencia de datos.
*   Generación de reportes complejos.

---

**Alternativas consideradas**

- **Alternativa 1:** MongoDB (NoSQL).
- **Alternativa 2:** PostgreSQL con SQL plano (pg-node).
- **Alternativa 3:** PostgreSQL con Prisma ORM (Seleccionada).

---

**Evaluación de alternativas**

- **Alternativa 1:** Ventaja: Flexibilidad de esquema. Desventaja: Falta de integridad referencial estricta.
- **Alternativa 2:** Ventaja: Control total del SQL. Desventaja: Desarrollo lento y difícil de mantener.
- **Alternativa 3:** Ventaja: Tipado automático, migraciones fáciles y alta productividad.

---

**Alternativa seleccionada y Justificación**

Se selecciona la **Alternativa 3: PostgreSQL + Prisma**.
Justificación: PostgreSQL ofrece la robustez necesaria para transacciones de combustible, y Prisma garantiza que el acceso a estos datos desde el código TypeScript sea seguro y coherente con el esquema definido.

---

**Decisiones relacionadas**

- ADR-008: Registro de Auditoría (implementado mediante disparadores o lógica de Prisma).

---

**Comentarios**

Se utilizará Prisma Migrate para gestionar los cambios en el esquema de la base de datos de forma controlada.
