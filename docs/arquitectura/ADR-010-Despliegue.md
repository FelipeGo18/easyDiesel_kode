# IS-00138 Métodos formales en construcción de software

## SEGUIMIENTO DECISIONES DE ARQUITECTURA/DISEÑO DE SOFTWARE

---

**Problema/Preocupación de diseño**

Cómo garantizar que la aplicación pueda ser desplegada y escalada en diferentes entornos (Desarrollo, Pruebas, Producción) sin cambios en el código.

---

**Orientación de la decisión**

Estrategia de **Externalización de Configuración** mediante variables de entorno (`.env`) y preparación para despliegue Cloud.

---

**Supuestos**

*   Las credenciales de base de datos y llaves de API cambian según el entorno.
*   Se busca evitar la exposición de secretos en el repositorio de código.

---

**Restricciones**

*   Necesidad de un sistema de gestión de secretos seguro en producción.

---

**Requerimientos relacionados**

*   Despliegue continuo (CI/CD).
*   Seguridad de infraestructura.

---

**Alternativas consideradas**

- **Alternativa 1:** Archivos de configuración hard-coded.
- **Alternativa 2:** Variables de entorno (Seleccionada).

---

**Evaluación de alternativas**

- **Alternativa 1:** Ventaja: Ninguna. Desventaja: Inseguro y rígido.
- **Alternativa 2:** Ventaja: Sigue los principios de "12-Factor App", seguro y flexible para la nube.

---

**Alternativa seleccionada y Justificación**

Se selecciona la **Alternativa 2: Variables de Entorno**.
Justificación: Permite que el mismo artefacto de software corra en cualquier servidor. Es la base para usar servicios Cloud como AWS, Render o Vercel, facilitando el despliegue de EasyDiesel.

---

**Decisiones relacionadas**

- ADR-004: Base de Datos (URL de conexión externa).

---

**Comentarios**

Se utiliza la librería `dotenv` en desarrollo para cargar las variables locales.
