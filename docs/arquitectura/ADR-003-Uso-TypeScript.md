# IS-00138 Métodos formales en construcción de software

## SEGUIMIENTO DECISIONES DE ARQUITECTURA/DISEÑO DE SOFTWARE

---

**Problema/Preocupación de diseño**

Cómo reducir los errores de programación relacionados con tipos de datos incorrectos en un sistema que maneja transacciones financieras y de inventario.

---

**Orientación de la decisión**

Adopción de **TypeScript** como lenguaje principal tanto en el Frontend como en el Backend del proyecto.

---

**Supuestos**

*   El equipo tiene conocimientos en JavaScript/TypeScript.
*   El uso de tipos mejorará la autocompletación y la documentación del código.

---

**Restricciones**

*   Requiere un paso de compilación adicional (transpiling) antes de la ejecución.

---

**Requerimientos relacionados**

*   Integridad de los datos transaccionales.
*   Documentación técnica del código fuente.

---

**Alternativas consideradas**

- **Alternativa 1:** JavaScript puro (ES6+).
- **Alternativa 2:** TypeScript (Seleccionada).

---

**Evaluación de alternativas**

- **Alternativa 1:** Ventaja: Mayor rapidez de desarrollo inicial. Desventaja: Errores en tiempo de ejecución difíciles de detectar.
- **Alternativa 2:** Ventaja: Detección de errores en tiempo de compilación y mejor mantenibilidad.

---

**Alternativa seleccionada y Justificación**

Se selecciona la **Alternativa 2: TypeScript**.
Justificación: La seguridad que aporta TypeScript es fundamental para un sistema donde un error de tipo (ej. tratar un precio como string) podría causar pérdidas financieras o descuadres en el inventario de combustible.

---

**Decisiones relacionadas**

- ADR-004: Motor PostgreSQL y ORM Prisma (que aprovecha TS).

---

**Comentarios**

Se configurará un nivel de "strict" alto en el `tsconfig.json` para maximizar los beneficios.
