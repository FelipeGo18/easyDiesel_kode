# Estándares de Codificación e Implementación
**Versión:** 1.0  
**Proyecto:** EasyDiesel  
**Fecha:** Marzo 2026

## 1. Estándares de Codificación
Para garantizar la mantenibilidad y legibilidad del código, el proyecto EasyDiesel sigue los siguientes estándares:

### 1.1 Lenguaje y Estilo
- **Lenguaje Principal:** TypeScript (v5+) para garantizar tipado estático y reducir errores en tiempo de ejecución.
- **Nomenclatura:**
    - **Variables y Funciones:** `camelCase` (ej. `obtenerPrecioActual`).
    - **Clases y Tipos:** `PascalCase` (ej. `UsuarioService`).
    - **Constantes:** `UPPER_SNAKE_CASE` (ej. `ROL_ADMIN`).
- **Formateo:** Uso obligatorio de Prettier con indentación de 4 espacios y comillas simples.

### 1.2 Arquitectura de Código (Backend)
- **Controladores:** Solo gestionan peticiones HTTP y validaciones de entrada (Zod).
- **Servicios:** Contienen la lógica de negocio pura y acceso a datos vía Prisma.
- **Validadores:** Esquemas de Zod para asegurar la integridad de los datos.

### 1.3 Arquitectura de Código (Frontend)
- **Componentes:** Funcionales con React Hooks.
- **Estado:** Context API para estado global (Auth, UI) y hooks locales.
- **Estilos:** Tailwind CSS con nombres de clases semánticos.

## 2. Estrategias para Inspección y Revisión de Código
- **Peer Review (Revisión de Pares):** Antes de fusionar cualquier funcionalidad a la rama principal, un par debe revisar el código.
- **Checklist de Inspección:**
    - [ ] ¿El código cumple con los estándares de nomenclatura?
    - [ ] ¿Se han incluido pruebas unitarias para la nueva lógica?
    - [ ] ¿Existen fugas de memoria o peticiones innecesarias?
    - [ ] ¿Se manejan correctamente las excepciones?

## 3. Estrategias para Garantizar la Calidad
- **Análisis Estático:** Uso de ESLint para detectar patrones de código problemáticos.
- **Pruebas Automatizadas:** Cobertura mínima obligatoria del 70% en servicios críticos.
- **Integración Continua:** Ejecución automática de `npm test` en cada Pull Request.
