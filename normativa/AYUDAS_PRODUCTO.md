# Elaborar las Ayudas del Producto - EasyDiesel

Este documento define y registra los textos de ayuda integrados en la interfaz de EasyDiesel: tooltips por campo, mensajes de validación del backend (Zod), ayuda contextual por módulo y guías rápidas por rol.

---

## 1. Objetivo

Especificar exactamente qué texto de ayuda debe mostrarse en cada campo, pantalla y situación de error de la plataforma EasyDiesel, de manera que el desarrollador frontend sepa dónde colocar cada tooltip y el motor Zod del backend retorne mensajes comprensibles para el usuario final.

---

## 2. Tooltips por Campo — Formulario de Nuevo Despacho (M3 — UC-01)

Este formulario es el de mayor uso diario en la plataforma. Cada campo crítico debe tener un tooltip accesible al hacer hover o al enfocar el campo (`onFocus`).

| Campo en el formulario | Texto del tooltip |
|------------------------|-------------------|
| **Placa del vehículo** | *"Ingrese la placa en formato colombiano: 3 letras y 3 números (ej. ABC123). Para vehículos diplomáticos, use el formato de placa CD o CC correspondiente. La placa debe estar registrada en el RUNT."* |
| **Tipo de combustible** | *"Seleccione el producto físicamente dispensado en la bomba: ACPM es el diésel colombiano. Gasolina corriente (corriente) o extra según el surtidor usado."* |
| **Volumen dispensado** | *"Ingrese la cantidad en litros. Mínimo: 1 litro. Máximo por transacción: 500 litros. Si el despacho supera 500 L, divida en dos registros."* |
| **Tipo de servicio del vehículo** | *"Este campo determina el precio que aplica según el Decreto 1428 de 2025: Particular y Diplomático pagan precio sin subsidio. Público y Carga pagan precio subsidiado. Oficial aplica tarifa especial. Revise la documentación del vehículo si tiene dudas."* |
| **Estación de servicio** | *"Este campo se autocompleta con la estación asignada a su usuario. Si cree que hay un error, contacte al Administrador del sistema."* |

---

## 3. Mensajes de Validación del Backend (Zod — M3 / UC-05)

Cuando el backend rechaza una petición, el frontend debe mostrar el mensaje exactamente como lo devuelve el esquema Zod del validador. Los mensajes deben ser visibles bajo el campo que causó el error, en color rojo (#EF4444 / `text-red-500` de Tailwind).

| Situación | Mensaje Zod a mostrar al usuario |
|-----------|----------------------------------|
| Placa vacía | *"La placa del vehículo es obligatoria."* |
| Formato de placa inválido | *"Formato inválido. Use 3 letras seguidas de 3 números (ej. ABC123)."* |
| Placa no encontrada en RUNT | *"Placa no encontrada en el catálogo nacional de vehículos. Verifique la placa o contacte al Administrador para sincronizar el catálogo (UC-10)."* |
| Tipo de combustible no seleccionado | *"Debe seleccionar el tipo de combustible dispensado."* |
| Volumen menor a 1 L | *"El volumen mínimo por transacción es 1 litro."* |
| Volumen mayor a 500 L | *"El volumen máximo por transacción es 500 litros. Divida el despacho en dos registros."* |
| Volumen no es número | *"Ingrese un número válido en litros (ej. 45.5)."* |
| Tipo de servicio no seleccionado | *"Debe seleccionar el tipo de servicio del vehículo para aplicar el precio correcto según el Decreto 1428."* |
| Estación INACTIVA | *"Esta estación de servicio está marcada como INACTIVA. No se pueden registrar despachos. Contacte al Administrador."* |
| Sin precio configurado para la zona | *"No hay precio vigente configurado para la zona de esta estación. El Administrador debe configurarlo en Módulo Precios y Zonas (M4)."* |

---

## 4. Mensajes de Validación — Login (M1)

| Situación | Mensaje a mostrar |
|-----------|------------------|
| Correo vacío | *"Ingrese su correo electrónico."* |
| Correo con formato inválido | *"Ingrese un correo electrónico válido (ej. usuario@empresa.com)."* |
| Contraseña vacía | *"Ingrese su contraseña."* |
| Credenciales incorrectas (respuesta 401 del backend) | *"Correo o contraseña incorrectos. Verifique sus datos e intente de nuevo."* |
| 5 intentos fallidos (rate limiting) | *"Demasiados intentos fallidos. Su acceso está bloqueado temporalmente por 15 minutos."* |
| Cuenta Google no autorizada | *"Su cuenta de Google no está registrada en EasyDiesel. Solicite acceso al Administrador del sistema."* |
| Error de conexión (Railway no disponible) | *"No se pudo conectar con el servidor. Verifique su conexión a internet e intente en unos momentos."* |

---

## 5. Mensajes de Validación — Gestión de Usuarios (M2)

| Situación | Mensaje a mostrar |
|-----------|------------------|
| Correo duplicado (error Prisma P2002) | *"Ya existe un usuario registrado con ese correo electrónico. Use un correo diferente."* |
| Rol no seleccionado | *"Debe asignar un rol al usuario (Administrador, Trabajador de Estación, Distribuidor o Regulador)."* |
| Estación no asignada para TRABAJADOR_ESTACION | *"Los usuarios con rol Trabajador de Estación deben tener una estación de servicio asignada."* |
| Nombre vacío | *"El nombre completo del usuario es obligatorio."* |

---

## 6. Mensajes de Validación — Precios y Zonas (M4)

| Situación | Mensaje a mostrar |
|-----------|------------------|
| Precio igual a cero | *"El precio no puede ser cero. Ingrese el valor en pesos colombianos por litro (COP/L)."* |
| Precio negativo | *"El precio debe ser un valor positivo en COP/L."* |
| Fecha de vigencia en el pasado | *"La fecha de vigencia no puede ser anterior a hoy. Los precios retroactivos no están permitidos."* |
| Zona no seleccionada | *"Debe seleccionar la zona geográfica a la que aplica este precio."* |
| Decreto de respaldo no seleccionado | *"Debe asociar este precio a un decreto normativo vigente registrado en el Módulo Normativa (M5)."* |

---

## 7. Ayuda Contextual por Módulo (Panel lateral de ayuda)

Cada módulo debe tener un botón `?` (icono de interrogación) en la esquina superior derecha que al hacer clic despliega un panel lateral con la explicación del módulo.

### M1 — Autenticación
> *"Acceda a EasyDiesel con su correo y contraseña asignados por el Administrador, o con su cuenta Google corporativa. Su sesión es válida por 8 horas. Al cerrar el navegador, deberá iniciar sesión nuevamente. Si olv idó su contraseña, contacte al Administrador del sistema."*

### M3 — Gestión de Estación
> *"Desde este módulo registre los despachos de combustible realizados en la bomba, las recepciones de camiones cisterna y las actas de cierre de turno. Cada despacho registrado queda vinculado automáticamente al log de auditoría del sistema y no puede modificarse después de confirmado. El precio que aplica a cada transacción lo calcula automáticamente el Motor Normativo (M5) según el Decreto 1428 de 2025."*

### M4 — Precios y Zonas
> *"Administre los precios de ACPM y gasolina por zona geográfica. Cada precio debe respaldarse en un decreto normativo registrado en M5. Los cambios de precio entran en vigencia de inmediato para transacciones nuevas; las transacciones ya guardadas mantienen el precio con el que se registraron originalmente."*

### M5 — Normativa
> *"Consulte y registre los decretos que regulan los precios de combustible en Colombia (Decreto 1428 de 2025, Decreto 763 y futuros). Esta sección es de acceso público: cualquier ciudadano puede consultarla sin necesidad de iniciar sesión. El motor de reglas del sistema usa los decretos aquí registrados para calcular automáticamente el precio en cada despacho."*

### M6 — Reportes
> *"Genere y descargue reportes de consumo de combustible en formato PDF o Excel. Use los filtros para acotar el rango de fechas, la zona geográfica, la placa o el tipo de combustible. El sistema procesa reportes de hasta 90 días en menos de 3 segundos. Para rangos mayores, el proceso puede tomar hasta 30 segundos."*

### M7 — Auditoría
> *"Consulte el registro completo e inmutable de todas las acciones realizadas en el sistema: quién inició sesión, qué despachos se registraron, qué precios se actualizaron y desde qué dirección IP. Ningún registro puede ser modificado ni eliminado. Este módulo está diseñado para fiscalización por el Ministerio de Minas y organismos reguladores."*

### M8 — Dashboard
> *"Vista pública del mapa interactivo de estaciones de servicio activas en Colombia con sus precios vigentes de ACPM y gasolina. Use el botón 'Ruta más económica' para encontrar la estación más cercana con el mejor precio para su tipo de vehículo. El mapa usa Google Maps y requiere conexión a internet activa."*

---

## 8. Guías Rápidas por Rol

### Guía Rápida: Trabajador de Estación
1. **Iniciar sesión** con correo y contraseña o Google.
2. Ir a **Gestión de Estación → Nuevo Despacho**.
3. Ingresar: placa, tipo de combustible, volumen en litros, tipo de servicio del vehículo.
4. Verificar el **resumen de precio calculado** (COP/L y costo total).
5. Hacer clic en **Confirmar y guardar**.
6. Al finalizar el turno: ir a **Cierre de Turno**, ingresar el nivel físico del tanque y firmar el acta.

### Guía Rápida: Administrador
1. **Usuarios:** Ir a M2 para crear, editar o desactivar usuarios y asignar roles.
2. **Precios:** Ir a M4 para actualizar precios COP/L por zona y tipo de combustible.
3. **Normativa:** Ir a M5 para registrar nuevos decretos cuando el Gobierno los expida.
4. **Reportes:** Ir a M6 para generar reportes consolidados para auditorías o informes internos.
5. **Auditoría:** Ir a M7 para revisar el log de cualquier operación del sistema.
6. **Catálogo:** Ir a Administración → Sincronizar Catálogo cuando haya nuevos vehículos no reconocidos.

### Guía Rápida: Regulador / Auditor (Min. Minas)
1. **Iniciar sesión** con perfil `REGULADOR`.
2. Ir a **Auditoría (M7)** para consultar el log inmutable de operaciones.
3. Aplicar filtros por rango de fechas, tipo de acción o usuario.
4. Ir a **Reportes (M6)** para generar consolidados por zona, tipo de combustible o período.
5. Exportar en **PDF o Excel** para análisis ministerial.

---

## 9. Mensajes del Sistema (Notificaciones de éxito)

Además de los errores, el sistema debe mostrar confirmaciones positivas (toast/snackbar de color verde, `text-green-600`):

| Acción completada | Mensaje de éxito |
|-------------------|------------------|
| Despacho guardado correctamente | *"Despacho registrado exitosamente. ID de transacción: #XXXX"* |
| Cierre de turno firmado | *"Acta de cierre de turno guardada y firmada correctamente."* |
| Precio actualizado | *"Precio actualizado. Vigente desde [fecha] para la zona [nombre zona]."* |
| Usuario creado | *"Usuario creado. Se envió un correo a [email] para que establezca su contraseña."* |
| Reporte generado | *"Reporte generado exitosamente. Haga clic en Descargar para guardar el archivo."* |
| Decreto publicado | *"Decreto registrado y activo. El motor normativo lo aplicará a partir del [fecha de vigencia]."* |
| Sincronización de catálogo exitosa | *"Catálogo Nacional de Vehículos actualizado. [N] nuevos vehículos añadidos."* |

---

## 10. Responsables de Elaboración e Integración

| Tarea | Responsable | Entregable |
|-------|-------------|------------|
| Redactar textos de tooltips y mensajes | Analista de documentación | Este documento actualizado |
| Implementar tooltips en componentes React | Desarrollador Frontend | Componente `Tooltip.tsx` con Tailwind CSS |
| Configurar mensajes Zod en validators/ | Desarrollador Backend | Archivos en `/backend/src/validators/` |
| Verificar que todos los campos tienen ayuda | QA / Tester | Checklist de revisión de UI |
| Validar claridad del lenguaje con usuario real | Usuario piloto (Trabajador de Estación) | Acta de aprobación de textos |

---

## 11. Criterios de Aceptación

- Todos los campos obligatorios del formulario de Nuevo Despacho tienen tooltip visible.
- Los mensajes de error Zod del backend son mostrados en la UI bajo el campo correspondiente en color rojo.
- Los mensajes de éxito se muestran como toast/snackbar verde durante 4 segundos.
- El panel de ayuda contextual `?` está disponible en todos los módulos M1-M8.
- Las guías rápidas cubren los 3 roles activos: Trabajador de Estación, Administrador y Regulador.
- Los textos están redactados en español colombiano, sin siglas no explicadas, aprobados por un usuario piloto de cada rol.

---

## 12. Referencias

- `SRS.md` — Especificación de Requerimientos (flujos UC-01 a UC-10)
- `SDS.md` — Arquitectura y módulos M1-M8
- `ESTANDARES_CODIFICACION.md` — Uso de Zod, Tailwind CSS (`text-red-500`, `text-green-600`)
- `MANUAL_USUARIO.md` — Manual de usuario (referencia de flujos completos)
- `decreto.md` — Decreto 1428 de 2025 (referencia normativa para textos de ayuda)

---

**Proyecto:** EasyDiesel  
**Versión:** 1.0  
**Actividad padre:** Elaborar documentación del producto de software  
**Fecha de elaboración:** Marzo 2026
