# Log de Defectos e Inspección de Diseño
**Versión:** 1.0  
**Proyecto:** EasyDiesel  
**Fecha:** Marzo 2026

## 1. Inspección de Diseño Detallado
La inspección de diseño es una actividad crítica para asegurar que la arquitectura de 3 capas se respete antes de comenzar la codificación masiva.

### 1.1 Resumen de Revisión de Diseño
- **Fecha de Revisión:** 10 de Marzo 2026
- **Participantes:** Equipo de Desarrollo (Haider Gómez)
- **Conclusión:** El diseño de modelos Prisma es consistente con el SRS, pero se identificó la necesidad de añadir una relación explícita entre `Usuario` y `EstacionServicio` para soportar la auditoría por sede.

## 2. Log de Defectos
Registro sistemático de errores encontrados durante las fases de revisión, inspección y pruebas unitarias.

### 2.1 Histórico de Defectos Detectados
| ID | Fecha | Tipo de Defecto | Descripción | Fase Detección | Tiempo Corrección (min) |
|----|-------|-----------------|-------------|----------------|-------------------------|
| D01 | 12/03 | Lógica (Logic) | Falta validación de capacidad de tanque en `registrarEntrega`. | Pruebas Unitarias | 15 |
| D02 | 12/03 | Sintaxis (Syntax) | Error `Cannot find name 'prisma'` en `reporte.controller.ts`. | Compilación | 5 |
| D03 | 12/03 | Interfaz (UI) | Alerta de error de login no se muestra (interceptor Axios). | Pruebas de Sistema | 30 |
| D04 | 13/03 | Lógica (Hooks) | Error `Rendered fewer hooks than expected` en `LoginPage`. | Ejecución (React) | 10 |
| D05 | 13/03 | Seguridad (Access) | Rol Estación veía auditoría de todas las estaciones. | Inspección de Código | 45 |
| D06 | 13/03 | Datos (ORM) | Argumento `estacionGestionadaId` desconocido en query Prisma. | Pruebas de Integración | 20 |

### 2.2 Tipos de Defectos (Glosario TSP)
- **Syntax:** Errores de tipado, importaciones o reglas de lenguaje.
- **Logic:** Errores en algoritmos, validaciones de negocio o flujos de control.
- **Interface:** Errores en la comunicación entre componentes o con servicios externos.
- **Data:** Errores en el modelado, persistencia o manipulación de datos.
- **Security:** Fallos en el control de acceso, permisos o protección de información.

## 3. Seguimiento de Remoción (Yield)
- **Defectos Inyectados (Acumulado):** 6
- **Defectos Removidos antes de Producción:** 6
- **Yield de Fase (Pruebas Unitarias/Inspección):** 100%
