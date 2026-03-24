# Manual de Usuario - EasyDiesel

Guía completa de uso de la plataforma EasyDiesel para la gestión, control y análisis del consumo de combustibles en Colombia, alineada con el Decreto 1428 de 2025 y el Decreto 763.

---

## 1. ¿Qué es EasyDiesel?

EasyDiesel es una aplicación web (SPA — Single Page Application) que centraliza el registro de consumo de ACPM y gasolina, el control de inventarios en estaciones de servicio y la generación de reportes regulatorios. Reemplaza el uso de hojas de cálculo y registros manuales por un sistema digital con trazabilidad completa.

**Normativa aplicada automáticamente por el sistema:**
- **Decreto 1428 de 2025 (Min. Hacienda):** Precio diferencial de ACPM para vehículos particulares, diplomáticos y oficiales vs. precio subsidiado para transporte público y de carga.
- **Decreto 763:** Reglas complementarias de distribución por zona geográfica.

---

## 2. Requisitos para usar la plataforma

| Requisito | Detalle |
|-----------|---------|
| **Navegador** | Chrome 110+, Firefox 115+, Edge 110+ (no se soporta Internet Explorer) |
| **Conexión a internet** | Mínimo 5 Mbps estable (el mapa de estaciones requiere conexión activa) |
| **Cuenta de acceso** | Credenciales asignadas por el Administrador, o cuenta Google corporativa |
| **Pantalla** | Resolución mínima 1280×720 px |

---

## 3. Perfiles de Usuario y sus Accesos

| Perfil | Módulos disponibles | Descripción operativa |
|--------|--------------------|-----------------------|
| **Ciudadano (sin cuenta)** | M8 Dashboard, M5 Normativa | Consulta pública de precios, zonas y estaciones. No requiere login. |
| **Trabajador de Estación** | M3 Gestión de Estación | Registra despachos de combustible, actas de cierre de turno y recepción de cisternas. |
| **Distribuidor** | M3 (lectura), M4 Precios/Zonas | Programa entregas, consulta volúmenes enviados a estaciones destino. |
| **Regulador / Auditor (Min. Minas)** | M6 Reportes, M7 Auditoría | Solo lectura. Fiscaliza LOGs inmutables, genera consolidados ministeriales. |
| **Administrador** | M1 al M8 (acceso total) | CRUD maestro de toda la plataforma: usuarios, zonas, decretos, precios, estaciones. |

---

## 4. Cómo Ingresar al Sistema (M1 — Autenticación)

### 4.1 Acceso con correo y contraseña
1. Abrir el navegador e ir a la URL de la plataforma EasyDiesel.
2. En la pantalla de **Login**, ingresar el **correo electrónico** y la **contraseña** asignados por el Administrador.
3. Hacer clic en **Iniciar sesión**.
4. El sistema valida las credenciales y redirige al dashboard correspondiente al rol.

### 4.2 Acceso con Google (OAuth 2.0)
1. En la pantalla de Login, hacer clic en **Continuar con Google**.
2. El sistema redirige a la pantalla de autorización de Google. Seleccionar la cuenta corporativa autorizada.
3. Google retorna la confirmación al sistema. 
4. Si la cuenta Google no está registrada en el sistema, se mostrará: *"Cuenta no autorizada. Contacte al Administrador."*

### 4.3 Cierre de sesión
- Hacer clic en el ícono de usuario (esquina superior derecha) → **Cerrar sesión**.
- El token JWT se invalida automáticamente. No queda sesión activa en el navegador.

### 4.4 Mensajes de error en el login

| Mensaje en pantalla | Causa | Acción |
|---------------------|-------|--------|
| *"Credenciales incorrectas"* | Correo o contraseña erróneos | Verificar datos. Si persiste, contactar Administrador |
| *"Cuenta no autorizada"* | Cuenta Google no registrada en el sistema | Solicitar alta al Administrador |
| *"Demasiados intentos fallidos. Intente en 15 minutos"* | Rate limiting activado por 5 intentos fallidos | Esperar 15 min o contactar Administrador |
| *"Error de conexión con el servidor"* | Backend Railway no disponible | Verificar conexión a internet; reintentar en 1-2 min |

---

## 5. Módulo M8 — Dashboard y Vista Ciudadana

*Disponible para todos los perfiles, incluyendo usuarios sin cuenta.*

### 5.1 Qué muestra el Dashboard
- **Mapa interactivo** (Google Maps) con todas las estaciones de servicio activas del país, marcadas con indicadores de color según disponibilidad de ACPM y gasolina.
- **Precios vigentes** de ACPM y gasolina por zona geográfica, actualizados en tiempo real.
- **Ruta más económica:** dado un punto de origen, el mapa sugiere la estación más cercana con el precio más bajo según el tipo de vehículo.
- **Estaciones cercanas:** lista ordenada por distancia con nombre, dirección, zona y precio actual.

### 5.2 Cómo usar el mapa
1. Al ingresar al Dashboard, el mapa se centra en la ubicación detectada por el navegador (debe permitir acceso a geolocalización).
2. Usar el buscador de la parte superior para buscar por ciudad, zona o nombre de estación.
3. Hacer clic sobre el ícono de una estación para ver: nombre, dirección, zona, precio ACPM, precio gasolina y estado (activa/inactiva).
4. Usar el botón **Ruta más económica** para calcular, con base en la ubicación actual, cuál estación ofrece el menor precio para el tipo de vehículo seleccionado.

---

## 6. Módulo M3 — Gestión de Estación (Trabajador de Estación)

### 6.1 Registrar un despacho de combustible
Este flujo corresponde al **UC-01: Registrar Consumo de Combustible**.

1. En el menú lateral, ir a **Gestión de Estación → Nuevo Despacho**.
2. Completar el formulario con los siguientes campos **obligatorios**:

| Campo | Descripción | Valores válidos |
|-------|-------------|-----------------|
| **Placa del vehículo** | Placa del vehículo que recibe el combustible | Formato colombiano: 3 letras + 3 números (ej. `ABC123`) o placa diplomática |
| **Tipo de combustible** | Producto dispensado | `ACPM` / `Gasolina corriente` / `Gasolina extra` |
| **Volumen dispensado** | Cantidad entregada | Número positivo en **litros** o **galones** (mín. 1 L, máx. 500 L por transacción) |
| **Tipo de servicio del vehículo** | Categoría del vehículo según Decreto 1428 | `Particular` / `Público` / `Oficial` / `Diplomático` / `Carga` |
| **Estación de servicio** | Se autocompleta con la estación del usuario autenticado | No editable por el Trabajador |

3. Hacer clic en **Registrar despacho**.
4. El sistema ejecuta automáticamente (UC-05 — Validar datos):
   - Verifica que la placa exista en el **Catálogo Nacional de Vehículos**.
   - Verifica que el volumen esté dentro del rango permitido.
   - Consulta el estado de la estación (debe estar `ACTIVA`).
   - Aplica el precio correspondiente vía **M5 — Motor Normativo** según el tipo de servicio y la zona geográfica de la estación.
5. Si la validación es exitosa, se muestra el resumen de la transacción:
   - Placa confirmada, tipo de servicio, precio aplicado ($/litro), costo total, fecha y hora.
6. Confirmar haciendo clic en **Confirmar y guardar**. El sistema registra en auditoría (M7) y guarda la transacción.

### 6.2 Mensajes de error en el registro de despacho

| Mensaje en pantalla | Causa | Acción |
|---------------------|-------|--------|
| *"Placa no encontrada en el catálogo nacional"* | La placa no está en el RUNT sincronizado | Verificar la placa físicamente; si es nueva, el Administrador debe sincronizar el catálogo (UC-10) |
| *"Volumen fuera del rango permitido (máx. 500 L)"* | Se ingresó un volumen mayor al límite | Dividir la transacción o consultar con el Administrador |
| *"Esta estación está INACTIVA"* | La estación fue desactivada en M3 | Contactar al Administrador |
| *"No hay precio configurado para esta zona"* | Falta configuración en M4 | Reportar al Administrador para configurar precio en M4 |
| *"Error al guardar. Intente de nuevo"* | Error de conexión con Railway/Supabase | Reintentar en 30 segundos; si persiste, reportar incidente |

### 6.3 Acta de cierre de turno
1. Ir a **Gestión de Estación → Cierre de Turno**.
2. El sistema calcula automáticamente el total de litros despachados en el turno por tipo de combustible.
3. El Trabajador ingresa el **nivel físico del tanque** (lectura del medidor de la estación) en litros.
4. El sistema compara el nivel calculado vs. el nivel físico ingresado y detecta diferencias.
5. Si hay diferencia > 2%, se genera una **alerta de discrepancia** registrada en M7 — Auditoría.
6. Firmar el acta digitalmente haciendo clic en **Cerrar turno y firmar**.

### 6.4 Registrar recepción de cisterna
1. Ir a **Gestión de Estación → Recepción de Combustible**.
2. Ingresar el **número de remisión/guía** del camión cisterna.
3. Seleccionar el **tanque de destino** dentro de la estación y el **volumen recibido** (litros).
4. El sistema actualiza el inventario del tanque y registra el movimiento en auditoría.

---

## 7. Módulo M4 — Precios y Zonas (Administrador)

### 7.1 Consultar precios vigentes
1. Ir a **Precios y Zonas → Precios actuales**.
2. La tabla muestra: zona geográfica, tipo de combustible, precio sin subsidio, precio con subsidio, fecha de vigencia y decreto aplicado.

### 7.2 Actualizar un precio por zona
1. Ir a **Precios y Zonas → Gestionar precios**.
2. Seleccionar la **zona geográfica** y el **tipo de combustible** a actualizar.
3. Ingresar el nuevo precio en **pesos colombianos por litro (COP/L)**.
4. Ingresar la **fecha de vigencia** del nuevo precio.
5. Seleccionar el **decreto que respalda el cambio** (lista de decretos registrados en M5).
6. Hacer clic en **Guardar precio**. El cambio entra en vigor inmediatamente; M7 registra quién realizó el ajuste, a qué hora y desde qué IP.

> **Nota:** El sistema usa MVCC de PostgreSQL para garantizar que los usuarios que estén consultando precios en ese momento reciban la versión anterior hasta que el cambio esté 100% confirmado.

---

## 8. Módulo M5 — Normativa y Reglas

### 8.1 ¿Qué hace el motor normativo?
M5 es el módulo que dictamina automáticamente, en cada transacción de combustible, qué precio aplica según:
- **Tipo de servicio del vehículo:** particular y diplomático pagan precio sin subsidio (Decreto 1428); transporte público y de carga pagan precio subsidiado.
- **Zona geográfica** de la estación (configurada en M4).
- **Decreto vigente** en la fecha de la transacción.

### 8.2 Consultar normativa vigente (acceso público)
1. Desde el menú principal (incluso sin login), ir a **Normativa**.
2. Se listan todos los decretos registrados con: número, entidad emisora, fecha de expedición, fecha de vigencia y resumen del impacto en precios.
3. Hacer clic en un decreto para ver el detalle completo.

### 8.3 Registrar un nuevo decreto (Administrador)
1. Ir a **Normativa → Nuevo decreto**.
2. Completar: número de decreto, entidad, fecha de expedición, fecha de inicio de vigencia, descripción y reglas que modifica (precios, zonas, tipos de vehículo).
3. Hacer clic en **Publicar decreto**. M5 lo aplica en todas las transacciones nuevas desde la fecha de vigencia indicada.

---

## 9. Módulo M6 — Reportes y Exportación

*Disponible para: Administrador y Regulador/Auditor.*

### 9.1 Generar reporte de consumos (UC-03 / UC-04)
1. Ir a **Reportes → Nuevo reporte**.
2. Definir los filtros del reporte:

| Filtro | Opciones |
|--------|---------|
| **Rango de fechas** | Fecha inicio y fecha fin (formato DD/MM/AAAA) |
| **Tipo de combustible** | ACPM / Gasolina corriente / Gasolina extra / Todos |
| **Placa del vehículo** | Placa específica o dejar vacío para todos |
| **Estación de servicio** | Estación específica o todas |
| **Zona geográfica** | Zona específica o todas |
| **Tipo de servicio del vehículo** | Particular / Público / Oficial / Diplomático / Carga / Todos |

3. Seleccionar el **formato de exportación:** `PDF` o `Excel (.xlsx)`.
4. Hacer clic en **Generar reporte**. El sistema procesa la consulta (tiempo máximo: 3 segundos para rangos de hasta 90 días).
5. Una vez generado, hacer clic en **Descargar** para guardar el archivo.

### 9.2 Interpretación del reporte
Cada fila del reporte contiene:
- ID de transacción, fecha/hora, placa, tipo de servicio, estación, zona, tipo de combustible, volumen (L), precio aplicado (COP/L), costo total (COP), decreto aplicado, usuario que registró.

---

## 10. Módulo M7 — Auditoría (Regulador / Administrador)

### 10.1 Consultar el log de auditoría
1. Ir a **Auditoría → Ver registros**.
2. Cada entrada del log es **inmutable** y contiene:
   - **Usuario** que ejecutó la acción
   - **Fecha y hora exacta** (timestamp UTC)
   - **Dirección IP** del cliente
   - **Acción realizada** (ej. `CREAR_DESPACHO`, `ACTUALIZAR_PRECIO`, `LOGIN_EXITOSO`)
   - **Resultado** (`ÉXITO` / `FALLO`)
   - **Entidad afectada** (ID de la transacción, precio, usuario, etc.)
3. Aplicar filtros por usuario, rango de fecha, tipo de acción o resultado.
4. Exportar el log en PDF o Excel para informes ministeriales.

> **Importante:** El Regulador/Auditor tiene acceso de **solo lectura** a M7. No puede modificar ni eliminar registros de auditoría.

---

## 11. Módulo M2 — Gestión de Usuarios (Administrador)

### 11.1 Crear un nuevo usuario
1. Ir a **Usuarios → Nuevo usuario**.
2. Completar los campos:
   - **Nombre completo**
   - **Correo electrónico** (será el usuario de acceso)
   - **Rol:** `ADMIN` / `TRABAJADOR_ESTACION` / `DISTRIBUIDOR` / `REGULADOR`
   - **Estación de servicio asignada** (obligatorio para rol `TRABAJADOR_ESTACION`)
3. El sistema envía un correo automático al nuevo usuario con el enlace para establecer su contraseña.
4. Si el usuario usará Google OAuth, se omite la contraseña y se asocia la cuenta Google al correo registrado.

### 11.2 Modificar permisos de un usuario
1. Ir a **Usuarios → Lista de usuarios**.
2. Buscar el usuario por nombre o correo.
3. Hacer clic en **Editar** → Cambiar el rol o la estación asignada → **Guardar**.
4. El cambio de permisos es efectivo de inmediato; el token JWT actual del usuario expira en la próxima solicitud al backend.

### 11.3 Desactivar un usuario
1. En la lista de usuarios, hacer clic en **Desactivar** junto al usuario.
2. El usuario queda en estado `INACTIVO`. No puede iniciar sesión, pero su historial de operaciones se conserva en la base de datos para trazabilidad.

---

## 12. Glosario de Términos

| Término | Definición |
|---------|------------|
| **ACPM** | Aceite Combustible Para Motores. Nombre colombiano del combustible diésel. |
| **JWT** | Token de sesión digital generado al iniciar sesión. Válido por 8 horas. |
| **Zona geográfica** | División territorial usada por EasyDiesel para aplicar precios diferenciales según el Decreto. |
| **Tipo de servicio** | Categoría del vehículo que determina si aplica precio subsidiado o precio diferencial. |
| **Catálogo RUNT** | Base de datos nacional de vehículos matriculados usada para validar placas. |
| **Motor normativo (M5)** | Componente del sistema que aplica automáticamente las reglas de precio de los decretos vigentes. |
| **Log inmutable (M7)** | Registro de auditoría que no puede ser modificado ni eliminado, garantizando trazabilidad. |
| **Dashboard ciudadano (M8)** | Vista pública del mapa de estaciones, precios vigentes y ruta más económica. |
| **PgBouncer** | Gestor de conexiones de la base de datos. No es visible para el usuario final. |

---

## 13. Preguntas Frecuentes (FAQ)

**¿Por qué el sistema muestra un precio diferente al que tenía anotado?**
El sistema aplica automáticamente el precio vigente según el decreto activo en la fecha de la transacción y la zona de la estación. Si el Administrador actualizó el precio, las nuevas transacciones usarán el nuevo valor.

**¿Qué hago si la placa del vehículo no aparece en el sistema?**
Significa que la placa no está en el catálogo nacional sincronizado. Reportar al Administrador para que ejecute la sincronización del Catálogo Nacional de Vehículos (UC-10) manualmente.

**¿Puedo corregir un despacho ya guardado?**
No. Las transacciones confirmadas son inmutables para garantizar la trazabilidad normativa. Si hubo un error, se debe registrar una nota de corrección en M7 — Auditoría y el Administrador puede anular la transacción errada con trazabilidad.

**¿El Dashboard de estaciones funciona sin login?**
Sí. El Dashboard (M8) y la sección de Normativa (M5) son de acceso público sin necesidad de cuenta.

**¿Puedo exportar el historial de despachos de mi estación?**
Sí. Con perfil `TRABAJADOR_ESTACION`, puede ir a **Reportes** y generar el reporte filtrado por su estación en PDF o Excel.

---

## 14. Referencias

- `SRS.md` — Especificación de Requerimientos del Software EasyDiesel
- `SDS.md` — Documento de Diseño del Software (arquitectura M1-M8)
- `MANUAL_TECNICO.md` — Manual técnico de instalación y operación
- `AYUDAS_PRODUCTO.md` — Ayudas contextuales integradas en la interfaz
- `decreto.md` — Decreto 1428 de 2025 (texto completo)

---

**Proyecto:** EasyDiesel  
**Versión del manual:** 1.0  
**Actividad padre:** Elaborar documentación del producto de software  
**Fecha de elaboración:** Marzo 2026
