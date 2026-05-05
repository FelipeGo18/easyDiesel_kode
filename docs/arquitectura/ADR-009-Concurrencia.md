# IS-00138 Métodos formales en construcción de software

## SEGUIMIENTO DECISIONES DE ARQUITECTURA/DISEÑO DE SOFTWARE

---

**Problema/Preocupación de diseño**

Cómo manejar la concurrencia de múltiples usuarios (varios isleros vendiendo al tiempo) sin bloquear los recursos del servidor.

---

**Orientación de la decisión**

Aprovechamiento del modelo de **E/S No Bloqueante y Event Loop** nativo de Node.js.

---

**Supuestos**

*   La mayoría de las operaciones son de entrada/salida (esperar a la base de datos).
*   Node.js gestiona eficientemente miles de conexiones simultáneas en un solo hilo.

---

**Restricciones**

*   Evitar tareas que bloqueen el hilo principal (cálculos matemáticos masivos síncronos).

---

**Requerimientos relacionados**

*   Alta disponibilidad.
*   Rendimiento bajo carga.

---

**Alternativas consideradas**

- **Alternativa 1:** Multi-threading (Java/C#).
- **Alternativa 2:** Event-Driven (Node.js) (Seleccionada).

---

**Evaluación de alternativas**

- **Alternativa 1:** Ventaja: Mejor para uso intensivo de CPU. Desventaja: Mayor consumo de memoria por cada hilo.
- **Alternativa 2:** Ventaja: Extremadamente eficiente en memoria y escalable para aplicaciones de red.

---

**Alternativa seleccionada y Justificación**

Se selecciona la **Alternativa 2: Node.js Event Loop**.
Justificación: EasyDiesel es una aplicación intensiva en I/O (comunicación con DB y Clientes). Node.js es ideal para este perfil de carga, permitiendo respuestas rápidas incluso con muchos usuarios concurrentes.

---

**Decisiones relacionadas**

- ADR-002: Estilo Cliente-Servidor.

---

**Comentarios**

Se utilizará `async/await` para mantener el código limpio y manejar la asincronía.
