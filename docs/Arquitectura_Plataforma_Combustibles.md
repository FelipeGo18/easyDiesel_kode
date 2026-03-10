# PLATAFORMA DE GESTIÓN DE COMBUSTIBLES

**Arquitectura Técnica · Base de Datos · Diseño de API**

| | |
|---|---|
| **Proyecto** | Plataforma Gestión Combustibles |
| **Versión** | 1.0 – 2026 |
| **Cliente** | Universidad Piloto de Colombia |
| **Regulación** | Decreto 1428 de 2025 / Decreto 763 de 2024 |
| **Tecnología** | React · Node.js · PostgreSQL · REST API |

---

## 1. Arquitectura Topológica de la Plataforma

La plataforma sigue una arquitectura de tres capas (3-Tier) desplegada en un servidor único (o VPS) para facilitar el desarrollo, con posibilidad de escalar a microservicios en el futuro.

### 1.1 Diagrama de Topología

```
━━━━━━━━━━━━━━━ CAPA CLIENTE ━━━━━━━━━━━━━━━

🌐 Navegador Web (React.js SPA)
Chrome / Firefox / Edge / Safari --- HTTPS:443

        ▲ HTTP/HTTPS REST JSON ▼

━━━━━━━━━━━━━━━ CAPA SERVIDOR (Node.js + Express) ━━━━━━━━━━━━━━━

Puerto 3000 | JWT Auth Middleware | CORS | Rate Limiter

        ▲ SQL / ORM ▼

━━━━━━━━━━━━━━━ CAPA DATOS ━━━━━━━━━━━━━━━

PostgreSQL (Puerto 5432) + Prisma ORM
```

### 1.2 Stack Tecnológico

| **Capa** | **Tecnología** | **Función** | **Puerto/Protocolo** |
|---|---|---|---|
| **Frontend** | React + Vite + TypeScript | SPA – Interfaz de usuario | 5173 (dev) / 443 (prod) |
| **UI / Estilos** | Tailwind CSS + shadcn/ui | Diseño responsivo | — |
| **Backend** | Node.js + Express + TypeScript | API REST – Lógica de negocio | 3000 / HTTPS |
| **Autenticación** | JWT + bcrypt + Google OAuth | Sesiones JWT. bcrypt para passwords locales. Google OAuth para login con Google | Header Authorization |
| **ORM** | Prisma ORM | ORM con migraciones, tipado TypeScript y Prisma Client | — |
| **Base de Datos** | PostgreSQL 16 | Persistencia relacional | 5432 / TCP |
| **Web Server** | Vercel | Hosting frontend (React SPA) | HTTPS |
| **Contenedor** | Railway | Hosting backend (Express API) | — |
| **Autenticación** | Google OAuth 2.0 + Passport.js | Login con Google como alternativa a email/password. Passport.js gestiona el flujo OAuth en el backend | HTTPS / Redirect |
| **Mapas** | Google Maps JavaScript API | Mapa interactivo en M4 (estaciones y precios por zona) y M8 (dashboard ciudadano con ubicación) | HTTPS / JS SDK |

### 1.3 Módulos del Sistema y sus Conexiones

| **Módulo** | **Responsabilidad** | **Conecta con** |
|---|---|---|
| **M1 – Auth** | Login con email+password o Google OAuth 2.0. JWT, roles y permisos | Todos los módulos (middleware) |
| **M2 – Usuarios** | CRUD de actores: estaciones, distribuidores, reguladores | M1-Auth, M7-Auditoría |
| **M3 – Gestión de Estación** | Entradas/salidas de combustible por tanque y estación | M4-Precios, M6-Reportes, M7-Auditoría |
| **M4 – Precios y Zonas** | Precios vigentes según decreto, zona y tipo de vehículo. Mapa interactivo (Google Maps) con estaciones activas y precios por zona para el ciudadano | M3-Gestión de Estación, M5-Normativa, M6-Reportes |
| **M5 – Normativa** | Motor de reglas: aplica Decreto 1428, 763, 318 a transacciones | M3-Gestión de Estación, M4-Precios, M6-Reportes |
| **M6 – Reportes** | Generación de informes oficiales (PDF/Excel) para el Ministerio de Minas | M3, M4, M5, M7 |
| **M7 – Auditoría** | Log de todas las operaciones con usuario, fecha y acción | Todos los módulos (trigger) |
| **M8 – Dashboard** | Visualización en tiempo real: inventarios, precios, alertas. Vista ciudadana con mapa Google Maps de la zona y precio vigente según tipo de vehículo | M3, M4, M6 |

### 1.4 Roles y Acceso a Módulos

✅ = Acceso completo | 👁 = Solo lectura | ❌ = Sin acceso

| **Módulo / Rol** | **Admin** | **Estación** | **Distribuidor** | **Regulador** | **Particular / Consulta pública** | **Auditor** | **Dist. Reg.** |
|---|---|---|---|---|---|---|---|
| **M1 – Auth** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **M2 – Usuarios** | ✅ | ❌ | ❌ | 👁 | ❌ | 👁 | ❌ |
| **M3 – Gestión de Estación** | ✅ | ✅ | ✅ | 👁 | ❌ | 👁 | ✅ |
| **M4 – Precios/Zonas** | ✅ | 👁 | 👁 | 👁 | 👁 | 👁 | 👁 |
| **M5 – Normativa** | ✅ | 👁 | 👁 | ✅ | 👁 | 👁 | ✅ |
| **M6 – Reportes** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **M7 – Auditoría** | ✅ | 👁 | 👁 | 👁 | ❌ | ✅ | 👁 |
| **M8 – Dashboard** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 2. Modelo de Base de Datos

Se utiliza PostgreSQL con Prisma ORM. El modelo está normalizado en 3FN. A continuación se describen todas las tablas, sus campos, tipos y relaciones.

### 2.1 Tablas Principales

#### 🗄 usuarios

Almacena todos los actores del sistema.

> **Nota de autenticación:** el sistema soporta dos proveedores. Si `auth_provider = local`, el login usa email + password hasheado con bcrypt. Si `auth_provider = google`, el login usa Google OAuth 2.0 y el campo `password_hash` queda NULL. En ambos casos el sistema emite un JWT propio con el rol del usuario para todas las operaciones posteriores.

| **Campo** | **Tipo** | **Restricción** | **Descripción** |
|---|---|---|---|
| **id** | UUID | PK | Identificador único |
| nombre | VARCHAR(100) | NOT NULL | Nombre completo |
| email | VARCHAR(150) | UNIQUE | Correo electrónico (login) |
| password_hash | VARCHAR(255) | NULLABLE | Contraseña hasheada con bcrypt (null si auth_provider=google) |
| **google_id** | VARCHAR(100) | UNIQUE | ID de Google OAuth. NULL si el usuario usa email/password |
| **auth_provider** | ENUM('LOCAL','GOOGLE') | DEFAULT LOCAL | Proveedor de autenticación: local (email+password) o google (OAuth 2.0) |
| **foto_url** | TEXT | | URL de la foto de perfil. Provista por Google OAuth o cargada manualmente |
| **rol_id** | UUID | FK | Referencia a tabla roles |
| activo | BOOLEAN | DEFAULT T | Estado de la cuenta |
| created_at | TIMESTAMP | NOT NULL | Fecha de creación |
| updated_at | TIMESTAMP | NOT NULL | Última modificación |

#### 🗄 roles

Define los tipos de usuario del sistema.

| **Campo** | **Tipo** | **Restricción** | **Descripción** |
|---|---|---|---|
| **id** | UUID | PK | Identificador del rol |
| nombre | VARCHAR(50) | UNIQUE | Nombre del rol (admin, estacion, distribuidor…) |
| descripcion | TEXT | | Descripción del rol |
| permisos | JSONB | | Mapa de módulos y nivel de acceso |

#### 🗄 estaciones_servicio

Estaciones de gasolina registradas en la plataforma.

| **Campo** | **Tipo** | **Restricción** | **Descripción** |
|---|---|---|---|
| **id** | UUID | PK | Identificador único |
| nombre | VARCHAR(150) | NOT NULL | Nombre comercial |
| nit | VARCHAR(20) | UNIQUE | NIT de la empresa |
| direccion | TEXT | NOT NULL | Dirección física |
| ciudad | VARCHAR(100) | NOT NULL | Ciudad |
| departamento | VARCHAR(100) | NOT NULL | Departamento |
| **codigo_sicom** | VARCHAR(50) | UNIQUE | Código SICOM del Ministerio |
| **zona_id** | UUID | FK | Zona regulatoria asignada |
| **usuario_id** | UUID | FK, UNIQUE | Usuario gestor de la estación |
| latitud | DECIMAL(9,6) | | Coordenada GPS |
| longitud | DECIMAL(9,6) | | Coordenada GPS |
| activa | BOOLEAN | DEFAULT T | Estado operativo |

#### 🗄 distribuidores

Distribuidores mayoristas de combustible.

| **Campo** | **Tipo** | **Restricción** | **Descripción** |
|---|---|---|---|
| **id** | UUID | PK | Identificador único |
| nombre | VARCHAR(150) | NOT NULL | Razón social |
| nit | VARCHAR(20) | UNIQUE | NIT |
| tipo | ENUM | NOT NULL | MAYORISTA / REGULADO |
| direccion | TEXT | NOT NULL | Dirección física |
| ciudad | VARCHAR(100) | NOT NULL | Ciudad |
| departamento | VARCHAR(100) | NOT NULL | Departamento |
| **usuario_id** | UUID | FK, UNIQUE | Usuario gestor |
| activo | BOOLEAN | DEFAULT T | Estado |

### 2.2 Tablas de Inventario y Transacciones

#### 🗄 tanques

Tanques físicos de almacenamiento en cada estación.

| **Campo** | **Tipo** | **Restricción** | **Descripción** |
|---|---|---|---|
| **id** | UUID | PK | Identificador del tanque |
| **estacion_id** | UUID | FK | Estación a la que pertenece |
| nombre | VARCHAR(100) | NOT NULL | Nombre o código del tanque |
| tipo_combustible | ENUM | NOT NULL | ACPM / GASOLINA_CORRIENTE / GASOLINA_EXTRA |
| capacidad_galones | DECIMAL(10,2) | NOT NULL | Capacidad máxima |
| nivel_actual | DECIMAL(10,2) | NOT NULL | Nivel actual en galones |
| nivel_minimo | DECIMAL(10,2) | DEFAULT 0 | Nivel de alerta mínimo |
| activo | BOOLEAN | DEFAULT T | Estado |

#### 🗄 transacciones_combustible

Registro de cada compra/despacho de combustible.

| **Campo** | **Tipo** | **Restricción** | **Descripción** |
|---|---|---|---|
| **id** | UUID | PK | Identificador único de la transacción |
| **estacion_id** | UUID | FK | Estación donde ocurre |
| **tanque_id** | UUID | FK | Tanque involucrado |
| **distribuidor_id** | UUID | FK | Distribuidor (nullable, solo para entradas) |
| **entrega_id** | UUID | FK | Entrega asociada (nullable) |
| tipo | ENUM | NOT NULL | ENTRADA / SALIDA |
| tipo_combustible | ENUM | NOT NULL | ACPM / GASOLINA_CORRIENTE / GASOLINA_EXTRA |
| tipo_servicio | ENUM | NOT NULL | PARTICULAR / PUBLICO / DIPLOMATICO / OFICIAL / CARGA |
| galones | DECIMAL(10,3) | NOT NULL | Cantidad despachada/recibida |
| precio_unitario | DECIMAL(10,2) | NOT NULL | Precio aplicado por galón |
| precio_total | DECIMAL(10,2) | NOT NULL | Total de la transacción |
| placa_vehiculo | VARCHAR(10) | | Placa del vehículo (salidas) |
| estado | ENUM | DEFAULT COMPLETADA | COMPLETADA / ANULADA / PENDIENTE |
| subsidio_aplicado | BOOLEAN | DEFAULT F | Si se aplicó subsidio |
| decreto_aplicado | VARCHAR(50) | | Decreto que rige el precio |
| created_at | TIMESTAMP | NOT NULL | Fecha y hora |

#### 🗄 entregas_distribuidor

Entregas registradas por distribuidores a estaciones.

| **Campo** | **Tipo** | **Restricción** | **Descripción** |
|---|---|---|---|
| **id** | UUID | PK | Identificador único |
| **distribuidor_id** | UUID | FK | Distribuidor que entrega |
| **estacion_id** | UUID | FK | Estación receptora |
| **tanque_id** | UUID | FK | Tanque destino |
| tipo_combustible | ENUM | NOT NULL | Tipo de combustible entregado |
| galones | DECIMAL(10,2) | NOT NULL | Volumen entregado |
| precio_unitario | DECIMAL(10,2) | NOT NULL | Precio unitario de compra |
| precio_total | DECIMAL(10,2) | NOT NULL | Total de la entrega |
| numero_remision | VARCHAR(50) | UNIQUE | Número de remisión de transporte |
| fecha_entrega | TIMESTAMP | NOT NULL | Fecha efectiva de entrega |
| confirmada | BOOLEAN | DEFAULT F | Confirmación por la estación |

### 2.3 Tablas de Precios y Normativa

#### 🗄 zonas_distribucion

Zonas geográficas con precios diferenciados.

| **Campo** | **Tipo** | **Restricción** | **Descripción** |
|---|---|---|---|
| **id** | UUID | PK | Identificador |
| nombre | VARCHAR(100) | UNIQUE | Nombre de la zona |
| descripcion | TEXT | | Descripción o lista de municipios |
| tipo_zona | ENUM | NOT NULL | INTERCONECTADA / NO_INTERCONECTADA |
| departamentos | TEXT[] | | Lista de departamentos en la zona |

#### 🗄 precios_vigentes

Tabla de precios actuales por tipo de combustible, zona y tipo de servicio.

| **Campo** | **Tipo** | **Restricción** | **Descripción** |
|---|---|---|---|
| **id** | UUID | PK | Identificador |
| **zona_id** | UUID | FK | Zona aplicable |
| tipo_combustible | ENUM | NOT NULL | ACPM / GASOLINA_CORRIENTE / GASOLINA_EXTRA |
| tipo_servicio | ENUM | NOT NULL | PARTICULAR / PUBLICO / DIPLOMATICO / OFICIAL / CARGA |
| precio_galon | DECIMAL(10,2) | NOT NULL | Precio por galón en COP |
| subsidio_galon | DECIMAL(10,2) | DEFAULT 0 | Monto de subsidio por galón |
| **decreto_id** | UUID | FK | Decreto que fija el precio |
| vigencia_desde | DATE | NOT NULL | Inicio de vigencia |
| vigencia_hasta | DATE | | Fin de vigencia (null = activo) |
| activo | BOOLEAN | DEFAULT T | Estado |

#### 🗄 decretos_normativos

Registro de decretos y resoluciones cargados al sistema.

| **Campo** | **Tipo** | **Restricción** | **Descripción** |
|---|---|---|---|
| **id** | UUID | PK | Identificador |
| numero | VARCHAR(50) | UNIQUE | Número del decreto (ej: 1428/2025) |
| titulo | VARCHAR(200) | NOT NULL | Título del decreto |
| anio | INTEGER | | Año de expedición |
| entidad | VARCHAR(150) | | Entidad que lo expide |
| descripcion | TEXT | | Resumen del decreto |
| documento_url | TEXT | | Enlace al documento oficial |
| activo | BOOLEAN | DEFAULT T | Si está en vigencia |
| fecha_expedicion | DATE | NOT NULL | Fecha de expedición |
| fecha_vigencia | DATE | NOT NULL | Inicio de vigencia |

### 2.4 Tablas de Auditoría y Reportes

#### 🗄 auditoria_log

Registro inmutable de todas las acciones del sistema.

| **Campo** | **Tipo** | **Restricción** | **Descripción** |
|---|---|---|---|
| **id** | UUID | PK | Identificador |
| **usuario_id** | UUID | FK | Usuario que realizó la acción |
| modulo | VARCHAR(50) | NOT NULL | Módulo donde ocurrió |
| accion | VARCHAR(100) | NOT NULL | Descripción de la acción |
| entidad | VARCHAR(50) | | Tabla afectada |
| **entidad_id** | UUID | | ID del registro afectado |
| datos_antes | JSONB | | Estado anterior (UPDATE/DELETE) |
| datos_despues | JSONB | | Estado nuevo |
| ip_address | INET | | IP del cliente |
| created_at | TIMESTAMP | NOT NULL | Momento exacto |

#### 🗄 reportes

Metadatos de reportes generados y exportados.

| **Campo** | **Tipo** | **Restricción** | **Descripción** |
|---|---|---|---|
| **id** | UUID | PK | Identificador |
| tipo | ENUM | NOT NULL | inventario / precios / normativo / auditoria |
| generado_por | UUID | FK | Usuario que lo generó |
| periodo_inicio | DATE | NOT NULL | Inicio del período reportado |
| periodo_fin | DATE | NOT NULL | Fin del período reportado |
| formato | ENUM | NOT NULL | PDF / Excel / CSV |
| url_archivo | TEXT | | Ruta del archivo generado |
| created_at | TIMESTAMP | NOT NULL | Fecha de generación |

### 2.5 Diagrama de Relaciones (ERD Simplificado)

```
roles (1) ──────────────────── (N) usuarios

usuarios (1) ───────────────── (1) estaciones_servicio

usuarios (1) ───────────────── (1) distribuidores

estaciones_servicio (1) ─────── (N) tanques

estaciones_servicio (1) ─────── (N) transacciones_combustible

tanques (1) ─────────────────── (N) transacciones_combustible

distribuidores (1) ──────────── (N) entregas_distribuidor

estaciones_servicio (1) ─────── (N) entregas_distribuidor

zonas_distribucion (1) ──────── (N) precios_vigentes

decretos_normativos (1) ─────── (N) precios_vigentes

usuarios (1) ───────────────── (N) auditoria_log

usuarios (1) ───────────────── (N) reportes
```

---

## 3. Diseño de la API REST

La API sigue el estándar REST con JSON. Base URL:

```
https://api.combustibles.co/v1
```

Autenticación: Bearer Token (JWT) en header `Authorization` para todos los endpoints protegidos.

### 3.1 Autenticación `/auth`

| **Método** | **Endpoint** | **Rol mínimo** | **Descripción / Body** |
|---|---|---|---|
| **POST** | /auth/login | Público | Login. Body: `{ email, password }` → `{ token, user }` |
| **POST** | /auth/logout | Autenticado | Invalida el token JWT actual |
| **GET** | /auth/google | Público | Inicia el flujo OAuth 2.0 con Google. Redirige al consentimiento de Google |
| **GET** | /auth/google/callback | Público | Callback de Google OAuth. Recibe el código de autorización, obtiene el perfil de Google, crea o recupera el usuario en BD según su email, asigna JWT y redirige al frontend con el token |
| **POST** | /auth/refresh | Autenticado | Renueva el token JWT |
| **POST** | /auth/forgot-password | Público | Envía correo de recuperación. Body: `{ email }` |
| **POST** | /auth/reset-password | Público | Restablece contraseña. Body: `{ token, new_password }` |

### 3.2 Usuarios `/usuarios`

| **Método** | **Endpoint** | **Rol mínimo** | **Descripción / Body** |
|---|---|---|---|
| **GET** | /usuarios | Admin | Lista todos los usuarios. Query: `?rol=&activo=` |
| **GET** | /usuarios/:id | Admin | Obtiene un usuario por ID |
| **POST** | /usuarios | Admin | Crea usuario. Body: `{ nombre, email, password, rol_id }` |
| **PUT** | /usuarios/:id | Admin | Actualiza usuario completo |
| **PATCH** | /usuarios/:id/estado | Admin | Activa/desactiva usuario. Body: `{ activo: bool }` |
| **DELETE** | /usuarios/:id | Admin | Elimina usuario (soft delete) |
| **GET** | /usuarios/me | Autenticado | Perfil del usuario autenticado |

### 3.3 Estaciones de Servicio `/estaciones`

| **Método** | **Endpoint** | **Rol mínimo** | **Descripción / Body** |
|---|---|---|---|
| **GET** | /estaciones | Admin/Regulador | Lista estaciones. Query: `?ciudad=&zona_id=&activa=` |
| **GET** | /estaciones/:id | Admin/Estacion | Detalle de una estación |
| **POST** | /estaciones | Admin | Registra nueva estación. Body: `{ nombre, nit, direccion, ciudad, departamento, zona_id }` |
| **PUT** | /estaciones/:id | Admin/Estacion | Actualiza datos de la estación |
| **GET** | /estaciones/:id/tanques | Estacion | Lista los tanques de la estación |
| **GET** | /estaciones/:id/inventario | Estacion/Admin | Inventario actual de todos los tanques |

### 3.4 Tanques `/tanques`

| **Método** | **Endpoint** | **Rol mínimo** | **Descripción / Body** |
|---|---|---|---|
| **GET** | /tanques/:id | Estacion | Detalle del tanque con nivel actual |
| **POST** | /tanques | Admin | Crea tanque. Body: `{ estacion_id, tipo_combustible, capacidad_galones, nivel_minimo }` |
| **PUT** | /tanques/:id | Admin | Actualiza parámetros del tanque |
| **PATCH** | /tanques/:id/nivel | Estacion | Actualiza nivel manualmente. Body: `{ nivel_actual }` |

### 3.5 Transacciones `/transacciones`

| **Método** | **Endpoint** | **Rol mínimo** | **Descripción / Body** |
|---|---|---|---|
| **GET** | /transacciones | Admin/Regulador | Lista con filtros. Query: `?estacion_id=&tipo=&desde=&hasta=&tipo_servicio=` |
| **GET** | /transacciones/:id | Admin/Estacion | Detalle de una transacción |
| **POST** | /transacciones/salida | Estacion | Registra despacho. Body: `{ tanque_id, volumen_galones, placa_vehiculo, tipo_servicio }` |
| **POST** | /transacciones/entrada | Estacion | Confirma entrada de combustible. Body: `{ tanque_id, volumen_galones, entrega_id }` |
| **GET** | /transacciones/resumen | Admin/Regulador | Resumen estadístico por período y zona |
| **POST** | /transacciones/cierre-turno | Estacion | Cierre de turno. Body: `{ estacion_id, niveles_fisicos: [{tanque_id, nivel_medido}] }`. El sistema compara nivel calculado vs nivel físico y genera alerta si la diferencia supera 0.5% |

**Ejemplo de respuesta `POST /transacciones/salida`:**

```json
{
  "id": "uuid-xxx",
  "placa_vehiculo": "ABC123",
  "tipo_servicio": "particular",
  "volumen_galones": 10.5,
  "precio_galon": 12450.00,
  "subsidio_aplicado": false,
  "decreto_aplicado": "1428/2025",
  "total_cop": 130725.00,
  "created_at": "2026-03-03T20:00:00Z"
}
```

### 3.6 Precios y Zonas `/precios` | `/zonas`

| **Método** | **Endpoint** | **Rol mínimo** | **Descripción / Body** |
|---|---|---|---|
| **GET** | /precios | Todos | Lista precios vigentes. Query: `?zona_id=&tipo_combustible=&tipo_servicio=` |
| **GET** | /precios/vigente | Todos | Precio aplicable ahora. Query: `?zona_id=&tipo_combustible=&tipo_servicio=` (obligatorio) |
| **POST** | /precios | Admin | Crea nuevo precio. Body: `{ zona_id, tipo_combustible, tipo_servicio, precio_galon, decreto_base, vigencia_desde }` |
| **PUT** | /precios/:id | Admin | Actualiza precio existente |
| **GET** | /zonas | Todos | Lista todas las zonas regulatorias |
| **POST** | /zonas | Admin | Crea zona. Body: `{ nombre, descripcion, tipo_zona }` |

### 3.7 Distribuidores y Entregas `/distribuidores`

| **Método** | **Endpoint** | **Rol mínimo** | **Descripción / Body** |
|---|---|---|---|
| **GET** | /distribuidores | Admin/Regulador | Lista distribuidores registrados |
| **POST** | /distribuidores | Admin | Registra distribuidor. Body: `{ nombre, nit, tipo, usuario_id }` |
| **GET** | /distribuidores/:id/entregas | Distribuidor | Historial de entregas del distribuidor |
| **POST** | /entregas | Distribuidor | Registra entrega. Body: `{ distribuidor_id, estacion_id, tipo_combustible, volumen_galones, precio_compra, numero_guia, fecha_entrega }` |
| **PATCH** | /entregas/:id/confirmar | Estacion | Estación confirma recepción de la entrega |
| **GET** | /entregas/:id | Admin/Dist | Detalle de una entrega |

### 3.8 Normativa `/decretos`

| **Método** | **Endpoint** | **Rol mínimo** | **Descripción / Body** |
|---|---|---|---|
| **GET** | /decretos | Todos | Lista decretos y resoluciones vigentes |
| **GET** | /decretos/:id | Todos | Detalle de un decreto |
| **POST** | /decretos | Admin | Agrega decreto. Body: `{ numero, anio, entidad, descripcion, url_documento, fecha_vigencia }` |
| **PUT** | /decretos/:id | Admin | Actualiza decreto |
| **PATCH** | /decretos/:id/estado | Admin | Activa/desactiva decreto. Body: `{ activo: bool }` |

### 3.9 Reportes `/reportes`

| **Método** | **Endpoint** | **Rol mínimo** | **Descripción / Body** |
|---|---|---|---|
| **POST** | /reportes/inventario | Estacion/Admin | Genera reporte de inventario. Body: `{ estacion_id, periodo_inicio, periodo_fin, formato }` |
| **POST** | /reportes/transacciones | Admin/Regulador | Genera reporte de transacciones por zona/período |
| **POST** | /reportes/normativo | Admin/Regulador | Genera reporte oficial para el Ministerio de Minas |
| **GET** | /reportes | Admin/Regulador | Lista reportes generados |
| **GET** | /reportes/:id/descargar | Admin/Regulador | Descarga el archivo del reporte (PDF/Excel) |

### 3.10 Auditoría `/auditoria`

| **Método** | **Endpoint** | **Rol mínimo** | **Descripción / Body** |
|---|---|---|---|
| **GET** | /auditoria | Admin/Auditor | Lista logs. Query: `?usuario_id=&modulo=&desde=&hasta=` |
| **GET** | /auditoria/:id | Admin/Auditor | Detalle de una entrada del log |
| **GET** | /auditoria/usuario/:id | Admin | Todas las acciones de un usuario específico |

### 3.11 Dashboard `/dashboard`

| **Método** | **Endpoint** | **Rol mínimo** | **Descripción / Body** |
|---|---|---|---|
| **GET** | /dashboard/resumen | Todos (según rol) | KPIs generales según rol. Admin/Operadores: inventario, transacciones, alertas. Consulta pública: precio vigente en su zona, estaciones cercanas y explicación del subsidio aplicable |
| **GET** | /dashboard/inventario-live | Estacion/Admin | Niveles actuales de todos los tanques de la estación |
| **GET** | /dashboard/alertas | Estacion/Admin | Tanques bajo nivel mínimo + cambios de precios recientes |
| **GET** | /dashboard/grafico-ventas | Admin/Estacion | Datos para gráfico de ventas por tipo de combustible y período |

### 3.12 Vista Ciudadana `/publico`

Endpoints de consulta pública para ciudadanos y usuarios particulares. No requieren JWT. Permiten consultar precios vigentes, estaciones activas y decretos normativos sin necesidad de un token de sesión. Estos endpoints son de solo lectura y no exponen datos operacionales del sistema.

| **Método** | **Endpoint** | **Rol** | **Descripción / Body** |
|---|---|---|---|
| **GET** | /publico/precios | Consulta pública | Precios vigentes por zona y tipo combustible. Query: `?zona_id=&tipo_combustible=&tipo_servicio=`. No requiere JWT. Devuelve `precio_galon`, `subsidio`, decreto vigente y `vigencia_hasta` |
| **GET** | /publico/estaciones | Consulta pública | Lista estaciones activas con nombre, ciudad, zona y coordenadas (latitud/longitud). Query: `?ciudad=&zona_id=`. No requiere JWT. Base para mostrar bombas en mapa futuro |
| **GET** | /publico/decretos/vigentes | Consulta pública | Lista los decretos activos en lenguaje claro: número, descripción, fecha_vigencia. No requiere JWT. Permite al ciudadano entender por qué se aplica cada precio |
| **GET** | /publico/zonas | Consulta pública | Lista todas las zonas de distribución con nombre y tipo_zona. Útil para que el usuario identifique su zona antes de consultar precios |

> *Nota: los endpoints `/publico/*` no pasan por el middleware de autenticación JWT. Sin embargo sí tienen rate limiting (max 60 req/min por IP) para prevenir abuso. En el futuro el endpoint `/publico/estaciones` podrá combinarse con una API de mapas (Leaflet / Google Maps) para el módulo M9 Vista Ciudadana con mapa.*

### 3.13 Convenciones y Códigos de Respuesta

| **Código HTTP** | **Significado** | **Cuándo se usa** |
|---|---|---|
| **200 OK** | Éxito genérico | GET, PUT, PATCH exitosos |
| **201 Created** | Recurso creado | POST exitoso |
| **204 No Content** | Sin cuerpo de respuesta | DELETE exitoso |
| **400 Bad Request** | Datos inválidos | Falta campo, tipo incorrecto |
| **401 Unauthorized** | Sin autenticación | Token ausente o inválido |
| **403 Forbidden** | Sin permisos | Rol insuficiente para el recurso |
| **404 Not Found** | Recurso no existe | ID inexistente |
| **409 Conflict** | Conflicto de datos | Email duplicado, NIT ya existe |
| **422 Unprocessable** | Regla de negocio falla | Tanque lleno, precio fuera de rango |
| **500 Internal Error** | Error del servidor | Excepción no controlada |

---

## 4. Flujos de Usuario

Esta sección describe los flujos operativos principales del sistema desde la perspectiva de cada actor. Los flujos cubren las acciones más frecuentes y críticas del sistema.

### 4.1 Flujos del Trabajador de Estación — M3 Gestión de Estación

El trabajador de estación requiere inicio de sesión con credenciales válidas (email + password). El sistema valida su rol (`estacion`) y la estación a la que pertenece antes de permitir cualquier operación. El JWT resultante tiene vigencia de 8 horas, equivalente a un turno de trabajo.

#### 4.1.1 — Despacho de Combustible (Salida)

Ocurre cada vez que un vehículo tanquea en la estación. Es el flujo más frecuente del sistema.

1. Trabajador inicia sesión en la app con email y password.
2. Selecciona el tanque activo. El sistema muestra nivel actual y tipo de combustible disponible.
3. Ingresa los datos del vehículo:
   - Placa del vehículo
   - Tipo de servicio: particular / publico / diplomatico / oficial
4. Ingresa los galones a despachar.
5. El sistema calcula y muestra vista previa ANTES de confirmar:
   - Precio por galón según zona de la estación y decreto vigente
   - Aplica subsidio: SÍ o NO (según tipo de servicio y Decreto 1428/2025)
   - Total en pesos COP
   - Decreto que rige el precio (ej: Decreto 1428/2025)
6. Trabajador confirma el despacho.
7. El sistema ejecuta validaciones:
   - ✅ Nivel actual del tanque >= galones solicitados
   - ✅ Existe precio vigente activo para esa zona y tipo de combustible
   - ✅ El tipo de servicio es un valor válido
8. Si todas las validaciones pasan:
   - Descuenta galones del tanque (`nivel_actual -= volumen_galones`)
   - Registra transacción en `transacciones_combustible` (tipo: salida)
   - Escribe en `auditoria_log` con usuario, estación e IP
   - Muestra comprobante: ID transacción, placa, galones, precio/gal, total COP, decreto aplicado
9. Si alguna validación falla:
   - ❌ Nivel insuficiente: "Nivel insuficiente. Nivel actual: X galones, solicitado: Y galones"
   - ❌ Sin precio vigente: "No hay precio activo para esta zona. Contacte al administrador"
   - ❌ Tipo de servicio inválido: "Tipo de servicio no reconocido"

#### 4.1.2 — Recepción de Entrega del Distribuidor (Entrada)

Ocurre cuando llega el camión cisterna. El distribuidor ya registró previamente la entrega en el sistema.

1. Trabajador selecciona "Registrar entrega recibida" en M3.
2. El sistema lista las entregas pendientes de confirmar para su estación: número de guía, distribuidor, tipo de combustible y volumen esperado.
3. Trabajador selecciona la entrega que corresponde al camión presente.
4. Ingresa el volumen REAL recibido en galones (puede diferir del esperado por mermas en transporte).
5. El sistema valida:
   - ✅ La entrega pertenece a esta estación
   - ✅ El tanque destino tiene capacidad suficiente
6. Trabajador confirma la recepción.
7. El sistema procesa:
   - Suma los galones al nivel actual del tanque
   - Marca la entrega como confirmada en `entregas_distribuidor`
   - Registra transacción tipo entrada con `entrega_id`
   - Escribe en `auditoria_log`
   - Si volumen real != volumen esperado: genera alerta para el Admin con la diferencia en galones y porcentaje

#### 4.1.3 — Cierre de Turno

Ocurre al final del turno para cuadrar el inventario físico contra el calculado por el sistema.

1. Trabajador selecciona "Cerrar turno" en M3.
2. El sistema muestra el resumen del turno: galones despachados por tipo, total de transacciones y nivel calculado de cada tanque.
3. Trabajador ingresa el nivel físico medido de cada tanque (lectura de varilla o sensor).
4. El sistema compara nivel calculado vs nivel físico medido.
5. Si la diferencia es menor al 0.5% de la capacidad:
   - ✅ Turno cerrado correctamente. Se registra el cierre en `auditoria_log`.
6. Si la diferencia supera el 0.5%:
   - ❌ Genera alerta de diferencia de inventario visible para el Admin
   - Muestra la discrepancia en galones y porcentaje por tanque
   - El turno queda marcado como "cerrado con diferencia" en `auditoria_log`

### 4.2 Flujo del Distribuidor — Registro de Entrega

El distribuidor registra la entrega ANTES de que el camión llegue a la estación, para que el trabajador la vea como pendiente de confirmar.

1. Distribuidor inicia sesión con sus credenciales.
2. Selecciona "Registrar nueva entrega".
3. Completa: estación destino, tipo de combustible, volumen en galones, precio de compra por galón, número de guía y fecha estimada de entrega.
4. Sistema registra la entrega como pendiente en `entregas_distribuidor`.
5. La entrega aparece automáticamente en M3 del trabajador de la estación destino.

### 4.3 Flujo del Ciudadano — Consulta de Precios (Sin login)

El ciudadano o usuario particular NO requiere inicio de sesión. Accede directamente a la vista pública.

1. Usuario abre la aplicación. Ve directamente la vista pública sin pantalla de login.
2. Selecciona su zona de distribución (o el sistema la detecta por geolocalización del navegador si el usuario lo permite).
3. Selecciona tipo de combustible: ACPM / Gasolina Corriente / Extra.
4. Selecciona tipo de servicio de su vehículo: particular / publico / diplomatico / oficial.
5. El sistema muestra:
   - Precio por galón vigente según zona y tipo de vehículo
   - Aplica subsidio: SÍ o NO con explicación del decreto
   - Decreto que rige el precio en lenguaje claro
   - Lista de estaciones activas en su zona con nombre, dirección y ciudad
6. Los endpoints `/publico/*` no requieren JWT. Rate limiting: 60 solicitudes por minuto por IP.

### 4.4 Flujo del Administrador — Carga de Decreto y Actualización de Precios

Ocurre cuando el Ministerio de Minas publica una nueva resolución que modifica los precios de combustible.

1. Admin inicia sesión.
2. Navega a M5 — Normativa y crea el nuevo decreto: numero, anio, entidad, descripcion, url_documento y fecha de vigencia.
3. Navega a M4 — Precios y Zonas.
4. Para cada zona afectada crea el nuevo precio en `precios_vigentes`:
   - Zona, tipo de combustible, tipo de servicio
   - Nuevo precio por galón
   - Si aplica subsidio
   - `decreto_id` que lo respalda
   - `vigencia_desde` = fecha de entrada en vigor
5. El sistema marca automáticamente como inactivos los precios anteriores para esa combinación zona + combustible + tipo de servicio.
6. A partir de ese momento todos los nuevos despachos usan el precio actualizado sin intervención adicional.

---

## 5. Integraciones Externas y Variables de Entorno

Esta sección describe las integraciones con servicios de terceros que usa la plataforma — Google OAuth 2.0 y Google Maps API — y las variables de entorno necesarias para configurar el sistema en cada ambiente.

### 5.1 Google OAuth 2.0 — Autenticación con Google

El sistema ofrece dos mecanismos de autenticación en M1: email + password tradicional, y login con Google como alternativa. Ambos producen un JWT idéntico que el frontend usa para las peticiones subsiguientes.

Librería backend: Passport.js con estrategia `passport-google-oauth20`. El flujo es el estándar OAuth 2.0 Authorization Code.

| **Paso** | **Actor** | **Acción** |
|---|---|---|
| **1** | Usuario | Hace clic en "Continuar con Google" en la pantalla de login |
| **2** | Frontend | Redirige a `GET /auth/google` — el backend inicia el flujo OAuth con Google |
| **3** | Google | Muestra pantalla de consentimiento. Usuario autoriza el acceso |
| **4** | Google | Redirige a `GET /auth/google/callback` con código de autorización |
| **5** | Backend | Intercambia el código por un `access_token` con Google |
| **6** | Backend | Consulta la API de Google con el token para obtener: `google_id`, nombre, email, foto |
| **7** | Backend | Busca el email en la tabla usuarios. Si existe: recupera el usuario. Si no existe: crea registro con `auth_provider=google` y rol pendiente |
| **8** | Backend | Genera JWT propio firmado con `JWT_SECRET`. Redirige al frontend con el token |
| **9** | Frontend | Almacena el JWT en memoria y lo usa igual que el de email/password |

> *Nota: Si un usuario se registró primero con email/password y luego intenta entrar con Google usando el mismo email, el sistema vincula ambos métodos al mismo usuario. El campo `auth_provider` puede ser: `local` | `google` | `both`.*

### 5.2 Google Maps JavaScript API — Mapa Interactivo

Google Maps se usa en dos módulos de la vista ciudadana:

| **Módulo** | **Uso** | **Componente frontend** |
|---|---|---|
| **M4 — Precios y Zonas** | Mapa interactivo con marcadores de estaciones activas. Al hacer clic en una estación se muestra el precio vigente por tipo de combustible y si aplica subsidio | `MapaEstaciones.tsx` en `features/precios/` |
| **M8 — Dashboard ciudadano** | Mini-mapa que muestra la zona del usuario y las estaciones más cercanas a su ubicación (requiere permiso de geolocalización del navegador) | `MapaZona.tsx` en `features/dashboard/` |

La API Key de Google Maps se expone en el frontend (`VITE_GOOGLE_MAPS_API_KEY`). Esto es normal y esperado — Google Maps requiere API Key pública. Se debe restringir la key en Google Cloud Console a los dominios autorizados del proyecto para evitar uso no autorizado.

> *Costo estimado: Google Maps ofrece $200 USD/mes de crédito gratuito. Para el volumen de un MVP universitario no hay costo. En producción se debe monitorear el uso en Google Cloud Console.*

### 5.3 Variables de Entorno — Backend (`.env`)

Archivo `.env` en la carpeta `/backend`. Nunca se sube al repositorio. El archivo `.env.example` sí se sube como referencia sin valores reales.

| **Variable** | **Ejemplo** | **Descripción** |
|---|---|---|
| **DATABASE_URL** | `postgresql://user:pass@host:5432/combustibles` | Cadena de conexión PostgreSQL (Supabase en producción) |
| **JWT_SECRET** | `una_clave_muy_larga_y_segura_min_32_chars` | Clave secreta para firmar JWT. Mínimo 32 caracteres |
| **JWT_EXPIRES_IN** | `8h` | Duración del token. 8h equivale a un turno de trabajo |
| **GOOGLE_CLIENT_ID** | `123456789-abc.apps.googleusercontent.com` | Client ID de Google Cloud Console para OAuth 2.0 |
| **GOOGLE_CLIENT_SECRET** | `GOCSPX-xxxxxxxxxxxxx` | Client Secret de Google Cloud Console para OAuth 2.0 |
| **GOOGLE_CALLBACK_URL** | `https://api.combustibles.co/v1/auth/google/callback` | URL de retorno después del consentimiento de Google |
| **FRONTEND_URL** | `https://combustibles.co` | URL del frontend. Usada para CORS y redirect post-login |
| **PORT** | `3000` | Puerto del servidor Express |
| **NODE_ENV** | `production` | Ambiente: `development` \| `production` |

### 5.4 Variables de Entorno — Frontend (`.env`)

Archivo `.env` en la carpeta `/frontend`. Las variables deben tener el prefijo `VITE_` para que Vite las exponga al navegador.

| **Variable** | **Ejemplo** | **Descripción** |
|---|---|---|
| **VITE_API_URL** | `https://api.combustibles.co/v1` | URL base del backend. Todas las llamadas de `api.ts` usan esta variable |
| **VITE_GOOGLE_MAPS_API_KEY** | `AIzaSyXXXXXXXXXXXXXXXXXXX` | API Key de Google Maps para el mapa interactivo en M4 y M8. Restringir a dominios autorizados en Google Cloud Console |

> *Las variables `VITE_*` quedan embebidas en el bundle del frontend en tiempo de build — son visibles en el código fuente del navegador. Esto es normal para Google Maps API Key. Nunca poner en el frontend variables sensibles como `JWT_SECRET` o credenciales de base de datos.*
