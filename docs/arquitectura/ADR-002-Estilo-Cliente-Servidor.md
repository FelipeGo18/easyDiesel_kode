# IS-00138 Métodos formales en construcción de software

## SEGUIMIENTO DECISIONES DE ARQUITECTURA/DISEÑO DE SOFTWARE

---

**Problema/Preocupación de diseño**

Cómo distribuir el procesamiento y la interfaz de usuario para permitir que múltiples estaciones de servicio accedan a la información de forma centralizada.

---

**Orientación de la decisión**

Se adopta el estilo **Cliente-Servidor**. El cliente (Frontend React) se encarga de la interacción con el usuario y el servidor (Backend Node.js) de la lógica de datos y seguridad.

---

**Supuestos**

*   La mayoría del procesamiento pesado se realizará en el servidor.
*   La comunicación se realizará a través de redes locales o internet.

---

**Restricciones**

*   El servidor debe ser capaz de manejar múltiples conexiones concurrentes sin pérdida de datos.

---

**Requerimientos relacionados**

*   Acceso remoto desde diferentes dispositivos.
*   Centralización de la base de datos de precios.

---

**Alternativas consideradas**

- **Alternativa 1:** Aplicación de escritorio con base de datos local (Peer-to-Peer).
- **Alternativa 2:** Aplicación Web Cliente-Servidor (Seleccionada).

---

**Evaluación de alternativas**

- **Alternativa 1:** Ventaja: Funciona sin internet. Desventaja: Imposible centralizar precios y auditoría.
- **Alternativa 2:** Ventaja: Datos siempre sincronizados y auditoría en tiempo real.

---

**Alternativa seleccionada y Justificación**

Se selecciona la **Alternativa 2: Cliente-Servidor**.
Justificación: Es la forma más eficiente de asegurar que todas las estaciones de servicio operen con los mismos precios vigentes y que la administración central pueda ver los niveles de inventario al instante.

---

**Decisiones relacionadas**

- ADR-006: Comunicación mediante API REST.

---

**Comentarios**

El servidor se diseña para ser "Stateless" para facilitar el escalado horizontal.
