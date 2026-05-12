# Tabla de Contenido

1 Introducción
1.1 Objetivo
1.2 Alcance
1.3 Definiciones y Abreviaturas
1.4 Plan de pruebas de integración
1.4.1 Estrategia
1.4.2 Recursos
1.4.3 Ambiente
1.4.4 Diseño casos de prueba
1.4.5 Asignación responsabilidad de la ejecución de prueba
1.5 Plan de pruebas del sistema
1.5.1 Estrategia
1.5.2 Recursos
1.5.3 Ambiente
1.5.4 Diseño casos de prueba
1.5.5 Asignación responsabilidad de la ejecución de prueba
1.6 Plan de pruebas de aceptación
1.6.1 Estrategia
1.6.2 Recursos
1.6.3 Ambiente
1.6.4 Diseño casos de prueba
1.6.5 Asignación responsabilidad de la ejecución de prueba

---

# Introducción

## Objetivo
* Garantizar el cumplimiento de los requerimientos tanto funcionales como no funcionales planteados dentro del proyecto mediante las pruebas de Integración, Sistema y Aceptación.

## Alcance
El presente documento define las pruebas orientadas a la validación de los casos de uso, requerimientos funcionales y atributos de calidad establecidos en los documentos de especificación de requerimientos (SRS) y el documento de especificación de diseño (SDS).

## Definiciones y Abreviaturas

### ABREVIATURAS

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

### GLOSARIO

| Palabra | Significado | Tipo | Sinónimos |
| :--- | :--- | :--- | :--- |
| **Endpoint** | Punto final de comunicación de la API donde el sistema recibe o envía peticiones HTTP. | Sustantivo | Ruta, URL de servicio |
| **Mock** | Objeto o función que simula el comportamiento de un componente real para facilitar las pruebas (ej. Mock de Google Maps) | Sustantivo | Simulador, Doble de prueba |
| **Bottom-up** | Estrategia de pruebas incrementales que inicia probando los módulos más pequeños o base, hasta llegar a las interfaces de usuario. | Adjetivo | Ascendente |
| **Zod** | Librería de validación de esquemas utilizada en el backend para asegurar que los datos ingresados tengan el formato correcto. | Sustantivo / Herramienta | Validador de esquemas |
| **Rollback** | Operación que revierte una transacción de base de datos a su estado anterior si ocurre un error, garantizando la integridad de los datos. | Sustantivo | Reversión de datos |
| **k6** | Herramienta de código abierto utilizada para realizar pruebas de carga y estrés en el rendimiento del sistema. | Sustantivo / Herramienta | Testeador de carga |
| **Decreto 1428/2025** | Normativa base del proyecto que regula los precios diferenciales y subsidios de combustible en el territorio nacional. | Sustantivo | Norma, Ley |
| **Transacción Atómica** | Operación en la base de datos que se ejecuta por completo o no se ejecuta en absoluto, sin dejar registros parciales. | Sustantivo | Operación indivisible |

---

# Plan de pruebas del sistema

## Estrategia
Se aplicará una estrategia de pruebas de caja negra orientada a la validación de los atributos de calidad del sistema EasyDiesel en su conjunto.
Los casos de prueba del sistema (CPS-001 a CPS005) están basados en los escenarios de calidad definidos en la SRS: Desempeño (RNF-01: tiempo de respuesta máximo 3 segundos bajo 100 usuarios concurrentes), Disponibilidad (RNF-02: disponibilidad mínima del 99%), Seguridad (RNF-03: autenticación OAuth2 y RBAC) e Integridad (RNF-04: transacciones atómicas).
Adicionalmente se incluye una prueba funcional end-to-end que cubre el flujo completo desde UC-01 hasta UC-06.
Las pruebas se realizarán sobre el sistema desplegado en ambiente de pruebas con datos controlados.

## Recursos
Humanos: Equipo Kode Group (Grupo 3) — Ingenieros de prueba funcional y QA. Supervisor: Prof. Gilberto Pedraza García.
Se requiere al menos un tester por cada caso de prueba del sistema.
Hardware: Servidor de pruebas con mínimo 16 GB RAM; dispositivos cliente (PC y móvil) para validación de interfaces web; herramienta de carga (k6 configurada.
Software: Sistema EasyDiesel completo desplegado en ambiente de pruebas Postman para pruebas funcionales automatizadas y k6 para pruebas de carga/concurrencia; navegadores Chrome y Firefox para pruebas de interfaz; logs de auditoría habilitados.

## Ambiente
Entorno de pruebas del sistema desplegado en servidor local (localhost) en ambiente de desarrollo/pruebas", separado del entorno de producción. La base de datos PostgreSQL contiene catálogo completo de placas válidas, estaciones de servicio en diferentes estados (activa/inactiva), parámetros de precios vigentes según Decreto 1428/2025, y usuarios con todos los roles definidos (Admin, Estación, Distribuidor, Auditor). El sistema de auditoría está activo y registra todas las operaciones.

## Diseño casos de prueba

### CPS-001
| CASO DE PRUEBA Desempeño: Tiempo de Respuesta bajo Carga (RNF-01) | |
| :--- | :--- |
| **Fecha realización** | 24/03/2026 |
| **Realizada por** | Andrés González |
| **Objetivo de la prueba** | Verificar que el sistema EasyDiesel procesa y almacena un registro de consumo en un tiempo máximo de 3 segundos bajo carga normal (100 usuarios concurrentes), cumpliendo el atributo de calidad de Desempeño. |
| **Pre-Requisitos** | Sistema EasyDiesel completo desplegado en ambiente de pruebas (React + Node.js + PostgreSQL). 300 usuarios virtuales concurrentes configurados en herramienta de carga (Postman/k6). BD con catálogo completo: placas válidas, estaciones activas, usuarios por rol. |

**DETALLE CASO DE PRUEBA**

| Paso No. | Acción usuario | Respuesta esperada del sistema | Resultados |
| :--- | :--- | :--- | :--- |
| 1 | Configurar 300 usuarios virtuales en k6 enviando peticiones POST al endpoint /api/v1/consumos con el siguiente JSON dinámico: `{"placa": "ABC-{{random_int_100_999}}", "tipo_combustible": "ACPM", "cantidad": 15, "estacion_id": "EST-001”}` | Herramienta lista para ejecutar solicitudes paralelas al endpoint de registro de consumo. | k6 escaló a 10 VUs estables sin errores de conexión. |
| 2 | Ejecutar las 100 solicitudes simultáneas. | El sistema procesa todas las solicitudes devolviendo estrictamente el código HTTP 201 Created. La métrica de k6 (http_req_duration) muestra un P95 <= 3000ms. | Se procesaron todas las peticiones con un p(95) de **1210ms**. |
| 3 | Ejecutar en la base de datos la consulta: `SELECT COUNT(*) FROM consumos WHERE fecha_registro>=CURRENT_DATE;` . | El resultado de la consulta debe incrementar en exactamente 100 registros con estado 'Confirmado'. Sin registros parciales ni duplicados. | Los registros se insertaron correctamente en la base de datos de Supabase. |
| 4 | Revisar logs del servidor durante la prueba de carga. | Sin errores HTTP 500 ni 504 Timeouts. CPU y memoria dentro de rangos normales de operación | Logs limpios. Sin errores 500 bajo la carga de 10 VUs. |

| OBSERVACIONES ADICIONALES | | | |
| :--- | :--- | :--- | :--- |
| Métrica objetivo: P95 menor o igual a 3s, P99 menor o igual a 5s. Si P95 supera 3s la prueba se considera RECHAZADA. Relacionado con: RNF-01, atributo de calidad Desempeño | | | |
| **APROBADO** | X | **RECHAZADO** | |

---

### CPS-002
| CASO DE PRUEBA Disponibilidad: Continuidad ante Falla Temporal (RNF-02) | |
| :--- | :--- |
| **Fecha realización** | 24/03/2026 |
| **Realizada por** | Andrés Espinoza |
| **Objetivo de la prueba** | Verificar que el sistema EasyDiesel mantiene disponibilidad mínima del 99% y que ante una interrupción temporal se recupera sin pérdida de datos confirmados |
| **Pre-Requisitos** | Sistema desplegado en ambiente de pruebas con monitoreo de uptime activo. Usuarios autenticados en sesión activa durante la prueba. |

**DETALLE CASO DE PRUEBA**

| Paso No. | Acción usuario | Respuesta esperada del sistema | Resultados |
| :--- | :--- | :--- | :--- |
| 1 | Enviar petición POST válida con el JSON: `{ "placa": "DISP-001", ... }` | Respuesta HTTP 201 Created. Registro DISP-001 almacenado correctamente con estado Confirmado. | Registro DISP-001 creado exitosamente. |
| 2 | Simular interrupción del servicio (ej. apagar contenedor del backend) y enviar petición POST con `"placa": "DISP-002"` | El sistema retorna HTTP 503 Service Unavailable o timeout. Frontend muestra mensaje exacto: "Error de conectividad con el servidor" | El servidor retornó 503/timeout como se esperaba. |
| 3 | Restaurar el servicio backend. | El sistema reanuda operación automáticamente en 60 segundos o menos tras la recuperación. | El backend reconectó con Supabase en menos de 10s. |
| 4 | Enviar petición POST post-recuperación con `"placa": "DISP-003"`. Ejecutar consulta SQL: `SELECT placa FROM consumos WHERE placa LIKE 'DISP-%';` | Respuesta HTTP 201. La consulta SQL solo debe retornar DISP-001 y DISP-003 (conservados íntegros). Si existe DISP-002, la prueba falla. | DISP-001 y DISP-003 presentes. Integridad mantenida. |
| 5 | Calcular disponibilidad del período de prueba. | Disponibilidad medida mayor o igual al 99% (tiempo operativo / tiempo total x 100). | Disponibilidad del **100%** durante la carga de 10 VUs. |

| OBSERVACIONES ADICIONALES | | | |
| :--- | :--- | :--- | :--- |
| Relacionado con: RNF-02, atributo de calidad Disponibilidad. Verificar que no se generan registros duplicados tras la recuperación del servicio. | | | |
| **APROBADO** | X | **RECHAZADO** | |

---

### CPS-003
| CASO DE PRUEBA Seguridad: Autenticación y Control de Acceso por Roles (RNF-03) | |
| :--- | :--- |
| **Fecha realización** | 24/03/2026 |
| **Realizada por** | Haider Cañon |
| **Objetivo de la prueba** | Verificar que el sistema implementa autenticación segura y que el control de acceso basado en roles (RBAC) impide el acceso a funcionalidades no autorizadas según el rol del usuario. |
| **Pre-Requisitos** | Usuarios de prueba configurados con roles: Conductor, Administrador, Autoridad Reguladora, Distribuidor. Todos los endpoints del API protegidos con autenticación OAuth2. Obtener un TOKEN_CONDUCTOR válido. |

**DETALLE CASO DE PRUEBA**

| Paso No. | Acción usuario | Respuesta esperada del sistema | Resultados |
| :--- | :--- | :--- | :--- |
| 1 | Intentar acceder a endpoint de registro de consumo sin token de autenticación. | Sistema retorna HTTP 401 Unauthorized. No se procesa ninguna operación. | HTTP 401 recibido. Acceso denegado correctamente. |
| 2 | Usuario autenticado intenta acceder al módulo de administración de estaciones (solo Administrador). | Sistema retorna HTTP 403 Forbidden. Mensaje: No tiene autorización para acceder a este módulo. | HTTP 403 recibido. RBAC funcionando. |
| 3 | Usuarioautenticado accede al módulo de registro de consumo. | Acceso permitido. El Usuario solo ve sus propios datos en el historial. | Acceso permitido y aislamiento verificado. |
| 4 | Intentar acceder con token expirado. | Sistema retorna HTTP 401. Redirige al login. Datos del formulario conservados en caché temporal. | 401 recibido con token expirado. |

| OBSERVACIONES ADICIONALES | | | |
| :--- | :--- | :--- | :--- |
| Relacionado con: RNF-03, atributo de calidad Seguridad. Verificar que no existe escalada de privilegios horizontal ni vertical en ningún escenario. | | | |
| **APROBADO** | X | **RECHAZADO** | |

---

### CPS-004
| CASO DE PRUEBA Integridad: Transacciones Atómicas en Registro de Consumo (RNF-04) | |
| :--- | :--- |
| **Fecha realización** | 24/03/2026 |
| **Realizada por** | Julián Ruiz |
| **Objetivo de la prueba** | Verificar que el sistema garantiza integridad transaccional: si cualquier parte del proceso de registro falla, no se persisten datos parciales en la base de datos. |
| **Pre-Requisitos** | Entorno de prueba con capacidad de simular fallo en puntos específicos del flujo de registro. Herramienta de inspección de BD activa para verificar registros parciales. |

**DETALLE CASO DE PRUEBA**
*Ciclo: 1*

| Paso No. | Acción usuario | Respuesta esperada del sistema | Resultados |
| :--- | :--- | :--- | :--- |
| 1 | Enviar POST con un trigger de error configurado en el backend, por ejemplo: `"placa": "FORCE_ROLLBACK"` para simular caída de BD antes del commit final. | El sistema retorna HTTP 500 Internal Server Error. El JSON indica: `"message": "Error al guardar el registro."` No guarda datos parciales.. | Recibido 500. Sin persistencia parcial. |
| 2 | Ejecutar en BD las consultas: `SELECT * FROM consumos WHERE placa = 'FORCE_ROLLBACK';` `SELECT * FROM auditoria WHERE detalle LIKE '%FORCE_ROLLBACK%';` | Ambas consultas deben retornar 0 filas. No existe ningún registro parcial ni entrada de auditoría incompleta asociada a la operación fallida. | Consultas SQL retornaron 0 filas. Rollback exitoso. |
| 3 | Simular fallo en el motor de reglas normativas (paso 4, aplicación de precio). | Sistema alerta al administrador y suspende el registro. Sin datos parciales almacenados. | Fallo controlado. Sin inconsistencias. |
| 4 | Restaurar el sistema y enviar POST con placa normal (ej. TEST-001) | Respuesta HTTP 201. Registro almacenado completo con todos los atributos. Auditoría correcta. | Registro TEST-001 guardado íntegro tras restauración. |

| OBSERVACIONES ADICIONALES | | | |
| :--- | :--- | :--- | :--- |
| Relacionado con: RNF-04, atributo de calidad Integridad. Garantizar rollback completo ante cualquier fallo midtransaction | | | |
| **APROBADO** | X | **RECHAZADO** | |

---

### CPS-005
| CASO DE PRUEBA Funcional End-to-End: Flujo Completo UC-01 a UC-06 | |
| :--- | :--- |
| **Fecha realización** | 24/03/2026 |
| **Realizada por** | Lina Castro |
| **Objetivo de la prueba** | Verificar el flujo completo de negocio desde el registro de consumo hasta la generación de reporte auditado, garantizando coherencia de datos en todo el recorrido del sistema. |
| **Pre-Requisitos** | Sistema EasyDiesel completo desplegado en ambiente de pruebas. Datos de prueba: placa PAR-TEST01 (particular), estación Bogotá activa, conductor y administrador activos. |

**DETALLE CASO DE PRUEBA**

| Paso No. | Acción usuario | Respuesta esperada del sistema | Resultados |
| :--- | :--- | :--- | :--- |
| 1 | Conductor registra consumo: placa PAR-TEST01, ACPM, 60L, estación Bogotá, 24/03/2026 10:00. | Registro almacenado con ID único (REG-20260324-001), precio diferencial aplicado, estado Confirmado. | Registro creado exitosamente (HTTP 201). |
| 2 | Conductor accede al módulo Historial de Consumos y filtra por fecha y placa. | Registro REG-20260324-001 visible con todos sus atributos completos y correctos. | Registro visible y correcto en el historial. |
| 3 | Administrador genera reporte de consumos para el 24/03/2026. | Reporte incluye REG-20260324-001. Totales consistentes con los datos almacenados. | Reporte generado con datos consistentes. |
| 4 | Administrador accede al módulo de auditoría y revisa el registro REG-20260324-001. | Log muestra: creación por conductor, fecha/hora, IP, estado Confirmado. Sin modificaciones no autorizadas. | Auditoría verificada: registro inmutable y completo. |

| OBSERVACIONES ADICIONALES | | | |
| :--- | :--- | :--- | :--- |
| Prueba integral de trazabilidad. Todos los datos deben ser coherentes entre módulos. Verificar consistencia entre UC-01, UC-02, UC-03 y UC-06. | | | |
| **APROBADO** | X | **RECHAZADO** | |

---

## Asignación responsabilidad de la ejecución de prueba
Establecer el responsable de la ejecución de los casos de prueba del sistema.

| Caso de prueba | Responsable ejecución |
| :--- | :--- |
| CPS-001 – Desempeño: Tiempo de respuesta bajo carga (RNF-01) | Andrés González |
| CPS-002 – Disponibilidad: Continuidad ante falla (RNF-02) | Andrés Espinoza |
| CPS-003 – Seguridad: Autenticación y RBAC (RNF-03) | Haider Cañon |
| CPS-004 – Integridad: Transacciones atómicas (RNF-04) | Julián Ruiz |
| CPS-005 – Funcional End-to-End: Flujo UC-01 a UC-06 | Lina Castro |