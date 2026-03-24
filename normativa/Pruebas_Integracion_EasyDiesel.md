# Plan de Pruebas de Integración — EasyDiesel

**Proyecto:** EasyDiesel  
**Versión:** 2.0  
**Fecha de elaboración:** Marzo 2026  
**Supervisor:** Prof. Gilberto Pedraza García — Equipo Kode Group (Grupo 3)

---

## 2.1 Plan de Pruebas de Integración

### 2.1.1 Estrategia

Se utilizará una estrategia de integración incremental de tipo **bottom-up**, iniciando por los módulos base (UC-05: Validar Datos de Consumo y UC-06: Auditar Registro de Consumo) y avanzando hacia los módulos funcionales de mayor nivel (UC-01: Registrar Consumo de Combustible).

Los 10 casos de integración (CPI-001 a CPI-010) verifican que los flujos de datos entre componentes cumplan con las reglas de negocio definidas en el Decreto 1428/2025 y con la especificación de requerimientos `DT_Req_01_EspecificacionRequerimientos`. Se aplicará cobertura de casos positivos, negativos y casos límite para cada punto de integración entre los siguientes pares de casos de uso:

- UC-01 ↔ UC-05
- UC-01 ↔ UC-06
- UC-01 ↔ UC-07
- UC-02 ↔ UC-09
- UC-03 ↔ UC-01
- UC-05 ↔ UC-06
- UC-08 ↔ UC-01
- UC-09 ↔ UC-07

---

### 2.1.2 Recursos

**Humanos:** Equipo Kode Group (Grupo 3) — Ingenieros de prueba asignados a los módulos de Registro de Consumo, Validación y Auditoría. Supervisor: Prof. Gilberto Pedraza García.

**Hardware:** Servidor de integración continua (mínimo 8 GB RAM, procesador de 4 núcleos); estaciones de trabajo para ejecución de pruebas locales.

**Software:** Plataforma EasyDiesel (React/Vite/TypeScript + Node.js/Express + PostgreSQL/Prisma); herramienta de pruebas Jest + Supertest; cliente REST Postman; base de datos de prueba aislada.

---

### 2.1.3 Ambiente

Entorno de integración continua (CI) sobre servidor local o nube privada. Base de datos PostgreSQL de prueba con datos sintéticos que simulan:

- Catálogo nacional de placas
- Estaciones de servicio activas e inactivas
- Registros históricos de consumo

El backend Node.js/Express se despliega en modo test con variables de entorno aisladas (`.env.test`). Las pruebas se ejecutan de forma automatizada mediante **Jest + Supertest**. No se utiliza el entorno de producción bajo ningún caso.

---

### 2.1.4 Diseño de Casos de Prueba

---

#### CPI-001 — UC-01 con UC-05: Registro de Consumo con Validación Exitosa

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que UC-01 (Registrar Consumo) invoca correctamente UC-05 (Validar Datos) y que el resultado de la validación exitosa permite guardar el registro. |
| **Pre-requisitos** | Placa válida registrada en el catálogo. Estación activa. Usuario autenticado con permisos de registro. |
| **Estado esperado al finalizar** | APROBADO / RECHAZADO |

**Pasos:**

| Paso | Acción del usuario | Respuesta esperada del sistema |
|------|-------------------|-------------------------------|
| 1 | Usuario completa el formulario con placa válida, combustible ACPM, volumen 50 L, estación activa. | El sistema carga la estación en el formulario. |
| 2 | Usuario presiona Guardar. UC-01 invoca UC-05 para validar los datos. | UC-05 retorna VÁLIDO. El sistema permite continuar el registro. |
| 3 | UC-01 almacena el registro en la base de datos con estado Confirmado. | Registro guardado con ID único. Sin errores. |
| 4 | Administrador consulta el log de auditoría para el registro recién creado. | El log muestra la entrada completa. Todos los atributos de trazabilidad presentes. Sin entrada duplicada. |

**Observaciones:** Verificar que el log NO se crea si UC-05 rechaza el registro. La integridad del log debe mantenerse en todos los escenarios.

---

#### CPI-002 — UC-01 con UC-05: Registro con Placa Inexistente

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que UC-01 rechaza el registro cuando UC-05 no encuentra la placa en el catálogo. |
| **Pre-requisitos** | Placa no registrada en el catálogo nacional. Estación activa. Usuario autenticado. |

**Pasos:**

| Paso | Acción del usuario | Respuesta esperada del sistema |
|------|-------------------|-------------------------------|
| 1 | Usuario ingresa placa inexistente (ej. XXX999) y completa los demás campos. | El sistema carga la estación en el formulario. |
| 2 | Usuario presiona Guardar. UC-01 invoca UC-05. | UC-05 retorna INVÁLIDO: placa no encontrada. El sistema muestra mensaje de error y bloquea el guardado. |

**Observaciones:** Verificar que no se crea ninguna entrada en auditoría cuando el registro es rechazado por placa no encontrada.

---

#### CPI-003 — UC-01 con UC-05: Registro con Volumen Fuera de Rango

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que UC-05 rechaza volúmenes fuera del rango permitido (< 1 L o > 500 L) y que UC-01 no procede con el guardado. |
| **Pre-requisitos** | Placa válida. Estación activa. Usuario autenticado. |

**Pasos:**

| Paso | Acción del usuario | Respuesta esperada del sistema |
|------|-------------------|-------------------------------|
| 1 | Usuario ingresa placa válida, combustible ACPM, **volumen 600 L** (fuera de rango). | El sistema carga los datos en el formulario. |
| 2 | Usuario presiona Guardar. UC-01 invoca UC-05. | UC-05 retorna INVÁLIDO: `VOLUMEN_FUERA_RANGO`. El sistema muestra error y no guarda el registro. |

**Observaciones:** Probar también el límite inferior (0 L o valor negativo). El mensaje de error debe ser claro para el usuario.

---

#### CPI-004 — UC-01 con UC-06: Auditoría Tras Registro Exitoso

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que después de un registro exitoso en UC-01, UC-06 genera automáticamente la entrada de auditoría con todos los atributos de trazabilidad. |
| **Pre-requisitos** | Placa válida. Estación activa. Usuario autenticado. Sistema en entorno de prueba con módulo de auditoría activo. |

**Pasos:**

| Paso | Acción del usuario | Respuesta esperada del sistema |
|------|-------------------|-------------------------------|
| 1 | Se ejecuta UC-01 con datos válidos (placa correcta, volumen en rango). | UC-05 retorna VÁLIDO. UC-06 registra: fecha, hora, usuario, ID registro, resultado = VALIDADO. |
| 2 | Se ejecuta UC-01 con placa inválida. | UC-05 retorna INVÁLIDO. UC-06 registra: fecha, hora, usuario, motivo = `PLACA_NO_ENCONTRADA`, resultado = RECHAZADO. |
| 3 | Se ejecuta UC-01 con volumen fuera de rango. | UC-06 registra entrada con motivo = `VOLUMEN_FUERA_RANGO`, resultado = RECHAZADO. |
| 4 | Administrador consulta el log de auditoría. | Todas las entradas generadas en pasos 1–3 son visibles, completas y en orden cronológico. |

**Observaciones:** Verificar que las entradas de auditoría no son modificables una vez creadas. La integridad del log debe estar garantizada.

---

#### CPI-005 — UC-01 con UC-07: Validación de Estación Activa en Registro

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que UC-01 consulta el catálogo de estaciones gestionado por UC-07 y rechaza registros cuando la estación tiene estado Inactivo. |
| **Pre-requisitos** | Estación EST-99 en estado Inactivo en la BD de prueba. Placa válida. Usuario autenticado con permisos de registro. Administrador con acceso al módulo UC-07. |

**Pasos:**

| Paso | Acción del usuario | Respuesta esperada del sistema |
|------|-------------------|-------------------------------|
| 1 | Usuario selecciona estación EST-99 (inactiva) en el formulario y completa los demás campos. | El sistema carga la estación en el formulario. |
| 2 | Usuario presiona Guardar. UC-01 consulta el estado de la estación en el catálogo (UC-07). | Sistema detecta que EST-99 tiene estado Inactivo. Notifica al usuario y no permite continuar el registro. |
| 3 | Administrador activa la estación EST-99 mediante UC-07. | Estado de EST-99 actualizado a Activo en el catálogo. Cambio visible inmediatamente. |
| 4 | Usuario repite el registro seleccionando EST-99 (ahora activa). | El registro se procesa exitosamente. Registro almacenado con estado Confirmado. |

**Observaciones:** Verificar que los cambios realizados en UC-07 son visibles de inmediato para UC-01 (consistencia de catálogo en tiempo real).

---

#### CPI-006 — UC-02 con UC-09: Control de Acceso por Roles en Historial de Consumos

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que UC-02 (Consultar Historial) aplica el control de acceso por roles definido en UC-09, limitando los registros visibles según el rol del usuario autenticado. |
| **Pre-requisitos** | Usuarios de prueba: Conductor (U001), Administrador (ADM01), Autoridad Reguladora (REG01). Registros de consumo de múltiples vehículos/usuarios en BD de prueba. Módulo de control de acceso (UC-09) activo. |

**Pasos:**

| Paso | Acción del usuario | Respuesta esperada del sistema |
|------|-------------------|-------------------------------|
| 1 | Conductor (U001) inicia sesión y accede al módulo Historial de Consumos. | UC-09 valida sesión y rol Conductor. UC-02 muestra solo registros asociados a U001. |
| 2 | Conductor intenta acceder a registros de otro usuario vía manipulación de parámetros. | El sistema rechaza la solicitud. Mensaje: "No tiene autorización para visualizar estos registros." |
| 3 | Administrador (ADM01) accede al historial. | UC-02 muestra todos los registros del sistema sin restricción de usuario. |
| 4 | Autoridad Reguladora (REG01) accede al historial. | UC-02 muestra todos los registros y añade columna "Aplicación de subsidio/precio diferencial". |

**Observaciones:** Prueba crítica de seguridad. Verificar que no hay fuga de información entre roles. Ningún conductor debe ver datos de otro conductor.

---

#### CPI-007 — UC-03 con UC-01: Coherencia de Datos en Generación de Reportes

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que UC-03 (Generar Reporte) refleja exactamente los datos almacenados por UC-01, sin omisiones ni inclusiones incorrectas, y que los totales calculados son correctos. |
| **Pre-requisitos** | 10 registros de consumo previamente almacenados por UC-01 en el período 01/03/2025 – 31/03/2025. Suma total conocida: 1.250 litros, $6.250.000 COP. Usuario con permisos de generación de reportes autenticado. |

**Pasos:**

| Paso | Acción del usuario | Respuesta esperada del sistema |
|------|-------------------|-------------------------------|
| 1 | Usuario accede al módulo de reportes y define período: 01/03/2025 – 31/03/2025. | Sistema acepta el rango de fechas. |
| 2 | Usuario presiona Generar Reporte. | UC-03 consulta BD con los filtros definidos y procesa la información. |
| 3 | Sistema muestra el reporte generado. | Reporte contiene exactamente 10 registros. Total volumen: 1.250 L. Total costo: $6.250.000 COP. |
| 4 | Usuario exporta el reporte a PDF. | Archivo PDF generado sin errores. Datos del PDF coinciden con los visualizados en pantalla. |

**Observaciones:** Verificar que el reporte registra la operación en el log de auditoría. Tiempo de generación máximo: 3 segundos bajo carga normal.

---

#### CPI-008 — UC-05 con UC-06: Auditoría de Operaciones de Validación

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que UC-05 (Validar Datos de Consumo) genera correctamente entradas en UC-06 tanto para validaciones exitosas como para rechazos, con todos los atributos de trazabilidad. |
| **Pre-requisitos** | Sistema en entorno de prueba con módulo de auditoría activo. Administrador autenticado con permisos de consulta de auditoría. |

**Pasos:**

| Paso | Acción del usuario | Respuesta esperada del sistema |
|------|-------------------|-------------------------------|
| 1 | Se ejecuta UC-05 con datos válidos (placa correcta, volumen en rango). | UC-05 retorna VÁLIDO. UC-06 registra: fecha, hora, usuario, ID registro, resultado = VALIDADO. |
| 2 | Se ejecuta UC-05 con placa inválida. | UC-05 retorna INVÁLIDO. UC-06 registra: fecha, hora, usuario, motivo = `PLACA_NO_ENCONTRADA`, resultado = RECHAZADO. |
| 3 | Se ejecuta UC-05 con volumen fuera de rango. | UC-06 registra entrada con motivo = `VOLUMEN_FUERA_RANGO`, resultado = RECHAZADO. |
| 4 | Administrador consulta el log de auditoría. | Todas las entradas de pasos 1–3 son visibles, completas y en orden cronológico. |

**Observaciones:** Verificar que las entradas de auditoría no son modificables una vez creadas.

---

#### CPI-009 — UC-08 con UC-01: Aplicación de Parámetros Configurados en Registro

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que los parámetros configurados por UC-08 (precios, umbrales) son utilizados correctamente por UC-01 al procesar un nuevo registro de consumo, y que los cambios de configuración se aplican de forma inmediata. |
| **Pre-requisitos** | Administrador con rol Superadministrador ha configurado: precio diferencial vehículo particular zona Bogotá = $9.800/galón. Vehículo particular (placa PAR001). Estación en zona Bogotá activa. |

**Pasos:**

| Paso | Acción del usuario | Respuesta esperada del sistema |
|------|-------------------|-------------------------------|
| 1 | Administrador accede a UC-08 y verifica precio configurado: $9.800/galón para zona Bogotá, vehículo particular. | Configuración persistida correctamente en BD de parámetros. |
| 2 | Usuario registra consumo: placa PAR001, ACPM, 40 galones, estación Bogotá. | UC-01 consulta motor de reglas con parámetros de UC-08. Costo calculado = 40 × $9.800 = **$392.000**. |
| 3 | Administrador modifica precio en UC-08 a $10.200/galón para zona Bogotá particular. | Cambio persistido. Registro de la modificación en log de auditoría. |
| 4 | Usuario registra nuevo consumo con mismos parámetros. | Nuevo costo = 40 × $10.200 = **$408.000**. El cambio de configuración se aplica de forma inmediata. |

**Observaciones:** Verificar que los cambios en UC-08 no afectan registros históricos ya almacenados. Solo los nuevos registros usan el precio actualizado.

---

#### CPI-010 — UC-09 con UC-07: Verificación de Permisos de Administración de Estaciones

| Campo | Detalle |
|-------|---------|
| **Objetivo** | Verificar que UC-07 (Administrar Estaciones) verifica correctamente los permisos de rol a través de UC-09, permitiendo accesos solo a usuarios con rol Administrador del Sistema. |
| **Pre-requisitos** | Usuario con control Conductor (U-COND01) autenticado. Usuario con control Administrador (U-ADM01) autenticado. Módulo de gestión de estaciones activo. |

**Pasos:**

| Paso | Acción del usuario | Respuesta esperada del sistema |
|------|-------------------|-------------------------------|
| 1 | Conductor (U-COND01) intenta acceder al módulo Gestión de Estaciones (UC-07). | UC-09 valida el rol. El sistema bloquea el acceso. Mensaje: "No tiene autorización para acceder a este módulo." |
| 2 | Administrador (U-ADM01) accede al módulo Gestión de Estaciones. | UC-09 valida rol Administrador. Sistema muestra lista de estaciones con opciones crear/editar/eliminar. |
| 3 | Administrador crea una nueva estación con datos válidos. | Estación creada exitosamente. Cambios visibles inmediatamente para todos los módulos del sistema. |
| 4 | Administrador intenta crear segunda estación con la misma ubicación. | Sistema rechaza la operación. Mensaje: "Ya existe una estación registrada en esta ubicación." |

**Observaciones:** Confirmar que el control de acceso es consistente entre UC-09 y todos los módulos administrativos. No debe existir escalada de privilegios.

---

### 2.1.5 Asignación de Responsabilidad de la Ejecución de Prueba

| Caso de prueba | Responsable de ejecución |
|----------------|--------------------------|
| CPI-001 – UC-01 con UC-05 (Registro con validación exitosa) | Andrés González |
| CPI-002 – UC-01 con UC-05 (Placa inexistente) | Andrés González |
| CPI-003 – UC-01 con UC-05 (Volumen fuera de rango) | Andrés Espinoza |
| CPI-004 – UC-01 con UC-06 (Auditoría tras registro) | Andrés Espinoza |
| CPI-005 – UC-01 con UC-07 (Estación inactiva) | Haider Cañon |
| CPI-006 – UC-02 con UC-09 (Control acceso historial) | Haider Cañon |
| CPI-007 – UC-03 con UC-01 (Coherencia de reportes) | Julián Ruiz |
| CPI-008 – UC-05 con UC-06 (Auditoría de validaciones) | Julián Ruiz |
| CPI-009 – UC-08 con UC-01 (Parámetros en registro) | Lina Castro |
| CPI-010 – UC-09 con UC-07 (Permisos administración) | Lina Castro |

---

**Documento:** Pruebas de Integración EasyDiesel  
**Actividad padre:** Plan de Pruebas — Módulo de Integración  
**Fecha:** Marzo 2026
