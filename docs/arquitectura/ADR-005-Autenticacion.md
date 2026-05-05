# IS-00138 Métodos formales en construcción de software

## SEGUIMIENTO DECISIONES DE ARQUITECTURA/DISEÑO DE SOFTWARE

---

**Problema/Preocupación de diseño**

Cómo gestionar el acceso seguro a la plataforma para diferentes tipos de usuarios (Administradores, Estaciones, Distribuidores) de forma escalable.

---

**Orientación de la decisión**

Implementación de autenticación basada en **JWT (JSON Web Tokens)** y soporte multi-proveedor (Local + Google OAuth).

---

**Supuestos**

*   Los usuarios prefieren opciones de inicio de sesión rápido (Google).
*   El sistema debe ser capaz de identificar al usuario en cada petición sin consultar la base de datos constantemente.

---

**Restricciones**

*   Necesidad de gestionar de forma segura las "Secret Keys" para la firma de los tokens.

---

**Requerimientos relacionados**

*   Seguridad de la información.
*   Gestión de perfiles de usuario.

---

**Alternativas consideradas**

- **Alternativa 1:** Sesiones basadas en Cookies/Server-side.
- **Alternativa 2:** JWT (Stateless) (Seleccionada).

---

**Evaluación de alternativas**

- **Alternativa 1:** Ventaja: Fácil de invalidar sesiones. Desventaja: Difícil de escalar horizontalmente.
- **Alternativa 2:** Ventaja: Escalabilidad total y compatibilidad con múltiples clientes (Web, Móvil). Desventaja: Complejidad en la invalidación de tokens.

---

**Alternativa seleccionada y Justificación**

Se selecciona la **Alternativa 2: JWT**.
Justificación: Permite que el servidor sea más eficiente al no tener que almacenar sesiones en memoria, y facilita la integración futura con otros servicios o aplicaciones móviles de EasyDiesel.

---

**Decisiones relacionadas**

- ADR-002: Estilo Cliente-Servidor.

---

**Comentarios**

Se utilizarán Refresh Tokens para mejorar la experiencia de usuario y la seguridad.
