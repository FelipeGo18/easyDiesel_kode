# Resumen de Casos de Uso - EasyDiesel

Este documento consolida los 10 casos de uso principales especificados en la Documentación de Requerimientos de Software (SRS) de la plataforma EasyDiesel.

---

## UC-01: Registrar Consumo de Combustible
**Actor:** Usuario interno (Conductor / Operario de Estación).
**Descripción:** Permite registrar el consumo de combustible asociado a un vehículo, validando datos obligatorios y aplicando reglas del Decreto 1428/2025.
**Flujo Principal:** Acceso al módulo -> Ingreso de placa y datos -> Validación (UC-05) -> Cálculo de precio y costo -> Almacenamiento -> Auditoría (UC-06).

## UC-02: Consultar Historial de Consumos
**Actor:** Usuario autenticado / Autoridad Reguladora.
**Descripción:** Permite visualizar el historial de transacciones realizadas, aplicando filtros por fecha, placa, estación o zona.
**Flujo Principal:** Acceso al módulo -> Definición de filtros -> Consulta en BD -> Visualización de resultados -> Registro en auditoría.

## UC-03: Generar Reporte de Consumos
**Actor:** Usuario administrativo / Auditor.
**Descripción:** Exportación de datos de consumo en formatos PDF o Excel para análisis externo o cumplimiento normativo.
**Dependencia:** UC-02 (Consulta de Historial).

## UC-04: Filtrar Reportes por Fecha y Vehículo
**Actor:** Sistema / Usuario administrativo.
**Descripción:** Funcionalidad específica de filtrado avanzado para generar análisis detallados por períodos de tiempo y unidades vehiculares específicas.

## UC-05: Validar Datos de Consumo
**Actor:** Sistema.
**Descripción:** Validación automática de integridad: existencia de placa, rangos de volumen permitidos, estado de la estación y conexión a BD.

## UC-06: Auditar Registro de Consumo
**Actor:** Sistema / Auditor.
**Descripción:** Registro inmutable de cada operación: usuario, fecha/hora, IP, acción realizada y resultado para garantizar la trazabilidad.

## UC-07: Administrar Estaciones de Servicio
**Actor:** Administrador del Sistema.
**Descripción:** Gestión del catálogo de estaciones: creación, edición, georreferenciación y asignación de zonas de distribución.

## UC-08: Configurar Parámetros del Sistema
**Actor:** Administrador del Sistema.
**Descripción:** Configuración de reglas de negocio: precios por zona, topes de subsidio, tipos de combustible y vigencia de decretos.

## UC-09: Gestionar Usuarios y Permisos
**Actor:** Administrador del Sistema.
**Descripción:** Control de acceso basado en roles (RBAC): creación de perfiles y asignación de permisos sobre los módulos del sistema.

## UC-10: Sincronizar Catálogo Nacional de Vehículos
**Actor:** Sistema (Tarea programada) / Administrador.
**Descripción:** Actualización del censo de vehículos permitidos para el consumo de combustible subsidiado desde fuentes oficiales.

---

**Nota:** Estos 10 casos de uso cubren la totalidad de la lógica de negocio, control administrativo y cumplimiento normativo de EasyDiesel.
