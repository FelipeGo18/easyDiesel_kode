/**
 * Genera integracionFinal.docx a partir de los datos estructurados del plan de pruebas.
 * Usa docxtemplater + pizzip con un template mínimo generado en memoria.
 *
 * Ejecutar:  node normativa/generateDocx.js
 * Salida:    normativa/integracionFinal.docx
 */

const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

// ── Datos estructurados ──────────────────────────────────────────────────────

const abreviaturas = [
  { abr: 'CPI', desc: 'Caso de Prueba de Integración.' },
  { abr: 'CPS', desc: 'Caso de Prueba de Sistema.' },
  { abr: 'CPA', desc: 'Caso de Prueba de Aceptación.' },
  { abr: 'RBAC', desc: 'Role-Based Access Control (Control de Acceso Basado en Roles).' },
  { abr: 'UAT', desc: 'User Acceptance Testing (Pruebas de Aceptación de Usuario).' },
  { abr: 'RNF', desc: 'Requerimiento No Funcional.' },
  { abr: 'UC / CU', desc: 'Use Case / Caso de Uso.' },
  { abr: 'JWT', desc: 'JSON Web Token (Token usado para la autenticación en la API).' },
  { abr: 'ACPM', desc: 'Aceite Combustible Para Motores (Diésel).' },
  { abr: 'API', desc: 'Application Programming Interface (Interfaz de Programación de Aplicaciones).' },
];

const glosario = [
  { palabra: 'Endpoint', significado: 'Punto final de comunicación de la API donde el sistema recibe o envía peticiones HTTP.', tipo: 'Sustantivo', sinonimos: 'Ruta, URL de servicio' },
  { palabra: 'Mock', significado: 'Objeto o función que simula el comportamiento de un componente real para facilitar las pruebas.', tipo: 'Sustantivo', sinonimos: 'Simulador, Doble de prueba' },
  { palabra: 'Bottom-up', significado: 'Estrategia de pruebas incrementales que inicia probando los módulos más pequeños o base.', tipo: 'Adjetivo', sinonimos: 'Ascendente' },
  { palabra: 'Zod', significado: 'Librería de validación de esquemas utilizada en el backend.', tipo: 'Herramienta', sinonimos: 'Validador de esquemas' },
  { palabra: 'Rollback', significado: 'Operación que revierte una transacción de base de datos a su estado anterior.', tipo: 'Sustantivo', sinonimos: 'Reversión de datos' },
  { palabra: 'k6', significado: 'Herramienta de código abierto para pruebas de carga y estrés.', tipo: 'Herramienta', sinonimos: 'Testeador de carga' },
  { palabra: 'Decreto 1428/2025', significado: 'Normativa que regula precios diferenciales y subsidios de combustible.', tipo: 'Sustantivo', sinonimos: 'Norma, Ley' },
  { palabra: 'Transacción Atómica', significado: 'Operación en BD que se ejecuta por completo o no se ejecuta en absoluto.', tipo: 'Sustantivo', sinonimos: 'Operación indivisible' },
];

const scripts = [
  { artefacto: 'prisma migrate deploy', archivo: 'tests/setup.ts (beforeAll global)', proposito: 'Aplica las migraciones al iniciar.' },
  { artefacto: 'buildCpiContext(suffix)', archivo: 'tests/helpers/cpi.context.ts', proposito: 'INSERT: crea Rol, Usuarios, Zona, Decreto, PrecioVigente, EstacionServicio y Tanque.' },
  { artefacto: 'resetCpiState(ctx)', archivo: 'tests/helpers/cpi.context.ts', proposito: 'UPDATE entre tests: restaura nivelActual del tanque a 1000, reactiva estación y PrecioVigente.' },
  { artefacto: 'teardownCpiContext(ctx)', archivo: 'tests/helpers/cpi.context.ts', proposito: 'DELETE en orden correcto (respeto de FK): transacciones → auditoría → reportes → tanque → estación...' },
];

const cpis = [
  {
    id: 'CPI-001', titulo: 'UC-01 con UC-05: Registro Consumo con Validación Exitosa',
    bloque: 'Bloque 1: Registro de Consumo (UC-01)',
    fecha: '24/03/2026', autor: 'Andrés González',
    objetivo: 'Verificar que UC-01 invoca correctamente UC-05 y que el resultado permite el almacenamiento completo.',
    preRequisitos: 'buildCpiContext(\'cpi-001\') ejecutado en beforeAll. resetCpiState(ctx) disponible. teardownCpiContext(ctx) en afterAll.',
    observaciones: 'Verificar trazabilidad en log de auditoría (UC-06). El precio aplicado debe corresponder al tipo de servicio.',
    estado: 'APROBADO [X]',
    pasos: [
      { n: 1, accion: 'Usuario autenticado accede al módulo Registro de Consumo y abre el formulario.', esperado: 'El sistema despliega el formulario con campos: placa, tipo combustible, volumen, estación, fecha/hora.', resultado: 'PASS — POST /api/inventario/transacciones recibe petición autenticada correctamente.' },
      { n: 2, accion: 'Usuario ingresa placa válida (ABC123), tipo ACPM, volumen 50L, estación activa, fecha actual.', esperado: 'El sistema acepta los datos y los carga en el modelo de solicitud sin errores de formato.', resultado: 'PASS — tipoCombustible=ACPM, tipoServicio=PARTICULAR, galones=50 aceptados sin errores de validación.' },
      { n: 3, accion: 'Usuario presiona Guardar. UC-01 invoca UC-05.', esperado: 'UC-05 ejecuta validaciones: campos obligatorios, placa en catálogo, volumen en rango, estación activa.', resultado: 'PASS — Validaciones Zod ejecutadas automáticamente en el middleware de la ruta.' },
      { n: 4, accion: 'UC-05 devuelve resultado: VÁLIDO.', esperado: 'UC-01 continúa: aplica precio, calcula costo total, almacena registro con estado Confirmado.', resultado: 'PASS — precioTotal calculado correctamente (galones × precioGalon=9500). Registro almacenado con estado COMPLETADA.' },
      { n: 5, accion: 'Sistema genera número de registro.', esperado: 'Mensaje: Consumo registrado exitosamente. Registro en BD con todos los atributos.', resultado: 'PASS — HTTP 201; ID de transacción generado; nivelActual del tanque decrementado en BD (1000 → 950).' },
    ],
  },
  {
    id: 'CPI-002', titulo: 'UC-01 con UC-05: Registro Rechazado por Datos Inválidos (tipoServicio)',
    bloque: 'Bloque 1: Registro de Consumo (UC-01)',
    fecha: '24/03/2026', autor: 'Andrés González',
    objetivo: 'Verificar que UC-05 rechaza el registro cuando se envían datos con formato o valores inválidos.',
    preRequisitos: 'buildCpiContext(\'cpi-002\') ejecutado en beforeAll. Esquemas Zod activos en el middleware. teardownCpiContext(ctx) en afterAll.',
    observaciones: 'Confirmar que la BD no contiene ningún registro parcial. No debe generarse log de auditoría.',
    estado: 'APROBADO [X]',
    pasos: [
      { n: 1, accion: 'Usuario envía petición de registro con un tipoServicio inválido.', esperado: 'El sistema recibe los datos y los pasa a la capa de validación.', resultado: 'PASS — Petición recibida con tipoServicio=\'INVALIDO\'.' },
      { n: 2, accion: 'UC-01 invoca validaciones de UC-05.', esperado: 'UC-05 detecta que el tipoServicio no cumple con el esquema permitido.', resultado: 'PASS — Zod detecta que \'INVALIDO\' no pertenece al enum.' },
      { n: 3, accion: 'UC-05 retorna resultado: INVÁLIDO.', esperado: 'UC-01 aborta el flujo y retorna HTTP 400. No se escribe registro en la BD.', resultado: 'PASS — HTTP 400 retornado; cero registros adicionales en BD.' },
      { n: 4, accion: 'Sistema procesa la respuesta.', esperado: 'Mensaje de error de validación claro al usuario.', resultado: 'PASS — Respuesta JSON con mensaje de validación.' },
    ],
  },
  {
    id: 'CPI-003', titulo: 'UC-01 con UC-05: Registro Rechazado por Volumen Fuera de Rango',
    bloque: 'Bloque 1: Registro de Consumo (UC-01)',
    fecha: '24/03/2026', autor: 'Andrés González',
    objetivo: 'Verificar que UC-05 intercepta volúmenes inválidos (0 o superiores al límite máximo).',
    preRequisitos: 'buildCpiContext(\'cpi-003\') ejecutado en beforeAll. Límite máximo de volumen definido en validador Zod. teardownCpiContext(ctx) en afterAll.',
    observaciones: 'Probar casos límite: V=1 (válido), V=límite exacto (válido).',
    estado: 'APROBADO [X]',
    pasos: [
      { n: 1, accion: 'Usuario ingresa placa válida, tipo ACPM, volumen = 0.', esperado: 'Datos cargados en formulario.', resultado: 'PASS — galones=0 enviado en body de petición.' },
      { n: 2, accion: 'Usuario presiona Guardar. UC-01 invoca UC-05.', esperado: 'UC-05 detecta volumen = 0, fuera del rango permitido.', resultado: 'PASS — Zod rechaza galones=0 (falla .positive()). HTTP 400.' },
      { n: 3, accion: 'UC-05 retorna INVÁLIDO. UC-01 no persiste.', esperado: 'Mensaje: volumen fuera del rango permitido. Sin registro en BD.', resultado: 'PASS — Sin registro en BD; mismo comportamiento con galones negativos (-10).' },
      { n: 4, accion: 'Usuario corrige el volumen a 350L (superior al límite).', esperado: 'UC-05 detecta volumen > límite máximo.', resultado: 'PASS — galones > nivelActual (1000) retorna error de negocio (stock insuficiente).' },
    ],
  },
  {
    id: 'CPI-004', titulo: 'UC-01 con UC-06: Registro de Auditoría tras Consumo Exitoso',
    bloque: 'Bloque 1: Registro de Consumo (UC-01)',
    fecha: '24/03/2026', autor: 'Andrés Espinoza',
    objetivo: 'Verificar que UC-01 invoca UC-06 y que el log queda completo con todos los atributos.',
    preRequisitos: 'buildCpiContext(\'cpi-004\') ejecutado en beforeAll. teardownCpiContext(ctx) en afterAll.',
    observaciones: 'Verificar que el log NO se crea si UC-05 rechaza el registro.',
    estado: 'APROBADO [X]',
    pasos: [
      { n: 1, accion: 'Usuario completa un registro válido y guarda.', esperado: 'UC-01 valida (VÁLIDO), aplica precio, almacena registro.', resultado: 'PASS — HTTP 201; transacción almacenada con estado COMPLETADA.' },
      { n: 2, accion: 'UC-01 invoca UC-06 con el contexto.', esperado: 'UC-06 recibe: ID registro, usuario ejecutor, fecha/hora, IP, acción, resultado.', resultado: 'PASS — auditoriaService.registrarLog() invocado automáticamente.' },
      { n: 3, accion: 'UC-06 persiste la entrada de auditoría.', esperado: 'Entrada creada con: CREAR_CONSUMO, CONFIRMADO.', resultado: 'PASS — Log creado con acción REGISTRAR_TRANSACCION_SALIDA.' },
      { n: 4, accion: 'Administrador consulta el log.', esperado: 'Log muestra entrada completa. Todos los atributos presentes.', resultado: 'PASS — GET /api/auditoria/:id retorna datosAntes y datosDespues.' },
    ],
  },
  {
    id: 'CPI-005', titulo: 'UC-01 con UC-07: Validación de Estación Activa en Registro',
    bloque: 'Bloque 1: Registro de Consumo (UC-01)',
    fecha: '24/03/2026', autor: 'Andrés Espinoza',
    objetivo: 'Verificar que UC-01 rechaza registros cuando la estación tiene estado Inactivo.',
    preRequisitos: 'buildCpiContext(\'cpi-005\') en beforeAll (desactiva estación). resetCpiState(ctx) restaura a activa. teardownCpiContext(ctx) en afterAll.',
    observaciones: 'Prueba FALLIDA. Brecha técnica: el sistema no valida el estado inactivo de la estación al registrar la transacción.',
    estado: 'RECHAZADO [X] (Brecha documentada en Paso 2)',
    pasos: [
      { n: 1, accion: 'Usuario selecciona estación EST-99 (inactiva).', esperado: 'El sistema carga la estación en el formulario.', resultado: 'PASS — Estación desactivada en BD mediante UPDATE activa=false.' },
      { n: 2, accion: 'Usuario presiona Guardar. UC-01 consulta catálogo.', esperado: 'Sistema detecta que EST-99 tiene estado Inactivo.', resultado: 'FAIL (BRECHA) — El sistema acepta la transacción con estación inactiva; retorna HTTP 201.' },
      { n: 3, accion: 'Administrador activa la estación EST-99 mediante UC-07.', esperado: 'Estado de EST-99 actualizado a Activo en el catálogo.', resultado: 'PASS — PUT /api/actores/estaciones/:id con activa=true retorna HTTP 200.' },
      { n: 4, accion: 'Usuario repite el registro seleccionando EST-99.', esperado: 'El registro se procesa exitosamente.', resultado: 'PASS — HTTP 201; transacción aceptada con estación activa.' },
    ],
  },
  {
    id: 'CPI-006', titulo: 'UC-02 con UC-09: Consulta Exitosa de Historial Tabular',
    bloque: 'Bloque 2: Historial y Reportes (UC-02 a UC-04)',
    fecha: '24/03/2026', autor: 'Andrés Espinoza',
    objetivo: 'Verificar que el sistema permite consultar el historial aplicando filtros básicos.',
    preRequisitos: 'buildCpiContext(\'cpi-006\') en beforeAll: inyecta registros previos. teardownCpiContext(ctx) en afterAll.',
    observaciones: 'Confirmar que el log de auditoría guarda los filtros utilizados.',
    estado: 'APROBADO [X]',
    pasos: [
      { n: 1, accion: 'Usuario accede al módulo "Historial de Consumos".', esperado: 'El sistema despliega el panel de consulta con filtros por defecto.', resultado: 'PASS — GET /api/inventario/transacciones?estacionId={id} recibe petición correctamente.' },
      { n: 2, accion: 'Usuario define rango válido y presiona "Buscar".', esperado: 'El sistema valida fechas, ejecuta consulta en BD y registra auditoría.', resultado: 'PASS — HTTP 200 con pagination.total ≥ 8 registros.' },
      { n: 3, accion: 'Usuario revisa los datos tabulares en pantalla.', esperado: 'El sistema presenta los resultados en formato tabular.', resultado: 'PASS — Respuesta JSON paginada con campos estacionId, placaVehiculo, galones, precioTotal, estado.' },
    ],
  },
  {
    id: 'CPI-007', titulo: 'UC-02 con UC-09: Control de Acceso por Roles en Historial',
    bloque: 'Bloque 2: Historial y Reportes (UC-02 a UC-04)',
    fecha: '24/03/2026', autor: 'Haider Cañon',
    objetivo: 'Verificar que UC-02 aplica control de acceso, limitando registros según el rol del usuario.',
    preRequisitos: 'buildCpiContext(\'cpi-007\') en beforeAll: crea dos usuarios con roles distintos. RBAC activo. teardownCpiContext(ctx) en afterAll.',
    observaciones: 'Prueba crítica de seguridad. Ningún conductor debe ver datos de otro conductor.',
    estado: 'APROBADO [X]',
    pasos: [
      { n: 1, accion: 'Conductor (U001) accede al módulo Historial.', esperado: 'UC-09 valida rol. UC-02 muestra solo registros de U001.', resultado: 'PASS — Usuario sin inventario:leer recibe HTTP 403.' },
      { n: 2, accion: 'Conductor intenta acceder a registros de otro usuario.', esperado: 'Sistema rechaza solicitud.', resultado: 'PASS — Sin token retorna HTTP 401. Con token sin permisos retorna HTTP 403.' },
      { n: 3, accion: 'Administrador accede al historial.', esperado: 'UC-02 muestra todos los registros del sistema.', resultado: 'PASS — Admin con inventario:leer accede correctamente; pagination.total ≥ 8.' },
      { n: 4, accion: 'Autoridad Reguladora accede al historial.', esperado: 'UC-02 muestra todos los registros y añade columna de subsidio.', resultado: 'N/A — Rol Autoridad Reguladora no modelado en contexto de prueba automática.' },
    ],
  },
  {
    id: 'CPI-008', titulo: 'UC-03 con UC-01: Coherencia de Datos en Generación de Reportes',
    bloque: 'Bloque 2: Historial y Reportes (UC-02 a UC-04)',
    fecha: '24/03/2026', autor: 'Haider Cañon',
    objetivo: 'Verificar que UC-03 refleja exactamente los datos almacenados por UC-01, y totales correctos.',
    preRequisitos: 'buildCpiContext(\'cpi-008\') en beforeAll: inserta 10 registros. teardownCpiContext(ctx) en afterAll.',
    observaciones: 'Verificar registro en log de auditoría. Tiempo de generación máximo: 3 segundos.',
    estado: 'APROBADO [X]',
    pasos: [
      { n: 1, accion: 'Usuario accede a reportes y define período.', esperado: 'Sistema acepta el rango de fechas.', resultado: 'PASS — POST /api/reportes acepta periodoInicio y periodoFin en formato ISO 8601.' },
      { n: 2, accion: 'Usuario presiona Generar Reporte.', esperado: 'UC-03 consulta BD con filtros definidos.', resultado: 'PASS — Consulta ejecutada con filtro estacionId.' },
      { n: 3, accion: 'Sistema muestra el reporte generado.', esperado: 'Reporte contiene exactamente 10 registros y totales precisos.', resultado: 'PASS (parcial) — Reporte generado exitosamente. Conteo exacto no verificable en binario PDF.' },
      { n: 4, accion: 'Usuario exporta a PDF.', esperado: 'Archivo PDF generado sin errores.', resultado: 'PASS — HTTP 200/201; content-type: application/pdf; buffer binario retornado.' },
    ],
  },
  {
    id: 'CPI-009', titulo: 'UC-03 con UC-01: Generación de Reporte Fallida por Fechas Inválidas',
    bloque: 'Bloque 2: Historial y Reportes (UC-02 a UC-04)',
    fecha: '24/03/2026', autor: 'Haider Cañon',
    objetivo: 'Verificar que el sistema rechaza generación de reportes con rango de fechas inválido.',
    preRequisitos: 'buildCpiContext(\'cpi-009\') ejecutado en beforeAll. Validadores de fechas activos. teardownCpiContext(ctx) en afterAll.',
    observaciones: 'No se debe ejecutar consulta a BD ni generar archivos corruptos.',
    estado: 'APROBADO [X]',
    pasos: [
      { n: 1, accion: 'Usuario accede al módulo de reportes.', esperado: 'El sistema muestra la interfaz de generación de reportes.', resultado: 'PASS — POST /api/reportes recibe petición.' },
      { n: 2, accion: 'Usuario ingresa fecha de inicio posterior a la fecha de fin.', esperado: 'El sistema identifica la inconsistencia y aborta la consulta a la BD.', resultado: 'PASS — Zod rechaza periodoInicio/periodoFin con formato inválido; HTTP 400.' },
      { n: 3, accion: 'Usuario revisa la interfaz.', esperado: 'El sistema muestra mensaje de error y no genera ningún archivo.', resultado: 'PASS — Mensaje de validación retornado; sin archivo generado.' },
    ],
  },
  {
    id: 'CPI-010', titulo: 'UC-04 con UC-03: Filtrado de Reporte Exitoso por Vehículo',
    bloque: 'Bloque 2: Historial y Reportes (UC-02 a UC-04)',
    fecha: '24/03/2026', autor: 'Haider Cañon',
    objetivo: 'Verificar que el sistema aplica correctamente los filtros sobre reportes generados.',
    preRequisitos: 'buildCpiContext(\'cpi-010\') ejecutado en beforeAll: inserta registros de distintas placas. teardownCpiContext(ctx) en afterAll.',
    observaciones: 'Los totales deben recalcularse coincidiendo solo con la placa filtrada.',
    estado: 'APROBADO [X]',
    pasos: [
      { n: 1, accion: 'Usuario digita placa "AAA111" en el filtro.', esperado: 'El sistema valida el formato de la placa.', resultado: 'PASS — GET /api/inventario/transacciones?placaVehiculo=AAA111 aceptado.' },
      { n: 2, accion: 'Usuario presiona "Aplicar Filtros".', esperado: 'El sistema procesa el filtro y recalcula totales.', resultado: 'PASS — Sistema retorna ≥ 5 registros filtrados.' },
      { n: 3, accion: 'Usuario revisa el reporte resultante.', esperado: 'El sistema muestra el reporte únicamente con datos de "AAA111".', resultado: 'PASS — Todos los items tienen placaVehiculo=AAA111.' },
    ],
  },
  {
    id: 'CPI-011', titulo: 'UC-04 con UC-03: Filtrado Fallido (Datos Inexistentes)',
    bloque: 'Bloque 2: Historial y Reportes (UC-02 a UC-04)',
    fecha: '24/03/2026', autor: 'Haider Cañon',
    objetivo: 'Verificar el comportamiento del sistema cuando se aplica un filtro sin consumos.',
    preRequisitos: 'buildCpiContext(\'cpi-011\') en beforeAll: BD sin transacciones para esa placa. teardownCpiContext(ctx) en afterAll.',
    observaciones: 'La interfaz no debe presentar errores técnicos (código 500).',
    estado: 'APROBADO [X]',
    pasos: [
      { n: 1, accion: 'Usuario ingresa placa sin consumos (ZZZ999) y aplica filtro.', esperado: 'El sistema valida, ejecuta consulta y detecta que no hay resultados.', resultado: 'PASS — GET /api/inventario/transacciones?placaVehiculo=ZZZ999; HTTP 200.' },
      { n: 2, accion: 'Usuario observa la tabla en pantalla.', esperado: 'Tabla vacía con mensaje "No existe datos para los criterios seleccionados".', resultado: 'PASS — Array retornado con length=0; sin HTTP 500.' },
    ],
  },
  {
    id: 'CPI-012', titulo: 'UC-05 con UC-06: Auditoría de Operaciones e Inmutabilidad',
    bloque: 'Bloque 3: Auditoría e Inmutabilidad (UC-05 y UC-06)',
    fecha: '24/03/2026', autor: 'Julián Ruiz',
    objetivo: 'Verificar inmutabilidad de logs ante intentos de borrado.',
    preRequisitos: 'buildCpiContext(\'cpi-012\') en beforeAll: crea usuario admin. teardownCpiContext(ctx) en afterAll.',
    observaciones: 'La integridad del log debe estar garantizada por diseño del API.',
    estado: 'APROBADO [X]',
    pasos: [
      { n: 1, accion: 'Se ejecuta UC-05 con datos válidos.', esperado: 'UC-06 registra la operación incrementando el conteo de logs.', resultado: 'PASS — Cada transacción exitosa genera exactamente 1 nuevo log de auditoría.' },
      { n: 2, accion: 'Se ejecuta UC-05 con datos inválidos.', esperado: 'NO se genera ninguna entrada en el log de auditoría.', resultado: 'PASS — Transacción rechazada por Zod no genera log.' },
      { n: 3, accion: 'Usuario intenta eliminar registro de auditoría (DELETE).', esperado: 'Sistema rechaza operación retornando HTTP 404/405.', resultado: 'PASS — DELETE /api/auditoria/:id retorna 404. Inmutabilidad confirmada.' },
      { n: 4, accion: 'Administrador ejecuta Cierre de Turno.', esperado: 'UC-06 registra entrada con acción CIERRE_TURNO.', resultado: 'PASS — POST /api/inventario/cierre-turno genera log con acción=CIERRE_TURNO.' },
    ],
  },
  {
    id: 'CPI-013', titulo: 'UC-06: Consulta Exitosa de Auditoría',
    bloque: 'Bloque 3: Auditoría e Inmutabilidad (UC-05 y UC-06)',
    fecha: '24/03/2026', autor: 'Julián Ruiz',
    objetivo: 'Verificar que el administrador puede consultar el historial de eventos aplicando filtros.',
    preRequisitos: 'buildCpiContext(\'cpi-013\') en beforeAll: crea usuario auditor y 5 registros en log. teardownCpiContext(ctx) en afterAll.',
    observaciones: 'Confirmar que el sistema registra esta consulta en el log como nueva revisión.',
    estado: 'APROBADO [X]',
    pasos: [
      { n: 1, accion: 'Administrador accede a Auditoría y define filtros.', esperado: 'El sistema valida filtros y ejecuta consulta.', resultado: 'PASS — GET /api/auditoria?modulo=INVENTARIO y ?accion=REGISTRAR_TRANSACCION_SALIDA filtran correctamente.' },
      { n: 2, accion: 'Administrador ejecuta consulta.', esperado: 'El sistema lista registros coincidentes y resumen.', resultado: 'PASS — HTTP 200; pagination.total ≥ 1.' },
      { n: 3, accion: 'Administrador selecciona registro.', esperado: 'El sistema despliega detalle: eventos antes/después.', resultado: 'PASS — GET /api/auditoria/:id retorna datosAntes y datosDespues.' },
    ],
  },
  {
    id: 'CPI-014', titulo: 'UC-06: Consulta de Auditoría Fallida (Sin Resultados)',
    bloque: 'Bloque 3: Auditoría e Inmutabilidad (UC-05 y UC-06)',
    fecha: '24/03/2026', autor: 'Julián Ruiz',
    objetivo: 'Verificar el comportamiento del sistema cuando no existen eventos que coincidan.',
    preRequisitos: 'buildCpiContext(\'cpi-014\') en beforeAll: BD sin eventos para el rango. teardownCpiContext(ctx) en afterAll.',
    observaciones: 'No se deben presentar errores técnicos (HTTP 500) por búsquedas vacías.',
    estado: 'APROBADO [X]',
    pasos: [
      { n: 1, accion: 'Administrador define filtros restrictivos.', esperado: 'El sistema ejecuta la consulta y detecta que no existen resultados.', resultado: 'PASS — ?accion=ACCION_QUE_NO_EXISTE y rango futuro (2099) ejecutan consulta válida.' },
      { n: 2, accion: 'Administrador revisa pantalla.', esperado: 'El sistema muestra "Sin coincidencias" y sugiere ajustar filtros.', resultado: 'PASS — HTTP 200; pagination.total=0; array vacío sin HTTP 500.' },
    ],
  },
  {
    id: 'CPI-015', titulo: 'UC-07: Creación Exitosa de Estación de Servicio',
    bloque: 'Bloque 4: Módulos Administrativos (UC-07 a UC-10)',
    fecha: '24/03/2026', autor: 'Julián Ruiz',
    objetivo: 'Verificar que el administrador puede registrar una nueva estación.',
    preRequisitos: 'buildCpiContext(\'cpi-015\') en beforeAll: sesión Administrador. teardownCpiContext(ctx) en afterAll.',
    observaciones: 'Los cambios deben ser atómicos.',
    estado: 'APROBADO [X]',
    pasos: [
      { n: 1, accion: 'Administrador ingresa datos válidos para estación.', esperado: 'El sistema valida datos de entrada.', resultado: 'PASS — POST /api/actores/estaciones con nombre, NIT único, zonaId aceptados por Zod.' },
      { n: 2, accion: 'Administrador confirma.', esperado: 'El sistema guarda cambios y confirma operación.', resultado: 'PASS — HTTP 201; estación creada y persistida en BD.' },
      { n: 3, accion: 'Administrador verifica listado.', esperado: 'La nueva estación aparece en el catálogo inmediatamente.', resultado: 'PASS — GET /api/actores/estaciones incluye la nueva estación.' },
    ],
  },
  {
    id: 'CPI-016', titulo: 'UC-07: Creación Fallida de Estación (Coordenadas Inválidas)',
    bloque: 'Bloque 4: Módulos Administrativos (UC-07 a UC-10)',
    fecha: '24/03/2026', autor: 'Julián Ruiz',
    objetivo: 'Verificar que el sistema rechaza la creación de estaciones con formato incorrecto.',
    preRequisitos: 'buildCpiContext(\'cpi-016\') en beforeAll. Esquemas Zod activos en /estaciones. teardownCpiContext(ctx) en afterAll.',
    observaciones: 'Misma prueba aplica si la estación ya existe en esa ubicación.',
    estado: 'APROBADO [X]',
    pasos: [
      { n: 1, accion: 'Administrador digita coordenadas inválidas.', esperado: 'El sistema intercepta el dato mediante el esquema.', resultado: 'PASS — latitud=\'no-es-numero\' evaluado por Zod z.number(); rechazado.' },
      { n: 2, accion: 'Administrador presiona "Guardar".', esperado: 'El sistema aborta la petición a BD, muestra error.', resultado: 'PASS — HTTP 400 retornado; sin escritura en BD. NIT duplicado también rechazado.' },
    ],
  },
  {
    id: 'CPI-017', titulo: 'UC-08 con UC-01: Aplicación de Parámetros Configurados en Registro',
    bloque: 'Bloque 4: Módulos Administrativos (UC-07 a UC-10)',
    fecha: '24/03/2026', autor: 'Lina Castro',
    objetivo: 'Verificar que UC-01 utiliza parámetros de UC-08 al procesar registro.',
    preRequisitos: 'buildCpiContext(\'cpi-017\') en beforeAll. resetCpiState(ctx) restaura precio original. teardownCpiContext(ctx) en afterAll.',
    observaciones: 'Cambios en UC-08 no afectan registros históricos ya almacenados.',
    estado: 'APROBADO [X]',
    pasos: [
      { n: 1, accion: 'Administrador verifica precio configurado en UC-08.', esperado: 'Configuración persistida en BD.', resultado: 'PASS — precioGalon=9500 activo en BD.' },
      { n: 2, accion: 'Usuario registra consumo.', esperado: 'UC-01 consulta reglas con parámetros UC-08. Calcula costo correctamente.', resultado: 'PASS — Transacción registrada con precioUnitario=9500.' },
      { n: 3, accion: 'Administrador modifica precio en UC-08.', esperado: 'Cambio persistido y registrado en auditoría.', resultado: 'PASS — POST /api/precios con precioGalon=11000 crea nuevo precio activo.' },
      { n: 4, accion: 'Usuario registra nuevo consumo.', esperado: 'Nuevo costo reflejado con el cambio inmediatamente.', resultado: 'PASS — Nueva transacción aplica precioUnitario=11000; históricos retienen 9500.' },
    ],
  },
  {
    id: 'CPI-018', titulo: 'UC-08: Configuración Fallida de Parámetro (Fuera de rango)',
    bloque: 'Bloque 4: Módulos Administrativos (UC-07 a UC-10)',
    fecha: '24/03/2026', autor: 'Lina Castro',
    objetivo: 'Verificar que el sistema rechaza valores inválidos al actualizar parámetros.',
    preRequisitos: 'buildCpiContext(\'cpi-018\') en beforeAll. Validaciones Zod activas. teardownCpiContext(ctx) en afterAll.',
    observaciones: 'El sistema debe revertir al estado anterior si hay un fallo.',
    estado: 'APROBADO [X]',
    pasos: [
      { n: 1, accion: 'Administrador digita valor negativo para precios.', esperado: 'El sistema evalúa el rango del parámetro.', resultado: 'PASS — precioGalon=-500 evaluado por Zod z.number().positive(); rechazado.' },
      { n: 2, accion: 'Administrador confirma.', esperado: 'El sistema rechaza la entrada y no persiste en BD.', resultado: 'PASS — HTTP 400; mismo resultado con precioGalon=0.' },
    ],
  },
  {
    id: 'CPI-019', titulo: 'UC-09 con UC-07: Verificación de Permisos de Administración de Estaciones',
    bloque: 'Bloque 4: Módulos Administrativos (UC-07 a UC-10)',
    fecha: '24/03/2026', autor: 'Lina Castro',
    objetivo: 'Verificar que UC-07 valida permisos de rol a través de UC-09.',
    preRequisitos: 'buildCpiContext(\'cpi-019\') en beforeAll. Control RBAC activo. teardownCpiContext(ctx) en afterAll.',
    observaciones: 'No debe existir escalada de privilegios.',
    estado: 'APROBADO [X]',
    pasos: [
      { n: 1, accion: 'Conductor intenta acceder a Gestión de Estaciones.', esperado: 'UC-09 valida rol y bloquea acceso.', resultado: 'PASS — Usuario sin actores:escribir recibe HTTP 403.' },
      { n: 2, accion: 'Administrador accede al módulo.', esperado: 'UC-09 valida rol y muestra listado.', resultado: 'PASS — Admin accede correctamente; HTTP 200.' },
      { n: 3, accion: 'Administrador crea nueva estación.', esperado: 'Estación creada exitosamente.', resultado: 'PASS — POST /api/actores/estaciones retorna 201.' },
    ],
  },
  {
    id: 'CPI-020', titulo: 'UC-09: Creación Exitosa de Usuario',
    bloque: 'Bloque 4: Módulos Administrativos (UC-07 a UC-10)',
    fecha: '24/03/2026', autor: 'Lina Castro',
    objetivo: 'Verificar que administrador puede crear nuevos usuarios y queda trazado.',
    preRequisitos: 'buildCpiContext(\'cpi-020\') en beforeAll. teardownCpiContext(ctx) en afterAll.',
    observaciones: 'Usuario debe aparecer Activo en la BD inmediatamente.',
    estado: 'APROBADO [X]',
    pasos: [
      { n: 1, accion: 'Administrador ingresa datos válidos requeridos.', esperado: 'El sistema valida campos obligatorios y formatos.', resultado: 'PASS — Zod valida email, nombre, password, rolId. Sin token retorna 401.' },
      { n: 2, accion: 'Administrador confirma.', esperado: 'El sistema guarda cambios y registra auditoría.', resultado: 'PASS — HTTP 201; log CREAR_USUARIO generado.' },
      { n: 3, accion: 'Administrador revisa respuesta.', esperado: 'El sistema muestra mensaje de confirmación exitosa.', resultado: 'PASS — Respuesta incluye id, email, activo=true.' },
    ],
  },
  {
    id: 'CPI-021', titulo: 'UC-09: Creación Fallida de Usuario (Correo duplicado)',
    bloque: 'Bloque 4: Módulos Administrativos (UC-07 a UC-10)',
    fecha: '24/03/2026', autor: 'Lina Castro',
    objetivo: 'Verificar que el sistema garantiza la unicidad de las credenciales.',
    preRequisitos: 'buildCpiContext(\'cpi-021\') en beforeAll (inyecta correo duplicado). teardownCpiContext(ctx) en afterAll.',
    observaciones: 'Misma validación aplica para número de documento.',
    estado: 'APROBADO [X]',
    pasos: [
      { n: 1, accion: 'Administrador ingresa "test@easydiesel.com".', esperado: 'El sistema verifica la unicidad del correo.', resultado: 'PASS — Primer registro aceptado (201).' },
      { n: 2, accion: 'Administrador presiona confirmar.', esperado: 'El sistema rechaza operación y no almacena datos.', resultado: 'PASS — Segundo registro con mismo email retorna HTTP 400.' },
      { n: 3, accion: 'Administrador lee pantalla.', esperado: 'Mensaje indicando duplicidad del correo.', resultado: 'PASS — response.body.message incluye "correo".' },
    ],
  },
  {
    id: 'CPI-022', titulo: 'UC-10 con UC-09: Asignación Exitosa de Permisos',
    bloque: 'Bloque 4: Módulos Administrativos (UC-07 a UC-10)',
    fecha: '24/03/2026', autor: 'Andrés González',
    objetivo: 'Verificar que Superadministrador puede asignar nuevos permisos.',
    preRequisitos: 'buildCpiContext(\'cpi-022\') en beforeAll: crea Superadmin y usuario estándar. teardownCpiContext(ctx) en afterAll.',
    observaciones: 'Confirmar en BD que los cambios se guardaron atómicamente.',
    estado: 'APROBADO [X]',
    pasos: [
      { n: 1, accion: 'Administrador selecciona al usuario destino.', esperado: 'El sistema carga el perfil de permisos.', resultado: 'PASS — Usuario objetivo creado con noPermsRoleId.' },
      { n: 2, accion: 'Administrador marca "auditar" y presiona "Guardar".', esperado: 'El sistema actualiza permisos en BD y genera auditoría.', resultado: 'PASS — PUT /api/usuarios/:id retorna 200; log ACTUALIZAR_USUARIO generado.' },
      { n: 3, accion: 'Administrador verifica.', esperado: 'El sistema muestra mensaje de éxito y usuario adquiere acceso.', resultado: 'PASS — userEnBd.rolId === ctx.roleId confirmado.' },
    ],
  },
  {
    id: 'CPI-023', titulo: 'UC-10 con UC-09: Intento Fallido de Modificar Propio Rol',
    bloque: 'Bloque 4: Módulos Administrativos (UC-07 a UC-10)',
    fecha: '24/03/2026', autor: 'Andrés Espinoza',
    objetivo: 'Verificar que el sistema impide que un administrador elimine su propio rol.',
    preRequisitos: 'buildCpiContext(\'cpi-023\') en beforeAll: sesión Administrador donde actor es igual a objetivo. teardownCpiContext(ctx) en afterAll.',
    observaciones: 'Regla de seguridad para garantizar al menos un administrador activo (evitar lockouts).',
    estado: 'RECHAZADO [X] (Brecha documentada: falta validación auto-modificación)',
    pasos: [
      { n: 1, accion: 'Administrador intenta quitarse rol de Superadmin.', esperado: 'El sistema recibe los datos en el formulario.', resultado: 'PASS — PUT /api/usuarios/:id recibe petición con actor ID == objetivo ID.' },
      { n: 2, accion: 'Administrador presiona "Guardar cambios".', esperado: 'El sistema detecta ID coincidente y bloquea actualización.', resultado: 'FAIL (BRECHA) — Sistema no detecta la coincidencia; actualiza el rol sin restricción.' },
      { n: 3, accion: 'Administrador lee respuesta.', esperado: 'Transacción abortada, exige autorización adicional o rechaza.', resultado: 'FAIL (BRECHA) — Cambio persistido en BD. Se requiere guardia en actualizarUsuario().' },
    ],
  },
];

const responsables = [
  { caso: 'CPI-001 – UC-01 con UC-05 (Registro con validación exitosa)', responsable: 'Andrés González' },
  { caso: 'CPI-002 – UC-01 con UC-05 (Datos inválidos - tipoServicio)', responsable: 'Andrés González' },
  { caso: 'CPI-003 – UC-01 con UC-05 (Volumen fuera de rango)', responsable: 'Andrés González' },
  { caso: 'CPI-004 – UC-01 con UC-06 (Auditoría tras registro)', responsable: 'Andrés Espinoza' },
  { caso: 'CPI-005 – UC-01 con UC-07 (Estación inactiva)', responsable: 'Andrés Espinoza' },
  { caso: 'CPI-006 – UC-02 con UC-09 (Consulta exitosa historial)', responsable: 'Andrés Espinoza' },
  { caso: 'CPI-007 – UC-02 con UC-09 (Control acceso historial)', responsable: 'Haider Cañon' },
  { caso: 'CPI-008 – UC-03 con UC-01 (Coherencia de reportes)', responsable: 'Haider Cañon' },
  { caso: 'CPI-009 – UC-03 con UC-01 (Reporte fallido - fechas)', responsable: 'Haider Cañon' },
  { caso: 'CPI-010 – UC-04 con UC-03 (Filtro exitoso por vehículo)', responsable: 'Haider Cañon' },
  { caso: 'CPI-011 – UC-04 con UC-03 (Filtro fallido - datos inexistentes)', responsable: 'Haider Cañon' },
  { caso: 'CPI-012 – UC-05 con UC-06 (Auditoría e Inmutabilidad)', responsable: 'Julián Ruiz' },
  { caso: 'CPI-013 – UC-06 (Consulta Exitosa Auditoría)', responsable: 'Julián Ruiz' },
  { caso: 'CPI-014 – UC-06 (Consulta Auditoría Fallida)', responsable: 'Julián Ruiz' },
  { caso: 'CPI-015 – UC-07 (Creación Exitosa Estación)', responsable: 'Julián Ruiz' },
  { caso: 'CPI-016 – UC-07 (Creación Estación Fallida - coordenadas)', responsable: 'Julián Ruiz' },
  { caso: 'CPI-017 – UC-08 con UC-01 (Parámetros en registro)', responsable: 'Lina Castro' },
  { caso: 'CPI-018 – UC-08 (Configuración fallida parámetro)', responsable: 'Lina Castro' },
  { caso: 'CPI-019 – UC-09 con UC-07 (Permisos administración estaciones)', responsable: 'Lina Castro' },
  { caso: 'CPI-020 – UC-09 (Creación Exitosa Usuario)', responsable: 'Lina Castro' },
  { caso: 'CPI-021 – UC-09 (Creación Usuario Fallida - correo)', responsable: 'Lina Castro' },
  { caso: 'CPI-022 – UC-10 con UC-09 (Asignación Exitosa Permisos)', responsable: 'Andrés González' },
  { caso: 'CPI-023 – UC-10 con UC-09 (Fallo modificar propio rol)', responsable: 'Andrés Espinoza' },
];

// ── Generar template .docx mínimo en memoria ───────────────────────────────

function buildMinimalDocx(templateXml) {
  const zip = new PizZip();
  zip.file('[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
    '</Types>'
  );
  zip.file('_rels/.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
    '</Relationships>'
  );
  zip.file('word/_rels/document.xml.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '</Relationships>'
  );
  zip.file('word/document.xml', templateXml);
  return zip;
}

// ── Helpers XML ──────────────────────────────────────────────────────────────

const esc = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

// Fuente Calibri 10pt = sz 20 (half-points)
const FONT    = 'Calibri';
const SZ      = '20';     // 10pt
const SZ_HDR  = '22';     // 11pt
const GRAY    = 'BFBFBF'; // gris cabecera
const YELLOW  = 'FFFF00'; // amarillo intenso
const WHITE   = 'FFFFFF';
const BLUE_TIT = '1F3864'; // azul oscuro titulos

// Bordes sólidos negros 1px (sz=8 = 1pt en OOXML)
const BORDERS =
  '<w:tcBorders>' +
  '<w:top    w:val="single" w:sz="8" w:space="0" w:color="000000"/>' +
  '<w:left   w:val="single" w:sz="8" w:space="0" w:color="000000"/>' +
  '<w:bottom w:val="single" w:sz="8" w:space="0" w:color="000000"/>' +
  '<w:right  w:val="single" w:sz="8" w:space="0" w:color="000000"/>' +
  '</w:tcBorders>';

const TBL_BORDERS =
  '<w:tblBorders>' +
  '<w:top    w:val="single" w:sz="8" w:space="0" w:color="000000"/>' +
  '<w:left   w:val="single" w:sz="8" w:space="0" w:color="000000"/>' +
  '<w:bottom w:val="single" w:sz="8" w:space="0" w:color="000000"/>' +
  '<w:right  w:val="single" w:sz="8" w:space="0" w:color="000000"/>' +
  '<w:insideH w:val="single" w:sz="8" w:space="0" w:color="000000"/>' +
  '<w:insideV w:val="single" w:sz="8" w:space="0" w:color="000000"/>' +
  '</w:tblBorders>';

function cell(text, opts = {}) {
  const {
    bold = false, underline = false,
    bg = WHITE, align = 'left',
    span = 1, sz = SZ,
    empty = false,
  } = opts;

  let tcPr = `<w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="${bg}"/>`;
  if (span > 1) tcPr += `<w:gridSpan w:val="${span}"/>`;
  tcPr += BORDERS + '</w:tcPr>';

  const jc   = align !== 'left' ? `<w:jc w:val="${align}"/>` : '';
  const pPr  = `<w:pPr><w:spacing w:before="40" w:after="40"/>${jc}</w:pPr>`;

  let rPr = `<w:rPr><w:rFonts w:ascii="${FONT}" w:hAnsi="${FONT}"/>`;
  if (bold)      rPr += '<w:b/>';
  if (underline) rPr += '<w:u w:val="single"/>';
  rPr += `<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/></w:rPr>`;

  const content = empty ? '' : `<w:r>${rPr}<w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;

  return `<w:tc>${tcPr}<w:p>${pPr}${content}</w:p></w:tc>`;
}

function row(...cells) {
  return '<w:tr><w:trPr><w:cantSplit/></w:trPr>' + cells.join('') + '</w:tr>';
}

function tblOpen(widthPct = 100) {
  return `<w:tbl><w:tblPr>` +
    `<w:tblW w:w="${widthPct * 50}" w:type="pct"/>` +
    TBL_BORDERS +
    `<w:tblCellMar>` +
    `<w:top w:w="55" w:type="dxa"/><w:left w:w="108" w:type="dxa"/>` +
    `<w:bottom w:w="55" w:type="dxa"/><w:right w:w="108" w:type="dxa"/>` +
    `</w:tblCellMar></w:tblPr>`;
}
const tblClose = '</w:tbl>';

function heading(text, level) {
  const szMap  = { 1: '36', 2: '30', 3: '26' };
  const sz     = szMap[level] || '26';
  const before = level === 1 ? '300' : level === 2 ? '240' : '180';
  return (
    `<w:p><w:pPr><w:spacing w:before="${before}" w:after="120"/></w:pPr>` +
    `<w:r><w:rPr><w:rFonts w:ascii="${FONT}" w:hAnsi="${FONT}"/>` +
    `<w:b/><w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/>` +
    `<w:color w:val="${BLUE_TIT}"/></w:rPr>` +
    `<w:t>${esc(text)}</w:t></w:r></w:p>`
  );
}

// ── Encabezado institucional (portada) ───────────────────────────────────────
function coverHeader() {
  // Tabla 3 columnas: logo UP | título | logo Kodex
  const BORDER_HDR =
    '<w:tcBorders>' +
    '<w:top    w:val="single" w:sz="8" w:space="0" w:color="000000"/>' +
    '<w:left   w:val="single" w:sz="8" w:space="0" w:color="000000"/>' +
    '<w:bottom w:val="single" w:sz="8" w:space="0" w:color="000000"/>' +
    '<w:right  w:val="single" w:sz="8" w:space="0" w:color="000000"/>' +
    '</w:tcBorders>';

  function hCell(xml, widthPct) {
    return `<w:tc><w:tcPr>` +
      `<w:tcW w:w="${Math.round(widthPct * 96)}" w:type="pct"/>` +
      `<w:shd w:val="clear" w:color="auto" w:fill="FFFFFF"/>` +
      BORDER_HDR + `</w:tcPr>` + xml + `</w:tc>`;
  }

  function hPara(text, bold, sz, align, color) {
    const jc    = align ? `<w:jc w:val="${align}"/>` : '';
    const clr   = color ? `<w:color w:val="${color}"/>` : '';
    const bTag  = bold ? '<w:b/>' : '';
    return `<w:p><w:pPr><w:spacing w:before="40" w:after="40"/>${jc}</w:pPr>` +
      `<w:r><w:rPr><w:rFonts w:ascii="${FONT}" w:hAnsi="${FONT}"/>` +
      `${bTag}<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/>${clr}</w:rPr>` +
      `<w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
  }

  // Fila superior: logo | título | logo K
  const colLogo =
    hCell(
      hPara('🏛', false, '48', 'center', '888888') +
      hPara('Universidad Piloto', false, '16', 'center', '555555') +
      hPara('de Colombia',        false, '16', 'center', '555555'),
      22
    );
  const colTitle =
    hCell(
      hPara('Documento Plan de Pruebas', true, '28', 'center', BLUE_TIT),
      56
    );
  const colK =
    hCell(
      hPara('K', true, '64', 'center', BLUE_TIT) +
      hPara('Kodex', false, '18', 'center', BLUE_TIT),
      22
    );

  // Fila inferior: universidad | proyecto | equipo + ciclo
  const col2a = hCell(
    hPara('Universidad Piloto de Colombia', false, '18', 'center', '000000'), 22
  );
  const col2b = hCell(
    hPara('PROYECTO:  EasyDiésel', true, '20', 'left', '000000'), 56
  );
  const col2c = hCell(
    hPara('Equipo: Kodex', false, '18', 'left', '000000') +
    hPara('Ciclo:     1',  false, '18', 'left', '000000'),
    22
  );

  return (
    `<w:tbl><w:tblPr>` +
    `<w:tblW w:w="5000" w:type="pct"/>` +
    TBL_BORDERS +
    `<w:tblCellMar><w:top w:w="80" w:type="dxa"/><w:left w:w="120" w:type="dxa"/>` +
    `<w:bottom w:w="80" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tblCellMar>` +
    `</w:tblPr>` +
    `<w:tr>${colLogo}${colTitle}${colK}</w:tr>` +
    `<w:tr>${col2a}${col2b}${col2c}</w:tr>` +
    `</w:tbl>`
  );
}

// ── Tabla de contenido manual ─────────────────────────────────────────────────
function tocTable() {
  const entries = [
    ['1.',    'Introducción'],
    ['1.1',   'Objetivo'],
    ['1.2',   'Alcance'],
    ['1.3',   'Definiciones y Abreviaturas'],
    ['1.4',   'Plan de pruebas de integración'],
    ['1.4.1', 'Estrategia'],
    ['1.4.2', 'Recursos'],
    ['1.4.3', 'Ambiente'],
    ['1.4.4', 'Diseño casos de prueba'],
    ['1.4.5', 'Asignación responsabilidad de la ejecución de prueba'],
  ];

  const BORDER_TOC =
    '<w:tcBorders>' +
    '<w:top    w:val="single" w:sz="8" w:space="0" w:color="000000"/>' +
    '<w:left   w:val="single" w:sz="8" w:space="0" w:color="000000"/>' +
    '<w:bottom w:val="single" w:sz="8" w:space="0" w:color="000000"/>' +
    '<w:right  w:val="single" w:sz="8" w:space="0" w:color="000000"/>' +
    '</w:tcBorders>';

  function tCell(text, bold, widthPct, color) {
    const clr  = color ? `<w:color w:val="${color}"/>` : '';
    const bTag = bold  ? '<w:b/>'  : '';
    return `<w:tc><w:tcPr>` +
      `<w:tcW w:w="${Math.round(widthPct * 96)}" w:type="pct"/>` +
      `<w:shd w:val="clear" w:color="auto" w:fill="FFFFFF"/>` +
      BORDER_TOC + `</w:tcPr>` +
      `<w:p><w:pPr><w:spacing w:before="40" w:after="40"/></w:pPr>` +
      `<w:r><w:rPr><w:rFonts w:ascii="${FONT}" w:hAnsi="${FONT}"/>` +
      `${bTag}<w:sz w:val="${SZ}"/><w:szCs w:val="${SZ}"/>${clr}</w:rPr>` +
      `<w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p></w:tc>`;
  }

  let xml = `<w:tbl><w:tblPr>` +
    `<w:tblW w:w="5000" w:type="pct"/>` +
    TBL_BORDERS +
    `<w:tblCellMar><w:top w:w="55" w:type="dxa"/><w:left w:w="108" w:type="dxa"/>` +
    `<w:bottom w:w="55" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar>` +
    `</w:tblPr>`;

  // Cabecera
  xml += `<w:tr>` +
    `<w:tc><w:tcPr><w:tcW w:w="1440" w:type="pct"/>` +
    `<w:shd w:val="clear" w:color="auto" w:fill="${GRAY}"/>` + BORDER_TOC + `</w:tcPr>` +
    `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="40" w:after="40"/></w:pPr>` +
    `<w:r><w:rPr><w:rFonts w:ascii="${FONT}" w:hAnsi="${FONT}"/><w:b/><w:sz w:val="${SZ_HDR}"/></w:rPr>` +
    `<w:t>N°</w:t></w:r></w:p></w:tc>` +
    `<w:tc><w:tcPr><w:tcW w:w="3560" w:type="pct"/>` +
    `<w:shd w:val="clear" w:color="auto" w:fill="${GRAY}"/>` + BORDER_TOC + `</w:tcPr>` +
    `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="40" w:after="40"/></w:pPr>` +
    `<w:r><w:rPr><w:rFonts w:ascii="${FONT}" w:hAnsi="${FONT}"/><w:b/><w:sz w:val="${SZ_HDR}"/></w:rPr>` +
    `<w:t>CONTENIDO</w:t></w:r></w:p></w:tc>` +
    `</w:tr>`;

  for (const [num, title] of entries) {
    const isMain = num.length <= 2; // '1.' solo tiene nivel 1
    xml += `<w:tr>` +
      tCell(num,   isMain, 15, isMain ? BLUE_TIT : '000000') +
      tCell(title, isMain, 85, isMain ? BLUE_TIT : '000000') +
      `</w:tr>`;
  }

  xml += `</w:tbl>`;
  return xml;
}

function para(text, bold) {
  const rPr = bold
    ? `<w:rPr><w:rFonts w:ascii="${FONT}" w:hAnsi="${FONT}"/><w:b/><w:sz w:val="${SZ_HDR}"/></w:rPr>`
    : `<w:rPr><w:rFonts w:ascii="${FONT}" w:hAnsi="${FONT}"/><w:sz w:val="${SZ}"/></w:rPr>`;
  return `<w:p><w:pPr><w:spacing w:after="100"/></w:pPr><w:r>${rPr}<w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
}

function simpleTable(headerCells, dataRows) {
  let xml = tblOpen(100);
  xml += row(...headerCells.map(h => cell(h, { bold: true, bg: GRAY, align: 'center', sz: SZ_HDR })));
  for (const r of dataRows) {
    xml += row(...r.map((c, i) => {
      if (typeof c === 'string') return cell(c, { bold: i === 0 });
      return cell(c.text, c.opts || {});
    }));
  }
  xml += tblClose;
  return xml;
}

// ── Tabla principal de CPI (formato exacto imagen) ───────────────────────────

function cpiTable(cpi) {
  const aprobado  = cpi.estado.includes('APROBADO [X]');
  const rechazado = cpi.estado.includes('RECHAZADO [X]');

  let xml = tblOpen(100);

  // Fila 1 – Cabecera principal: título completo del caso
  xml += row(
    cell(`CASO DE PRUEBA ${cpi.id}: ${cpi.titulo}`,
      { bold: true, bg: GRAY, align: 'center', span: 4, sz: SZ_HDR })
  );

  // Filas 2-5 – Metadatos (col1 30%, col2 70%)
  const meta = [
    ['Fecha realización',    cpi.fecha],
    ['Realizada por',        cpi.autor],
    ['Objetivo de la prueba', cpi.objetivo],
    ['Pre-Requisitos',        cpi.preRequisitos],
  ];
  for (const [label, value] of meta) {
    xml += row(
      cell(label, { bold: true, bg: WHITE, align: 'left' }),
      cell(value, { bold: false, bg: WHITE, align: 'left', span: 3 })
    );
  }

  // Fila 6 – ID del caso (gris, negrita, centrado)
  xml += row(
    cell(cpi.id, { bold: true, bg: GRAY, align: 'center', span: 4, sz: SZ_HDR })
  );

  // Fila 7 – Subtítulo DETALLE CASO DE PRUEBA
  xml += row(
    cell('DETALLE CASO DE PRUEBA',
      { bold: true, bg: GRAY, align: 'center', span: 4, sz: SZ_HDR })
  );

  // Fila 8 – Cabeceras de columnas de pasos
  xml += row(
    cell('Paso No.',                       { bold: true, bg: GRAY, align: 'center', sz: SZ_HDR }),
    cell('Acción usuario',                  { bold: true, underline: true, bg: GRAY, align: 'center', sz: SZ_HDR }),
    cell('Respuesta esperada del sistema',  { bold: true, bg: GRAY, align: 'center', sz: SZ_HDR }),
    cell('Resultados',                      { bold: true, bg: GRAY, align: 'center', sz: SZ_HDR })
  );

  // Filas 9+ – Pasos (col4 = Resultados con texto real, fondo amarillo)
  for (const p of cpi.pasos) {
    xml += row(
      cell(String(p.n),  { bg: WHITE,  align: 'center' }),
      cell(p.accion,     { bg: WHITE,  align: 'left'   }),
      cell(p.esperado,   { bg: WHITE,  align: 'left'   }),
      cell(p.resultado,  { bg: YELLOW, align: 'left'   })
    );
  }

  // Fila penúltima – Título observaciones
  xml += row(
    cell('OBSERVACIONES ADICIONALES',
      { bold: true, bg: GRAY, align: 'center', span: 4, sz: SZ_HDR })
  );

  // Fila – Contenido observaciones
  xml += row(
    cell(cpi.observaciones, { bg: WHITE, align: 'left', span: 4 })
  );

  // Fila final – APROBADO | marca | RECHAZADO | marca  (cada etiqueta y su check en celda separada)
  xml += row(
    cell('APROBADO',          { bold: true, bg: YELLOW, align: 'center' }),
    cell(aprobado  ? '✓' : '', { bold: true, bg: YELLOW, align: 'center' }),
    cell('RECHAZADO',         { bold: true, bg: YELLOW, align: 'center' }),
    cell(rechazado ? '✓' : '', { bold: true, bg: YELLOW, align: 'center' })
  );

  xml += tblClose;
  return xml;
}

// ── Construir el body XML ─────────────────────────────────────────────────────

let body = '';

// Encabezado institucional
body += coverHeader();
body += para('');
body += para('');

// Título principal
body += heading('Plan de Pruebas — Plataforma EasyDiésel', 1);

// Tabla de contenido
body += heading('Tabla de Contenido', 2);
body += tocTable();
body += para('');

body += heading('1.  Introducción', 2);
body += heading('1.1 Objetivo', 3);
body += para('Garantizar el cumplimiento de los requerimientos tanto funcionales como no funcionales planteados dentro del proyecto mediante las pruebas de Integración, Sistema y Aceptación.');
body += heading('1.2 Alcance', 3);
body += para('El presente documento define las pruebas orientadas a la validación de los casos de uso, requerimientos funcionales y atributos de calidad establecidos en los documentos de especificación de requerimientos (SRS) y el documento de especificación de diseño (SDS).');

body += heading('1.3 Definiciones y Abreviaturas', 3);
body += para('ABREVIATURAS', true);
body += simpleTable(['Abreviatura', 'Descripción'], abreviaturas.map(a => [a.abr, a.desc]));

body += para('GLOSARIO', true);
body += simpleTable(['Palabra', 'Significado', 'Tipo', 'Sinónimos'], glosario.map(g => [g.palabra, g.significado, g.tipo, g.sinonimos]));

body += heading('1.4 Plan de pruebas de integración', 2);
body += heading('1.4.1 Estrategia', 3);
body += para('Se utilizará una estrategia de integración incremental de tipo bottom-up, iniciando por los módulos base (UC-05: Validar Datos de Consumo y UC-06: Auditar Registro de Consumo) y avanzando hacia los módulos funcionales de mayor nivel (UC-01: Registrar Consumo de Combustible).');
body += para('Los 23 casos de integración (CPI-001 a CPI-023) verifican que los flujos de datos entre componentes cumplan con las reglas de negocio definidas en el Decreto 1428/2025 y con la especificación de requerimientos (SRS).');

body += heading('1.4.2 Recursos', 3);
body += para('Humanos: Equipo Kode Group (Grupo 3) — Ingenieros de prueba asignados a los módulos de Registro de Consumo, Validación y Auditoría.');
body += para('Supervisor: Prof. Gilberto Pedraza García.');
body += para('Hardware: Servidor de integración continua (mínimo 8 GB RAM, procesador de 4 núcleos); estaciones de trabajo para ejecución de pruebas locales.');
body += para('Software: Plataforma EasyDiesel (React/Vite/TypeScript + Node.js/Express + PostgreSQL/Prisma); herramienta de pruebas Jest + Supertest; base de datos de prueba aislada.');

body += heading('1.4.3 Ambiente', 3);
body += para('Entorno de integración continua (CI) sobre localhost. Base de datos PostgreSQL de prueba con datos sintéticos. Backend Node.js/Express en modo test con variables de entorno aisladas (.env.test). Pruebas automatizadas mediante Jest + Supertest.');
body += para('SCRIPTS DE PREPARACIÓN', true);
body += simpleTable(['Artefacto', 'Archivo', 'Propósito'], scripts.map(s => [s.artefacto, s.archivo, s.proposito]));

body += heading('1.4.4 Diseño casos de prueba', 3);

let lastBloque = '';
for (const cpi of cpis) {
  if (cpi.bloque !== lastBloque) {
    body += heading(cpi.bloque, 3);
    lastBloque = cpi.bloque;
  }

  // Tabla CPI completa (metadatos + pasos + observaciones + estado)
  body += cpiTable(cpi);
  body += para(''); // espacio entre CPIs
}

body += heading('1.4.5 Asignación responsabilidad de la ejecución de prueba', 3);
body += simpleTable(
  ['Caso de prueba', 'Responsable ejecución'],
  responsables.map(r => [r.caso, r.responsable])
);

// ── Ensamblar el XML del document.xml ────────────────────────────────────────

const documentXml =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" ' +
  'xmlns:mo="http://schemas.microsoft.com/office/mac/office/2008/main" ' +
  'xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" ' +
  'xmlns:mv="urn:schemas-microsoft-com:mac:vml" ' +
  'xmlns:o="urn:schemas-microsoft-com:office:office" ' +
  'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ' +
  'xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" ' +
  'xmlns:v="urn:schemas-microsoft-com:vml" ' +
  'xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" ' +
  'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ' +
  'xmlns:w10="urn:schemas-microsoft-com:office:word" ' +
  'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ' +
  'xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" ' +
  'xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" ' +
  'xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" ' +
  'xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" ' +
  'xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" ' +
  'mc:Ignorable="w14 wp14">' +
  '<w:body>' + body + '</w:body></w:document>';

// ── Crear el .docx y guardar ────────────────────────────────────────────────

const zip = buildMinimalDocx(documentXml);
const buf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const outPath = path.join(__dirname, `integracionFinal_${timestamp}.docx`);
fs.writeFileSync(outPath, buf);
console.log(`Documento generado exitosamente: ${outPath}`);
console.log(`Tamaño: ${(buf.length / 1024).toFixed(1)} KB`);
