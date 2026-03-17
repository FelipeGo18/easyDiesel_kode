# Planeación y Asignación de Tareas
**Versión:** 1.0  
**Proyecto:** EasyDiesel  
**Fecha:** Marzo 2026

## 1. Planeación de la Implementación
La implementación del sistema EasyDiesel se divide en fases secuenciales basadas en el ciclo de vida del TSP (Team Software Process).

### 1.1 Fases y Tareas Principales
| Fase | Tarea Principal | Descripción | Entregable |
|------|-----------------|-------------|------------|
| Iniciación | Definición de Requerimientos | Captura y análisis de necesidades del usuario y regulatorias. | SRS.md |
| Estrategia | Diseño de Arquitectura | Selección de tecnologías y definición de patrones. | SDS.md |
| Diseño | Diseño Detallado | Diagramas de clases, esquemas de BD y flujos. | Modelos de Datos |
| Desarrollo | Construcción de Módulos | Codificación del frontend y backend por componentes. | Código Fuente |
| Pruebas | Pruebas Unitarias e Integración | Validación de lógica y comunicación entre servicios. | Reporte Cobertura |
| Cierre | Pruebas de Aceptación | Validación final con el usuario y cierre del proyecto. | Acta de Cierre |

## 2. Asignación de Tareas por Rol
| Rol | Responsable Principal | Tareas Asignadas |
|-----|----------------------|------------------|
| **Líder de Equipo** | Haider Gómez | Coordinación general, comunicación con stakeholders y aprobación de planes. |
| **Líder de Desarrollo** | Haider Gómez | Arquitectura técnica, revisión de código y gestión de base de datos (Prisma). |
| **Líder de Calidad** | Haider Gómez | Definición de métricas, seguimiento de cobertura (70%+) e inspecciones. |
| **Líder de Planeación** | Haider Gómez | Estimación de tiempos (TASK/SCHEDULE) y seguimiento de hitos. |
| **Líder de Soporte/Pruebas**| Haider Gómez | Diseño de casos de prueba y ejecución de pruebas unitarias/integración. |

## 3. Plan de Tareas del Ciclo Actual
Para el ciclo de desarrollo en curso (Marzo 2026), se han asignado las siguientes tareas prioritarias:
1. **Implementación de Auditoría de Estación:** Filtrado de logs por estación asignada (Seguridad).
2. **Motor de Precios:** Actualización del subsidio ACPM ($2.350) según Decreto 1428.
3. **Optimización de Reportes:** Generación de PDF en modo horizontal para mayor legibilidad.
4. **Validación de Login:** Alertas de SweetAlert2 para errores de autenticación.
5. **Cobertura de Código:** Alcanzar el umbral del 70% en servicios críticos (Decretos, Precios, Auth).
