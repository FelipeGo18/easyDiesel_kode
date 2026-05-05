# IS-00138 Métodos formales en construcción de software

## SEGUIMIENTO DECISIONES DE ARQUITECTURA/DISEÑO DE SOFTWARE

---

**Problema/Preocupación de diseño**

Cómo exponer las funcionalidades del backend al frontend y a terceros de forma estándar y comprensible.

---

**Orientación de la decisión**

Diseño y desarrollo de una **API RESTful** utilizando el estándar HTTP y formato de datos JSON.

---

**Supuestos**

*   HTTP es el protocolo universal de comunicación web.
*   JSON es ligero y fácil de procesar por el frontend de React.

---

**Restricciones**

*   Debe seguir las convenciones de nombres y verbos HTTP (GET, POST, PUT, DELETE).

---

**Requerimientos relacionados**

*   Interoperabilidad entre sistemas.
*   Consumo de servicios desde el frontend.

---

**Alternativas consideradas**

- **Alternativa 1:** GraphQL.
- **Alternativa 2:** API RESTful (Seleccionada).
- **Alternativa 3:** WebSockets (solo para tiempo real).

---

**Evaluación de alternativas**

- **Alternativa 1:** Ventaja: Flexibilidad en las consultas. Desventaja: Curva de aprendizaje y complejidad innecesaria para este proyecto.
- **Alternativa 2:** Ventaja: Simplicidad, cacheable y estándar mundial.
- **Alternativa 3:** Ventaja: Tiempo real. Desventaja: No es apto para todas las operaciones CRUD.

---

**Alternativa seleccionada y Justificación**

Se selecciona la **Alternativa 2: API REST**.
Justificación: Es la opción más madura y con mejores herramientas de prueba (Postman, Swagger). Permite una integración limpia con React y es suficiente para todos los requerimientos de EasyDiesel.

---

**Decisiones relacionadas**

- ADR-001: Arquitectura en Capas.

---

**Comentarios**

Se utilizarán códigos de estado HTTP estándar (200, 201, 400, 401, 500) para informar errores.
