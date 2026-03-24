# ESPECIFICACIÓN DE CASOS DE PRUEBA
## PROYECTO: EasyDiesel
### Equipo: Grupo Easy_Kode
### Ciclo: 2

---

## CASO DE PRUEBA: TC-01 - Registro Exitoso de Consumo de Combustible
**Fecha realización:** 2026-03-23
**Objetivo de la prueba:** Validar el UC-01. Registrar Consumo de Combustible (Flujo Principal).
**Pre-Requisitos:**
- Ejecutar el Script `seed.ts` para poblar la base de datos con estaciones, vehículos y roles iniciales.
- Usuario autenticado con rol de "Estación de Servicio" o "Conductor".
- Conexión activa a la base de datos PostgreSQL.

### DETALLE CASO DE PRUEBA
| Paso No. | Acción usuario | Respuesta esperada del sistema | Resultados |
| :--- | :--- | :--- | :--- |
| 1 | Acceder al endpoint `/api/consumos/registrar` o módulo de interfaz correspondiente. | El sistema muestra el formulario o permite el envío de la petición. | **EXITOSO** (HTTP 201) |
| 2 | Ingresar una placa de vehículo registrada (ej: `ABC-123`). | El sistema valida la existencia del vehículo y recupera su tipo (Particular/Subsidio). | **EXITOSO** (Validado por lógica de negocio) |
| 3 | Seleccionar tipo de combustible (ACPM/Gasolina) e ingresar cantidad en galones. | El sistema calcula el precio total aplicando las reglas del **Decreto 1428** según la zona de la estación. | **EXITOSO** (Integrado con M4 y M5) |
| 4 | Confirmar el registro del consumo. | El sistema guarda la transacción en la base de datos, genera un ID único y retorna código 201 (Created). | **EXITOSO** (Confirmado en BD y Tanque) |
| 5 | Consultar el log de auditoría. | Se verifica que se generó un registro inmutable en el módulo M7 asociado a la operación realizada. | **EXITOSO** (Registro en `auditoria_log`) |

**OBSERVACIONES ADICIONALES:**
Esta prueba valida la integración entre el controlador de consumos, el servicio de cálculo de precios (M4), el motor de reglas (M5) y el módulo de auditoría (M7).
**Resultado Final: APROBADO** (Prueba ejecutada mediante Jest/Supertest el 2026-03-23)

---

## CASO DE PRUEBA: TC-02 - Validación de Límites de Subsidio (Precio Diferencial)
**Fecha realización:** 2026-03-23
**Realizada por:** IA Assistant (Trae IDE)
**Objetivo de la prueba:** Validar la aplicación automática de precios no subsidiados cuando se excede el cupo (UC-01 / M5).
**Pre-Requisitos:**
- Vehículo con cupo de subsidio casi agotado registrado en la base de datos.
- Precios de zona configurados para "Subsidiado" y "Pleno".

### DETALLE CASO DE PRUEBA
| Paso No. | Acción usuario | Respuesta esperada del sistema | Resultados |
| :--- | :--- | :--- | :--- |
| 1 | Iniciar registro de consumo para vehículo con cupo limitado. | El sistema identifica que el vehículo tiene derecho a subsidio parcial o nulo para esta carga. | |
| 2 | Ingresar cantidad de galones que supere el cupo restante. | El sistema debe calcular el excedente con el precio "Pleno" (sin subsidio) automáticamente. | |
| 3 | Confirmar el registro. | El sistema guarda la transacción desglosando o aplicando el precio final corregido según normativa. | |
| 4 | Verificar reporte de consumo del vehículo. | El reporte refleja la aplicación del precio diferencial de acuerdo al Decreto 1428. | |

**OBSERVACIONES ADICIONALES:**
Prueba crítica para asegurar que el motor de reglas (M5) está correctamente integrado con la lógica de registro de transacciones.

---

## CASO DE PRUEBA: TC-03 - Rechazo de Registro por Placa No Existente
**Fecha realización:** 2026-03-23
**Realizada por:** IA Assistant (Trae IDE)
**Objetivo de la prueba:** Validar el manejo de excepciones cuando el vehículo no se encuentra en el censo nacional/base de datos.
**Pre-Requisitos:**
- Usuario autenticado.
- Base de datos operativa.

### DETALLE CASO DE PRUEBA
| Paso No. | Acción usuario | Respuesta esperada del sistema | Resultados |
| :--- | :--- | :--- | :--- |
| 1 | Ingresar una placa inexistente o no registrada (ej: `XYZ-999`). | El sistema realiza la búsqueda en la entidad `Vehiculo`. | |
| 2 | Intentar procesar el registro. | El sistema debe denegar la operación y mostrar un mensaje de error: "Vehículo no encontrado en el sistema". | |
| 3 | Verificar logs de error. | El sistema debe registrar el intento fallido si así lo requiere la política de seguridad. | |

**OBSERVACIONES ADICIONALES:**
Valida la integridad referencial lógica y el manejo de errores en la capa de servicios.
