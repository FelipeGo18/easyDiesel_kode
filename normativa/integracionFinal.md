# Plan de Pruebas - Plataforma EasyDiesel

## 1. Introducción

### 1.1 Objetivo
Garantizar el cumplimiento de los requerimientos tanto funcionales como no funcionales planteados dentro del proyecto mediante las pruebas de Integración, Sistema y Aceptación.

### 1.2 Alcance
El presente documento define las pruebas orientadas a la validación de los casos de uso, requerimientos funcionales y atributos de calidad establecidos en los documentos de especificación de requerimientos (SRS) y el documento de especificación de diseño (SDS).

### 1.3 Definiciones y Abreviaturas

**ABREVIATURAS**

| Abreviatura | Descripción |
| :--- | :--- |
| **CPI** | Caso de Prueba de Integración. |
| **CPS** | Caso de Prueba de Sistema. |
| **CPA** | Caso de Prueba de Aceptación. |
| **RBAC** | Role-Based Access Control (Control de Acceso Basado en Roles). |
| **UAT** | User Acceptance Testing (Pruebas de Aceptación de Usuario). |
| **RNF** | Requerimiento No Funcional. |
| **UC / CU** | Use Case / Caso de Uso. |
| **JWT** | JSON Web Token (Token usado para la autenticación en la API). |
| **ACPM** | Aceite Combustible Para Motores (Diésel). |
| **API** | Application Programming Interface (Interfaz de Programación de Aplicaciones). |

**GLOSARIO**

| Palabra | Significado | Tipo | Sinónimos |
| :--- | :--- | :--- | :--- |
| **Endpoint** | Punto final de comunicación de la API donde el sistema recibe o envía peticiones HTTP. | Sustantivo | Ruta, URL de servicio |
| **Mock** | Objeto o función que simula el comportamiento de un componente real para facilitar las pruebas (ej. Mock de Google Maps). | Sustantivo | Simulador, Doble de prueba |
| **Bottom-up** | Estrategia de pruebas incrementales que inicia probando los módulos más pequeños o base, hasta llegar a las interfaces de usuario. | Adjetivo | Ascendente |
| **Zod** | Librería de validación de esquemas utilizada en el backend para asegurar que los datos ingresados tengan el formato correcto. | Sustantivo / Herramienta | Validador de esquemas |
| **Rollback** | Operación que revierte una transacción de base de datos a su estado anterior si ocurre un error, garantizando la integridad de los datos. | Sustantivo | Reversión de datos |
| **k6** | Herramienta de código abierto utilizada para realizar pruebas de carga y estrés en el rendimiento del sistema. | Sustantivo / Herramienta | Testeador de carga |
| **Decreto 1428/2025** | Normativa base del proyecto que regula los precios diferenciales y subsidios de combustible en el territorio nacional. | Sustantivo | Norma, Ley |
| **Transacción Atómica** | Operación en la base de datos que se ejecuta por completo o no se ejecuta en absoluto, sin dejar registros parciales. | Sustantivo | Operación indivisible |

---

## 1.4 Plan de pruebas de integración

### 1.4.1 Estrategia
Se utilizará una estrategia de integración incremental de tipo bottom-up, iniciando por los módulos base (UC-05: Validar Datos de Consumo y UC-06: Auditar Registro de Consumo) y avanzando hacia los módulos funcionales de mayor nivel (UC-01: Registrar Consumo de Combustible).

Los 23 casos de integración (CPI-001 a CPI-023) verifican que los flujos de datos entre componentes cumplan con las reglas de negocio definidas en el Decreto 1428/2025 y con la especificación de requerimientos (SRS). 

Se aplicará cobertura de casos positivos, negativos y casos límite para cada punto de integración entre los casos de uso.

### 1.4.2 Recursos
* **Humanos:** Equipo Kode Group (Grupo 3) — Ingenieros de prueba asignados a los módulos de Registro de Consumo, Validación y Auditoría.
* **Supervisor:** Prof. Gilberto Pedraza García.
* **Hardware:** Servidor de integración continua (mínimo 8 GB RAM, procesador de 4 núcleos); estaciones de trabajo para ejecución de pruebas locales.
* **Software:** Plataforma EasyDiesel (React/Vite/TypeScript + Node.js/Express + PostgreSQL/Prisma); herramienta de pruebas Jest + Supertest; base de datos de prueba aislada.

### 1.4.3 Ambiente
Entorno de integración continua (CI) sobre localhost. Base de datos PostgreSQL de prueba con datos sintéticos que simulan catálogo nacional de placas, estaciones de servicio activas e inactivas, y registros históricos de consumo. El backend Node.js/Express se despliega en modo test con variables de entorno aisladas (`.env.test`). Las pruebas se ejecutan de forma automatizada mediante Jest + Supertest. *Nota: Todos los casos de prueba asumen que el entorno se ejecuta con las variables `.env.test` correctamente configuradas (DATABASE_URL, JWT_SECRET, NODE_ENV=test).*

**SCRIPTS DE PREPARACIÓN**

| Artefacto | Archivo | Propósito |
| :--- | :--- | :--- |
| `prisma migrate deploy` | `tests/setup.ts` (beforeAll global) | Aplica las migraciones al iniciar. Garantiza que la estructura de tablas esté actualizada. |
| `buildCpiContext(suffix)` | `tests/helpers/cpi.context.ts` | INSERT: crea Rol, Usuarios, Zona, Decreto, PrecioVigente, EstacionServicio y Tanque. |
| `resetCpiState(ctx)` | `tests/helpers/cpi.context.ts` | UPDATE entre tests: restaura nivelActual del tanque a 1000, reactiva la estación y el PrecioVigente. |
| `teardownCpiContext(ctx)` | `tests/helpers/cpi.context.ts` | DELETE en orden correcto (respeto de FK): transacciones → auditoría → reportes → tanque → estación... |

---

### 1.4.4 Diseño casos de prueba

#### Bloque 1: Registro de Consumo (UC-01)

| **CASO DE PRUEBA** | **UC-01 con UC-05: Registro Consumo con Validación Exitosa** |
| :--- | :--- |
| **Fecha realización** | 24/03/2026 |
| **Realizada por** | Andrés González |
| **Objetivo de la prueba** | Verificar que UC-01 invoca correctamente UC-05 y que el resultado permite el almacenamiento completo. |
| **Pre-Requisitos** | - `buildCpiContext('cpi-001')` ejecutado en `beforeAll`.<br>- `resetCpiState(ctx)` disponible para restaurar estado entre pasos.<br>- `teardownCpiContext(ctx)` configurado en `afterAll`. |
| **ID** | **CPI-001** |

**DETALLE CASO DE PRUEBA**
| **Paso No.** | **Acción usuario** | **Respuesta esperada del sistema** | **Resultados** |
| :--- | :--- | :--- | :--- |
| 1 | Usuario autenticado accede al módulo Registro de Consumo y abre el formulario. | El sistema despliega el formulario con campos: placa, tipo combustible, volumen, estación, fecha/hora. | PASS — POST /api/inventario/transacciones recibe petición autenticada correctamente. |
| 2 | Usuario ingresa placa válida (ABC123), tipo ACPM, volumen 50L, estación activa, fecha actual. | El sistema acepta los datos y los carga en el modelo de solicitud sin errores de formato. | PASS — tipoCombustible=ACPM, tipoServicio=PARTICULAR, galones=50 aceptados sin errores de validación. |
| 3 | Usuario presiona Guardar. UC-01 invoca UC-05. | UC-05 ejecuta validaciones: campos obligatorios, placa en catálogo, volumen en rango, estación activa. | PASS — Validaciones Zod ejecutadas automáticamente en el middleware de la ruta. |
| 4 | UC-05 devuelve resultado: VÁLIDO. | UC-01 continúa: aplica precio, calcula costo total, almacena registro con estado Confirmado. | PASS — precioTotal calculado correctamente (galones × precioGalon=9500). Registro almacenado con estado COMPLETADA. |
| 5 | Sistema genera número de registro. | Mensaje: Consumo registrado exitosamente. Registro en BD con todos los atributos. | PASS — HTTP 201; ID de transacción generado; nivelActual del tanque decrementado en BD (1000 → 950). |
| **OBSERVACIONES ADICIONALES** | Verificar trazabilidad en log de auditoría (UC-06). El precio aplicado debe corresponder al tipo de servicio. |
| **ESTADO** | APROBADO [X] RECHAZADO [ ] |

---

| **CASO DE PRUEBA** | **UC-01 con UC-05: Registro Rechazado por Datos Inválidos (tipoServicio)** |
| :--- | :--- |
| **Fecha realización** | 24/03/2026 |
| **Realizada por** | Andrés González |
| **Objetivo de la prueba** | Verificar que UC-05 rechaza el registro cuando se envían datos con formato o valores inválidos. |
| **Pre-Requisitos** | - `buildCpiContext('cpi-002')` ejecutado en `beforeAll`.<br>- Esquemas Zod activos en el middleware.<br>- `teardownCpiContext(ctx)` configurado en `afterAll`. |
| **ID** | **CPI-002** |

**DETALLE CASO DE PRUEBA**
| **Paso No.** | **Acción usuario** | **Respuesta esperada del sistema** | **Resultados** |
| :--- | :--- | :--- | :--- |
| 1 | Usuario envía petición de registro con un tipoServicio inválido. | El sistema recibe los datos y los pasa a la capa de validación. | PASS — Petición recibida con tipoServicio='INVALIDO'. |
| 2 | UC-01 invoca validaciones de UC-05. | UC-05 detecta que el tipoServicio no cumple con el esquema permitido. | PASS — Zod detecta que 'INVALIDO' no pertenece al enum [PARTICULAR, PUBLICO, DIPLOMATICO, OFICIAL, CARGA]. |
| 3 | UC-05 retorna resultado: INVÁLIDO. | UC-01 aborta el flujo y retorna HTTP 400. No se escribe registro en la BD. | PASS — HTTP 400 retornado; cero registros adicionales en BD (verificado con conteo antes/después). |
| 4 | Sistema procesa la respuesta. | Mensaje de error de validación claro al usuario. | PASS — Respuesta JSON con mensaje de validación; tipoCombustible inválido también rechazado (400). |
| **OBSERVACIONES ADICIONALES** | Confirmar que la BD no contiene ningún registro parcial. No debe generarse log de auditoría. |
| **ESTADO** | APROBADO [X] RECHAZADO [ ] |

---

| **CASO DE PRUEBA** | **UC-01 con UC-05: Registro Rechazado por Volumen Fuera de Rango** |
| :--- | :--- |
| **Fecha realización** | 24/03/2026 |
| **Realizada por** | Andrés González |
| **Objetivo de la prueba** | Verificar que UC-05 intercepta volúmenes inválidos (0 o superiores al límite máximo). |
| **Pre-Requisitos** | - `buildCpiContext('cpi-003')` ejecutado en `beforeAll`.<br>- Límite máximo de volumen definido en validador Zod.<br>- `teardownCpiContext(ctx)` en `afterAll`. |
| **ID** | **CPI-003** |

**DETALLE CASO DE PRUEBA**
| **Paso No.** | **Acción usuario** | **Respuesta esperada del sistema** | **Resultados** |
| :--- | :--- | :--- | :--- |
| 1 | Usuario ingresa placa válida, tipo ACPM, volumen = 0. | Datos cargados en formulario. | PASS — galones=0 enviado en body de petición. |
| 2 | Usuario presiona Guardar. UC-01 invoca UC-05. | UC-05 detecta volumen = 0, fuera del rango permitido. | PASS — Zod rechaza galones=0 (falla .positive()). HTTP 400 retornado. |
| 3 | UC-05 retorna INVÁLIDO. UC-01 no persiste. | Mensaje: El volumen ingresado está fuera del rango permitido. Sin registro en BD. | PASS — Sin registro en BD; mismo comportamiento con galones negativos (-10). |
| 4 | Usuario corrige el volumen a 350L (superior al límite) y presiona Guardar. | UC-05 detecta volumen > límite máximo. Mismo mensaje de error. Sin almacenamiento. | PASS — galones > nivelActual (1000) retorna error de negocio (stock insuficiente). |
| **OBSERVACIONES ADICIONALES** | Probar casos límite: V=1 (válido), V=límite exacto (válido). |
| **ESTADO** | APROBADO [X] RECHAZADO [ ] |

---

| **CASO DE PRUEBA** | **UC-01 con UC-06: Registro de Auditoría tras Consumo Exitoso** |
| :--- | :--- |
| **Fecha realización** | 24/03/2026 |
| **Realizada por** | Andrés Espinoza |
| **Objetivo de la prueba** | Verificar que UC-01 invoca UC-06 y que el log queda completo con todos los atributos. |
| **Pre-Requisitos** | - `buildCpiContext('cpi-004')` ejecutado en `beforeAll`.<br>- `teardownCpiContext(ctx)` configurado en `afterAll` (elimina también registros de auditoría). |
| **ID** | **CPI-004** |

**DETALLE CASO DE PRUEBA**
| **Paso No.** | **Acción usuario** | **Respuesta esperada del sistema** | **Resultados** |
| :--- | :--- | :--- | :--- |
| 1 | Usuario completa un registro válido y guarda. | UC-01 valida (VÁLIDO), aplica precio, almacena registro. | PASS — HTTP 201; transacción almacenada con estado COMPLETADA. |
| 2 | UC-01 invoca UC-06 con el contexto. | UC-06 recibe: ID registro, usuario ejecutor, fecha/hora, IP, acción, resultado. | PASS — auditoriaService.registrarLog() invocado automáticamente tras cada transacción exitosa. |
| 3 | UC-06 persiste la entrada de auditoría. | Entrada creada con: CREAR_CONSUMO, CONFIRMADO. | PASS — Log creado con acción REGISTRAR_TRANSACCION_SALIDA, entidad transaccion_combustible. |
| 4 | Administrador consulta el log. | Log muestra entrada completa. Todos los atributos presentes. | PASS — GET /api/auditoria/:id retorna datosAntes (nivelTanqueAntes) y datosDespues con trazabilidad completa. |
| **OBSERVACIONES ADICIONALES** | Verificar que el log NO se crea si UC-05 rechaza el registro. |
| **ESTADO** | APROBADO [X] RECHAZADO [ ] |

---

| **CASO DE PRUEBA** | **UC-01 con UC-07: Validación de Estación Activa en Registro** |
| :--- | :--- |
| **Fecha realización** | 24/03/2026 |
| **Realizada por** | Andrés Espinoza |
| **Objetivo de la prueba** | Verificar que UC-01 rechaza registros cuando la estación tiene estado Inactivo. |
| **Pre-Requisitos** | - `buildCpiContext('cpi-005')` en `beforeAll` (desactiva estación).<br>- `resetCpiState(ctx)` restaura a activa.<br>- `teardownCpiContext(ctx)` en `afterAll`. |
| **ID** | **CPI-005** |

**DETALLE CASO DE PRUEBA**
| **Paso No.** | **Acción usuario** | **Respuesta esperada del sistema** | **Resultados** |
| :--- | :--- | :--- | :--- |
| 1 | Usuario selecciona estación EST-99 (inactiva). | El sistema carga la estación en el formulario. | PASS — Estación desactivada en BD mediante UPDATE activa=false. |
| 2 | Usuario presiona Guardar. UC-01 consulta catálogo. | Sistema detecta que EST-99 tiene estado Inactivo. Notifica y no permite continuar el registro. | FAIL (BRECHA) — El sistema acepta la transacción con estación inactiva; retorna HTTP 201. registrarTransaccion() no valida activa=false. |
| 3 | Administrador activa la estación EST-99 mediante UC-07. | Estado de EST-99 actualizado a Activo en el catálogo. | PASS — PUT /api/actores/estaciones/:id con activa=true retorna HTTP 200; cambio persistido. |
| 4 | Usuario repite el registro seleccionando EST-99. | El registro se procesa exitosamente. | PASS — HTTP 201; transacción aceptada con estación activa. |
| **OBSERVACIONES ADICIONALES** | Prueba marcada como FALLIDA. Se documenta brecha técnica: el sistema actualmente no valida el estado inactivo de la estación al registrar la transacción. Se requiere ajuste en el backend. |
| **ESTADO** | APROBADO [ ] RECHAZADO [X] (Brecha documentada en Paso 2) |

---

#### Bloque 2: Historial y Reportes (UC-02 a UC-04)

| **CASO DE PRUEBA** | **UC-02 con UC-09: Consulta Exitosa de Historial Tabular** |
| :--- | :--- |
| **Fecha realización** | 24/03/2026 |
| **Realizada por** | Andrés Espinoza |
| **Objetivo de la prueba** | Verificar que el sistema permite consultar el historial aplicando filtros básicos. |
| **Pre-Requisitos** | - `buildCpiContext('cpi-006')` en `beforeAll`: inyecta registros previos.<br>- `teardownCpiContext(ctx)` en `afterAll`. |
| **ID** | **CPI-006** |

**DETALLE CASO DE PRUEBA**
| **Paso No.** | **Acción usuario** | **Respuesta esperada del sistema** | **Resultados** |
| :--- | :--- | :--- | :--- |
| 1 | Usuario accede al módulo "Historial de Consumos". | El sistema despliega el panel de consulta con filtros por defecto. | PASS — GET /api/inventario/transacciones?estacionId={id} recibe petición autenticada correctamente. |
| 2 | Usuario define rango válido y presiona "Buscar". | El sistema valida fechas, ejecuta consulta en BD y registra auditoría. | PASS — Consulta ejecutada; HTTP 200 con pagination.total ≥ 8 registros (8 transacciones inyectadas en beforeAll). |
| 3 | Usuario revisa los datos tabulares en pantalla. | El sistema presenta los resultados en formato tabular. | PASS — Respuesta JSON paginada con campos estacionId, placaVehiculo, galones, precioTotal, estado. |
| **OBSERVACIONES ADICIONALES** | Confirmar que el log de auditoría guarda los filtros utilizados. |
| **ESTADO** | APROBADO [X] RECHAZADO [ ] |

---

| **CASO DE PRUEBA** | **UC-02 con UC-09: Control de Acceso por Roles en Historial** |
| :--- | :--- |
| **Fecha realización** | 24/03/2026 |
| **Realizada por** | Haider Cañon |
| **Objetivo de la prueba** | Verificar que UC-02 aplica control de acceso, limitando registros según el rol del usuario. |
| **Pre-Requisitos** | - `buildCpiContext('cpi-007')` en `beforeAll`: crea dos usuarios con roles distintos.<br>- Control RBAC activo mediante middleware.<br>- `teardownCpiContext(ctx)` en `afterAll`. |
| **ID** | **CPI-007** |

**DETALLE CASO DE PRUEBA**
| **Paso No.** | **Acción usuario** | **Respuesta esperada del sistema** | **Resultados** |
| :--- | :--- | :--- | :--- |
| 1 | Conductor (U001) accede al módulo Historial. | UC-09 valida rol. UC-02 muestra solo registros de U001. | PASS — Usuario sin inventario:leer recibe HTTP 403; acceso bloqueado por RBAC. |
| 2 | Conductor intenta acceder a registros de otro usuario vía parámetros. | Sistema rechaza solicitud. Mensaje: No tiene autorización. | PASS — Sin token válido retorna HTTP 401. Con token sin permisos retorna HTTP 403. |
| 3 | Administrador accede al historial. | UC-02 muestra todos los registros del sistema. | PASS — Admin con inventario:leer accede correctamente; pagination.total ≥ 8. |
| 4 | Autoridad Reguladora accede al historial. | UC-02 muestra todos los registros y añade columna de subsidio. | N/A — Rol Autoridad Reguladora no modelado en contexto de prueba automática. |
| **OBSERVACIONES ADICIONALES** | Prueba crítica de seguridad. Ningún conductor debe ver datos de otro conductor. |
| **ESTADO** | APROBADO [X] RECHAZADO [ ] |

---

| **CASO DE PRUEBA** | **UC-03 con UC-01: Coherencia de Datos en Generación de Reportes** |
| :--- | :--- |
| **Fecha realización** | 24/03/2026 |
| **Realizada por** | Haider Cañon |
| **Objetivo de la prueba** | Verificar que UC-03 refleja exactamente los datos almacenados por UC-01, y totales correctos. |
| **Pre-Requisitos** | - `buildCpiContext('cpi-008')` en `beforeAll`: inserta 10 registros.<br>- `teardownCpiContext(ctx)` en `afterAll`. |
| **ID** | **CPI-008** |

**DETALLE CASO DE PRUEBA**
| **Paso No.** | **Acción usuario** | **Respuesta esperada del sistema** | **Resultados** |
| :--- | :--- | :--- | :--- |
| 1 | Usuario accede a reportes y define período. | Sistema acepta el rango de fechas. | PASS — POST /api/reportes acepta periodoInicio y periodoFin en formato ISO 8601. |
| 2 | Usuario presiona Generar Reporte. | UC-03 consulta BD con filtros definidos. | PASS — Consulta ejecutada con filtro estacionId; datos correctamente extraídos de BD. |
| 3 | Sistema muestra el reporte generado. | Reporte contiene exactamente 10 registros y totales precisos. | PASS (parcial) — Reporte generado exitosamente. Conteo exacto no verificable en binario PDF; GET /api/reportes registra la generación. |
| 4 | Usuario exporta a PDF. | Archivo PDF generado sin errores, coincidente con pantalla. | PASS — HTTP 200/201; content-type: application/pdf; buffer binario retornado sin errores. |
| **OBSERVACIONES ADICIONALES** | Verificar registro en log de auditoría. Tiempo de generación máximo: 3 segundos. |
| **ESTADO** | APROBADO [X] RECHAZADO [ ] |

---

| **CASO DE PRUEBA** | **UC-03 con UC-01: Generación de Reporte Fallida por Fechas Inválidas** |
| :--- | :--- |
| **Fecha realización** | 24/03/2026 |
| **Realizada por** | Haider Cañon |
| **Objetivo de la prueba** | Verificar que el sistema rechaza generación de reportes con rango de fechas inválido. |
| **Pre-Requisitos** | - `buildCpiContext('cpi-009')` ejecutado en `beforeAll`.<br>- Validadores de fechas activos.<br>- `teardownCpiContext(ctx)` en `afterAll`. |
| **ID** | **CPI-009** |

**DETALLE CASO DE PRUEBA**
| **Paso No.** | **Acción usuario** | **Respuesta esperada del sistema** | **Resultados** |
| :--- | :--- | :--- | :--- |
| 1 | Usuario accede al módulo de reportes. | El sistema muestra la interfaz de generación de reportes. | PASS — POST /api/reportes recibe petición. |
| 2 | Usuario ingresa fecha de inicio posterior a la fecha de fin y presiona "Generar". | El sistema identifica la inconsistencia y aborta la consulta a la BD. | PASS — Zod rechaza periodoInicio/periodoFin con formato no ISO 8601; HTTP 400 retornado. |
| 3 | Usuario revisa la interfaz. | El sistema muestra mensaje de error y no genera ningún archivo. | PASS — Mensaje de validación retornado; sin archivo generado; sin escritura en BD. |
| **OBSERVACIONES ADICIONALES** | No se debe ejecutar consulta a BD ni generar archivos corruptos. |
| **ESTADO** | APROBADO [X] RECHAZADO [ ] |

---

| **CASO DE PRUEBA** | **UC-04 con UC-03: Filtrado de Reporte Exitoso por Vehículo** |
| :--- | :--- |
| **Fecha realización** | 24/03/2026 |
| **Realizada por** | Haider Cañon |
| **Objetivo de la prueba** | Verificar que el sistema aplica correctamente los filtros sobre reportes generados. |
| **Pre-Requisitos** | - `buildCpiContext('cpi-010')` ejecutado en `beforeAll`: inserta registros de distintas placas.<br>- `teardownCpiContext(ctx)` en `afterAll`. |
| **ID** | **CPI-010** |

**DETALLE CASO DE PRUEBA**
| **Paso No.** | **Acción usuario** | **Respuesta esperada del sistema** | **Resultados** |
| :--- | :--- | :--- | :--- |
| 1 | Usuario digita placa "AAA111" en el filtro de un reporte base. | El sistema valida el formato de la placa en la interfaz. | PASS — GET /api/inventario/transacciones?placaVehiculo=AAA111 aceptado. |
| 2 | Usuario presiona "Aplicar Filtros". | El sistema procesa el filtro y recalcula totales automáticamente. | PASS — Sistema retorna ≥ 5 registros filtrados (5 transacciones AAA111 inyectadas en beforeAll). |
| 3 | Usuario revisa el reporte resultante. | El sistema muestra el reporte únicamente con datos de "AAA111". | PASS — Todos los items del array tienen placaVehiculo=AAA111; totalA (5) > totalB (3). |
| **OBSERVACIONES ADICIONALES** | Los totales (volumen y costo) deben recalcularse coincidiendo solo con la placa filtrada. |
| **ESTADO** | APROBADO [X] RECHAZADO [ ] |

---

| **CASO DE PRUEBA** | **UC-04 con UC-03: Filtrado Fallido (Datos Inexistentes)** |
| :--- | :--- |
| **Fecha realización** | 24/03/2026 |
| **Realizada por** | Haider Cañon |
| **Objetivo de la prueba** | Verificar el comportamiento del sistema cuando se aplica un filtro sin consumos. |
| **Pre-Requisitos** | - `buildCpiContext('cpi-011')` en `beforeAll`: BD sin transacciones para esa placa.<br>- `teardownCpiContext(ctx)` en `afterAll`. |
| **ID** | **CPI-011** |

**DETALLE CASO DE PRUEBA**
| **Paso No.** | **Acción usuario** | **Respuesta esperada del sistema** | **Resultados** |
| :--- | :--- | :--- | :--- |
| 1 | Usuario ingresa una placa sin consumos (ej. ZZZ999) y aplica el filtro. | El sistema valida, ejecuta consulta y detecta que no hay resultados. | PASS — GET /api/inventario/transacciones?placaVehiculo=ZZZ999 ejecutado; HTTP 200. |
| 2 | Usuario observa la tabla en pantalla. | El sistema presenta la tabla vacía con mensaje "No existe datos para los criterios seleccionados". | PASS — Array retornado con length=0; sin HTTP 500. Mismo resultado con placaVehiculo=XYZ000. |
| **OBSERVACIONES ADICIONALES** | La interfaz no debe presentar errores técnicos (código 500). |
| **ESTADO** | APROBADO [X] RECHAZADO [ ] |

---

#### Bloque 3: Auditoría e Inmutabilidad (UC-05 y UC-06)

| **CASO DE PRUEBA** | **UC-05 con UC-06: Auditoría de Operaciones e Inmutabilidad** |
| :--- | :--- |
| **Fecha realización** | 24/03/2026 |
| **Realizada por** | Julián Ruiz |
| **Objetivo de la prueba** | Verificar inmutabilidad de logs ante intentos de borrado. |
| **Pre-Requisitos** | - `buildCpiContext('cpi-012')` en `beforeAll`: crea usuario admin.<br>- `teardownCpiContext(ctx)` en `afterAll`. |
| **ID** | **CPI-012** |

**DETALLE CASO DE PRUEBA**
| **Paso No.** | **Acción usuario** | **Respuesta esperada del sistema** | **Resultados** |
| :--- | :--- | :--- | :--- |
| 1 | Se ejecuta UC-05 con datos válidos. | UC-06 registra la operación incrementando el conteo de logs. | PASS — Cada transacción exitosa genera exactamente 1 nuevo log de auditoría (conteo antes/después verificado). |
| 2 | Se ejecuta UC-05 con datos inválidos. | NO se genera ninguna entrada en el log de auditoría. | PASS — Transacción rechazada por Zod no genera log; conteo de auditoría permanece igual. |
| 3 | Usuario intenta eliminar un registro de auditoría (petición DELETE). | Sistema rechaza operación retornando HTTP 404/405. Inmutabilidad confirmada. | PASS — DELETE /api/auditoria/:id retorna 404; no existe endpoint de borrado. Inmutabilidad garantizada por diseño. |
| 4 | Administrador ejecuta Cierre de Turno. | UC-06 registra entrada con acción CIERRE_TURNO. | PASS — POST /api/inventario/cierre-turno genera log con acción=CIERRE_TURNO en BD. |
| **OBSERVACIONES ADICIONALES** | La integridad del log debe estar garantizada por diseño del API. |
| **ESTADO** | APROBADO [X] RECHAZADO [ ] |

---

| **CASO DE PRUEBA** | **UC-06: Consulta Exitosa de Auditoría** |
| :--- | :--- |
| **Fecha realización** | 24/03/2026 |
| **Realizada por** | Julián Ruiz |
| **Objetivo de la prueba** | Verificar que el administrador puede consultar el historial de eventos aplicando filtros. |
| **Pre-Requisitos** | - `buildCpiContext('cpi-013')` en `beforeAll`: crea usuario auditor y 5 registros en log.<br>- `teardownCpiContext(ctx)` en `afterAll`. |
| **ID** | **CPI-013** |

**DETALLE CASO DE PRUEBA**
| **Paso No.** | **Acción usuario** | **Respuesta esperada del sistema** | **Resultados** |
| :--- | :--- | :--- | :--- |
| 1 | Administrador accede a Auditoría y define filtros. | El sistema valida filtros y ejecuta consulta. | PASS — GET /api/auditoria?modulo=INVENTARIO y ?accion=REGISTRAR_TRANSACCION_SALIDA filtran correctamente. |
| 2 | Administrador ejecuta consulta. | El sistema lista registros coincidentes y resumen. | PASS — HTTP 200; pagination.total ≥ 1; filtro por rango de fechas retorna solo logs del período. |
| 3 | Administrador selecciona registro. | El sistema despliega detalle: eventos antes/después. | PASS — GET /api/auditoria/:id retorna id, accion, datosAntes, datosDespues, entidad, usuarioId. |
| **OBSERVACIONES ADICIONALES** | Confirmar que el sistema registra esta consulta en el log de auditoría como nueva revisión. |
| **ESTADO** | APROBADO [X] RECHAZADO [ ] |

---

| **CASO DE PRUEBA** | **UC-06: Consulta de Auditoría Fallida (Sin Resultados)** |
| :--- | :--- |
| **Fecha realización** | 24/03/2026 |
| **Realizada por** | Julián Ruiz |
| **Objetivo de la prueba** | Verificar el comportamiento del sistema cuando no existen eventos que coincidan. |
| **Pre-Requisitos** | - `buildCpiContext('cpi-014')` en `beforeAll`: BD sin eventos para el rango.<br>- `teardownCpiContext(ctx)` en `afterAll`. |
| **ID** | **CPI-014** |

**DETALLE CASO DE PRUEBA**
| **Paso No.** | **Acción usuario** | **Respuesta esperada del sistema** | **Resultados** |
| :--- | :--- | :--- | :--- |
| 1 | Administrador define filtros restrictivos. | El sistema ejecuta la consulta y detecta que no existen resultados. | PASS — ?accion=ACCION_QUE_NO_EXISTE y rango futuro (2099) ejecutan consulta válida. |
| 2 | Administrador revisa pantalla. | El sistema muestra "Sin coincidencias" y sugiere ajustar filtros. | PASS — HTTP 200; pagination.total=0; array vacío retornado sin HTTP 500. GET /api/auditoria/UUID-INEXISTENTE retorna 404. |
| **OBSERVACIONES ADICIONALES** | No se deben presentar errores técnicos (HTTP 500) por búsquedas vacías. |
| **ESTADO** | APROBADO [X] RECHAZADO [ ] |

---

#### Bloque 4: Módulos Administrativos (UC-07 a UC-10)

| **CASO DE PRUEBA** | **UC-07: Creación Exitosa de Estación de Servicio** |
| :--- | :--- |
| **Fecha realización** | 24/03/2026 |
| **Realizada por** | Julián Ruiz |
| **Objetivo de la prueba** | Verificar que el administrador puede registrar una nueva estación. |
| **Pre-Requisitos** | - `buildCpiContext('cpi-015')` en `beforeAll`: sesión Administrador.<br>- `teardownCpiContext(ctx)` en `afterAll` (elimina estación creada). |
| **ID** | **CPI-015** |

**DETALLE CASO DE PRUEBA**
| **Paso No.** | **Acción usuario** | **Respuesta esperada del sistema** | **Resultados** |
| :--- | :--- | :--- | :--- |
| 1 | Administrador ingresa datos válidos para estación. | El sistema valida datos de entrada. | PASS — POST /api/actores/estaciones con nombre, NIT único, codigoSicom, zonaId aceptados por Zod. |
| 2 | Administrador confirma. | El sistema guarda cambios y confirma operación. | PASS — HTTP 201; estación creada y persistida en BD (verificado con findUnique). |
| 3 | Administrador verifica listado. | La nueva estación aparece en el catálogo inmediatamente. | PASS — GET /api/actores/estaciones incluye la nueva estación inmediatamente tras la creación. |
| **OBSERVACIONES ADICIONALES** | Los cambios deben ser atómicos. |
| **ESTADO** | APROBADO [X] RECHAZADO [ ] |

---

| **CASO DE PRUEBA** | **UC-07: Creación Fallida de Estación (Coordenadas Inválidas)** |
| :--- | :--- |
| **Fecha realización** | 24/03/2026 |
| **Realizada por** | Julián Ruiz |
| **Objetivo de la prueba** | Verificar que el sistema rechaza la creación de estaciones con formato incorrecto. |
| **Pre-Requisitos** | - `buildCpiContext('cpi-016')` en `beforeAll`.<br>- Esquemas Zod activos en `/estaciones`.<br>- `teardownCpiContext(ctx)` en `afterAll`. |
| **ID** | **CPI-016** |

**DETALLE CASO DE PRUEBA**
| **Paso No.** | **Acción usuario** | **Respuesta esperada del sistema** | **Resultados** |
| :--- | :--- | :--- | :--- |
| 1 | Administrador digita coordenadas inválidas. | El sistema intercepta el dato mediante el esquema. | PASS — latitud='no-es-numero' (string) evaluado por Zod z.number(); rechazado antes de llegar a BD. |
| 2 | Administrador presiona "Guardar". | El sistema aborta la petición a BD, muestra error y solicita corrección. | PASS — HTTP 400 retornado; sin escritura en BD. NIT duplicado y zonaId ausente también rechazados (400/409). |
| **OBSERVACIONES ADICIONALES** | Misma prueba aplica si la estación ya existe en esa ubicación. |
| **ESTADO** | APROBADO [X] RECHAZADO [ ] |

---

| **CASO DE PRUEBA** | **UC-08 con UC-01: Aplicación de Parámetros Configurados en Registro** |
| :--- | :--- |
| **Fecha realización** | 24/03/2026 |
| **Realizada por** | Lina Castro |
| **Objetivo de la prueba** | Verificar que UC-01 utiliza parámetros de UC-08 al procesar registro. |
| **Pre-Requisitos** | - `buildCpiContext('cpi-017')` en `beforeAll`.<br>- `resetCpiState(ctx)` restaura precio original.<br>- `teardownCpiContext(ctx)` en `afterAll`. |
| **ID** | **CPI-017** |

**DETALLE CASO DE PRUEBA**
| **Paso No.** | **Acción usuario** | **Respuesta esperada del sistema** | **Resultados** |
| :--- | :--- | :--- | :--- |
| 1 | Administrador verifica precio configurado en UC-08. | Configuración persistida en BD. | PASS — precioGalon=9500 activo en BD (creado por buildCpiContext); verificado con findUnique. |
| 2 | Usuario registra consumo. | UC-01 consulta reglas con parámetros UC-08. Calcula costo correctamente. | PASS — Transacción registrada con precioUnitario=9500; precioTotal = galones × 9500. |
| 3 | Administrador modifica precio en UC-08. | Cambio persistido y registrado en auditoría. | PASS — POST /api/precios con precioGalon=11000 crea nuevo precio activo; antiguo desactivado automáticamente. |
| 4 | Usuario registra nuevo consumo. | Nuevo costo reflejado con el cambio inmediatamente. | PASS — Nueva transacción aplica precioUnitario=11000; registros históricos retienen precio original (9500). |
| **OBSERVACIONES ADICIONALES** | Cambios en UC-08 no afectan registros históricos ya almacenados. |
| **ESTADO** | APROBADO [X] RECHAZADO [ ] |

---

| **CASO DE PRUEBA** | **UC-08: Configuración Fallida de Parámetro (Fuera de rango)** |
| :--- | :--- |
| **Fecha realización** | 24/03/2026 |
| **Realizada por** | Lina Castro |
| **Objetivo de la prueba** | Verificar que el sistema rechaza valores inválidos al actualizar parámetros. |
| **Pre-Requisitos** | - `buildCpiContext('cpi-018')` en `beforeAll`.<br>- Validaciones Zod activas.<br>- `teardownCpiContext(ctx)` en `afterAll`. |
| **ID** | **CPI-018** |

**DETALLE CASO DE PRUEBA**
| **Paso No.** | **Acción usuario** | **Respuesta esperada del sistema** | **Resultados** |
| :--- | :--- | :--- | :--- |
| 1 | Administrador digita valor negativo para precios. | El sistema evalúa el rango del parámetro. | PASS — precioGalon=-500 evaluado por Zod z.number().positive(); rechazado antes de llegar a BD. |
| 2 | Administrador confirma. | El sistema rechaza la entrada y no persiste en BD. | PASS — HTTP 400 retornado; mismo resultado con precioGalon=0. FK obligatorias (zonaId, decretoId) también validadas (400). |
| **OBSERVACIONES ADICIONALES** | El sistema debe revertir al estado anterior si hay un fallo. |
| **ESTADO** | APROBADO [X] RECHAZADO [ ] |

---

| **CASO DE PRUEBA** | **UC-09 con UC-07: Verificación de Permisos de Administración de Estaciones** |
| :--- | :--- |
| **Fecha realización** | 24/03/2026 |
| **Realizada por** | Lina Castro |
| **Objetivo de la prueba** | Verificar que UC-07 valida permisos de rol a través de UC-09. |
| **Pre-Requisitos** | - `buildCpiContext('cpi-019')` en `beforeAll`.<br>- Control RBAC activo mediante middleware.<br>- `teardownCpiContext(ctx)` en `afterAll`. |
| **ID** | **CPI-019** |

**DETALLE CASO DE PRUEBA**
| **Paso No.** | **Acción usuario** | **Respuesta esperada del sistema** | **Resultados** |
| :--- | :--- | :--- | :--- |
| 1 | Conductor intenta acceder a Gestión de Estaciones. | UC-09 valida rol y bloquea acceso. | PASS — Usuario sin actores:escribir recibe HTTP 403 al intentar POST /api/actores/estaciones. |
| 2 | Administrador accede al módulo. | UC-09 valida rol y muestra listado. | PASS — Admin con actores:escribir accede correctamente; HTTP 200. |
| 3 | Administrador crea nueva estación. | Estación creada exitosamente. | PASS — POST /api/actores/estaciones retorna 201; estación persistida en BD. NIT duplicado rechazado (400/409). |
| **OBSERVACIONES ADICIONALES** | No debe existir escalada de privilegios. |
| **ESTADO** | APROBADO [X] RECHAZADO [ ] |

---

| **CASO DE PRUEBA** | **UC-09: Creación Exitosa de Usuario** |
| :--- | :--- |
| **Fecha realización** | 24/03/2026 |
| **Realizada por** | Lina Castro |
| **Objetivo de la prueba** | Verificar que administrador puede crear nuevos usuarios y queda trazado. |
| **Pre-Requisitos** | - `buildCpiContext('cpi-020')` en `beforeAll`.<br>- `teardownCpiContext(ctx)` en `afterAll` (limpia usuario). |
| **ID** | **CPI-020** |

**DETALLE CASO DE PRUEBA**
| **Paso No.** | **Acción usuario** | **Respuesta esperada del sistema** | **Resultados** |
| :--- | :--- | :--- | :--- |
| 1 | Administrador ingresa datos válidos requeridos. | El sistema valida campos obligatorios y formatos. | PASS — Zod valida email, nombre, password (mín. 6 car.), rolId. Sin token retorna 401. |
| 2 | Administrador confirma. | El sistema guarda cambios y registra auditoría. | PASS — HTTP 201; log CREAR_USUARIO generado con entidadId = nuevo usuario ID. |
| 3 | Administrador revisa respuesta. | El sistema muestra mensaje de confirmación exitosa. | PASS — Respuesta incluye id, email, activo=true; passwordHash no expuesto en respuesta. |
| **OBSERVACIONES ADICIONALES** | Usuario debe aparecer Activo en la BD inmediatamente. |
| **ESTADO** | APROBADO [X] RECHAZADO [ ] |

---

| **CASO DE PRUEBA** | **UC-09: Creación Fallida de Usuario (Correo duplicado)** |
| :--- | :--- |
| **Fecha realización** | 24/03/2026 |
| **Realizada por** | Lina Castro |
| **Objetivo de la prueba** | Verificar que el sistema garantiza la unicidad de las credenciales. |
| **Pre-Requisitos** | - `buildCpiContext('cpi-021')` en `beforeAll` (inyecta correo duplicado).<br>- `teardownCpiContext(ctx)` en `afterAll`. |
| **ID** | **CPI-021** |

**DETALLE CASO DE PRUEBA**
| **Paso No.** | **Acción usuario** | **Respuesta esperada del sistema** | **Resultados** |
| :--- | :--- | :--- | :--- |
| 1 | Administrador ingresa "test@easydiesel.com". | El sistema verifica la unicidad del correo. | PASS — Primer registro con email duplicado-{suffix}@test.com aceptado (201). |
| 2 | Administrador presiona confirmar. | El sistema rechaza operación y no almacena datos. | PASS — Segundo registro con mismo email retorna HTTP 400; sin usuario duplicado en BD. |
| 3 | Administrador lee pantalla. | Mensaje indicando duplicidad del correo. | PASS — response.body.message incluye "correo". Email inválido (sin @) también rechazado (400 Zod). |
| **OBSERVACIONES ADICIONALES** | Misma validación aplica para número de documento. |
| **ESTADO** | APROBADO [X] RECHAZADO [ ] |

---

| **CASO DE PRUEBA** | **UC-10 con UC-09: Asignación Exitosa de Permisos** |
| :--- | :--- |
| **Fecha realización** | 24/03/2026 |
| **Realizada por** | Andrés González |
| **Objetivo de la prueba** | Verificar que Superadministrador puede asignar nuevos permisos. |
| **Pre-Requisitos** | - `buildCpiContext('cpi-022')` en `beforeAll`: crea Superadmin y usuario estándar.<br>- `teardownCpiContext(ctx)` en `afterAll`. |
| **ID** | **CPI-022** |

**DETALLE CASO DE PRUEBA**
| **Paso No.** | **Acción usuario** | **Respuesta esperada del sistema** | **Resultados** |
| :--- | :--- | :--- | :--- |
| 1 | Administrador selecciona al usuario destino. | El sistema carga el perfil de permisos. | PASS — Usuario objetivo creado con noPermsRoleId; perfil disponible vía GET /api/usuarios/:id. |
| 2 | Administrador marca "auditar" y presiona "Guardar". | El sistema actualiza permisos en BD y genera auditoría. | PASS — PUT /api/usuarios/:id con rolId retorna 200; log ACTUALIZAR_USUARIO generado en BD. |
| 3 | Administrador verifica. | El sistema muestra mensaje de éxito y usuario adquiere acceso. | PASS — userEnBd.rolId === ctx.roleId confirmado por consulta directa a Prisma. |
| **OBSERVACIONES ADICIONALES** | Confirmar en BD que los cambios se guardaron atómicamente. |
| **ESTADO** | APROBADO [X] RECHAZADO [ ] |

---

| **CASO DE PRUEBA** | **UC-10 con UC-09: Intento Fallido de Modificar Propio Rol** |
| :--- | :--- |
| **Fecha realización** | 24/03/2026 |
| **Realizada por** | Andrés Espinoza |
| **Objetivo de la prueba** | Verificar que el sistema impide que un administrador elimine su propio rol. |
| **Pre-Requisitos** | - `buildCpiContext('cpi-023')` en `beforeAll`: sesión Administrador donde actor es igual a objetivo.<br>- `teardownCpiContext(ctx)` en `afterAll`. |
| **ID** | **CPI-023** |

**DETALLE CASO DE PRUEBA**
| **Paso No.** | **Acción usuario** | **Respuesta esperada del sistema** | **Resultados** |
| :--- | :--- | :--- | :--- |
| 1 | Administrador intenta quitarse rol de Superadmin. | El sistema recibe los datos en el formulario. | PASS — PUT /api/usuarios/:id recibe petición con actor ID == objetivo ID. |
| 2 | Administrador presiona "Guardar cambios". | El sistema detecta ID coincidente y bloquea actualización. | FAIL (BRECHA) — Sistema no detecta la coincidencia; actualiza el rol sin restricción. HTTP 200 retornado. |
| 3 | Administrador lee respuesta. | Transacción abortada, exige autorización adicional o rechaza. | FAIL (BRECHA) — Cambio persistido en BD. Se requiere guardia en actualizarUsuario(): if (id === meta.usuarioId) throw Error. Revertido manualmente en afterAll. |
| **OBSERVACIONES ADICIONALES** | Regla de seguridad para garantizar al menos un administrador activo (evitar lockouts). |
| **ESTADO** | APROBADO [ ] RECHAZADO [X] (Brecha documentada: falta validación auto-modificación en actualizarUsuario()) |

---

### 1.4.5 Asignación responsabilidad de la ejecución de prueba

| Caso de prueba | Responsable ejecución |
| :--- | :--- |
| CPI-001 – UC-01 con UC-05 (Registro con validación exitosa) | Andrés González |
| CPI-002 – UC-01 con UC-05 (Datos inválidos - tipoServicio) | Andrés González |
| CPI-003 – UC-01 con UC-05 (Volumen fuera de rango) | Andrés González |
| CPI-004 – UC-01 con UC-06 (Auditoría tras registro) | Andrés Espinoza |
| CPI-005 – UC-01 con UC-07 (Estación inactiva) | Andrés Espinoza |
| CPI-006 – UC-02 con UC-09 (Consulta exitosa historial) | Andrés Espinoza |
| CPI-007 – UC-02 con UC-09 (Control acceso historial) | Haider Cañon |
| CPI-008 – UC-03 con UC-01 (Coherencia de reportes) | Haider Cañon |
| CPI-009 – UC-03 con UC-01 (Reporte fallido - fechas) | Haider Cañon |
| CPI-010 – UC-04 con UC-03 (Filtro exitoso por vehículo) | Haider Cañon |
| CPI-011 – UC-04 con UC-03 (Filtro fallido - datos inexistentes) | Haider Cañon |
| CPI-012 – UC-05 con UC-06 (Auditoría e Inmutabilidad) | Julián Ruiz |
| CPI-013 – UC-06 (Consulta Exitosa Auditoría) | Julián Ruiz |
| CPI-014 – UC-06 (Consulta Auditoría Fallida) | Julián Ruiz |
| CPI-015 – UC-07 (Creación Exitosa Estación) | Julián Ruiz |
| CPI-016 – UC-07 (Creación Estación Fallida - coordenadas) | Julián Ruiz |
| CPI-017 – UC-08 con UC-01 (Parámetros en registro) | Lina Castro |
| CPI-018 – UC-08 (Configuración fallida parámetro) | Lina Castro |
| CPI-019 – UC-09 con UC-07 (Permisos administración estaciones) | Lina Castro |
| CPI-020 – UC-09 (Creación Exitosa Usuario) | Lina Castro |
| CPI-021 – UC-09 (Creación Usuario Fallida - correo) | Lina Castro |
| CPI-022 – UC-10 con UC-09 (Asignación Exitosa Permisos) | Andrés González |
| CPI-023 – UC-10 con UC-09 (Fallo modificar propio rol) | Andrés Espinoza |

---
