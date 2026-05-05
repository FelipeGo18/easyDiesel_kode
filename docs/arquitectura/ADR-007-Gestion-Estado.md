# IS-00138 Métodos formales en construcción de software

## SEGUIMIENTO DECISIONES DE ARQUITECTURA/DISEÑO DE SOFTWARE

---

**Problema/Preocupación de diseño**

Cómo manejar los datos globales de la aplicación (usuario autenticado, estación actual, tema) en el frontend sin complicar la estructura de componentes.

---

**Orientación de la decisión**

Uso de **React Context API** junto con **Custom Hooks** para la gestión del estado global.

---

**Supuestos**

*   El estado global no es extremadamente complejo (no requiere Redux).
*   Se prioriza la legibilidad del código y la facilidad de mantenimiento.

---

**Restricciones**

*   Evitar re-renders innecesarios en componentes grandes.

---

**Requerimientos relacionados**

*   Experiencia de usuario fluida (SPA).
*   Persistencia de sesión en el navegador.

---

**Alternativas consideradas**

- **Alternativa 1:** Redux / Toolkit.
- **Alternativa 2:** Context API (Seleccionada).
- **Alternativa 3:** Pasar datos por props (Prop Drilling).

---

**Evaluación de alternativas**

- **Alternativa 1:** Ventaja: Excelente para estados masivos. Desventaja: Mucho código "boilerplate".
- **Alternativa 2:** Ventaja: Nativo de React, ligero y suficiente para la escala de EasyDiesel.
- **Alternativa 3:** Ventaja: Sin librerías extra. Desventaja: Código sucio y difícil de seguir.

---

**Alternativa seleccionada y Justificación**

Se selecciona la **Alternativa 2: Context API**.
Justificación: Para EasyDiesel, Context API proporciona el equilibrio perfecto entre potencia y simplicidad, permitiendo que componentes como el Navbar o los Dashboards accedan a la info del usuario sin complicaciones.

---

**Decisiones relacionadas**

- ADR-005: Autenticacion (El token se guarda en el contexto).

---

**Comentarios**

Se utilizarán hooks especializados como `useAuth` o `useInventario` para encapsular la lógica.
