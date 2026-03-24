# Manual Técnico de Manejo y Operación - EasyDiesel

Este documento describe la arquitectura técnica real, los procedimientos de instalación, configuración, despliegue, operación y mantenimiento de la plataforma EasyDiesel. Está dirigido al equipo técnico responsable del sistema.

---

## 1. Objetivo

Proveer al equipo técnico la información precisa y operativa para instalar, configurar, desplegar, operar y mantener la plataforma EasyDiesel en entornos de desarrollo y producción usando la infraestructura cloud definida en el SDS.

---

## 2. Audiencia

| Perfil | Módulos de interés |
|--------|--------------------|
| **Desarrollador Frontend** | Capa React + Vite, Tailwind CSS, Context API |
| **Desarrollador Backend** | Node.js + Express, Prisma ORM, módulos M1-M8 |
| **DBA / Infraestructura** | Supabase (PostgreSQL), PgBouncer, backups |
| **DevOps** | CI/CD Vercel + Railway, variables de entorno, monitoreo |

---

## 3. Stack Tecnológico Real del Proyecto

### 3.1 Resumen del stack

| Capa | Tecnología | Plataforma de despliegue |
|------|------------|-------------------------|
| **Frontend (Tier 1)** | React 18 + Vite, TypeScript v5+, Tailwind CSS, Context API | **Vercel** (Edge CDN) |
| **Backend (Tier 2)** | Node.js + Express, TypeScript v5+, JWT, bcrypt, Zod | **Railway** (PaaS) |
| **Base de datos (Tier 3)** | PostgreSQL (vía Prisma ORM) | **Supabase** (DBaaS) |
| **Autenticación** | JWT stateless + Google OAuth 2.0 | Google Cloud |
| **Mapas** | Google Maps JavaScript API | Google Cloud |
| **Validación de datos** | Zod schemas (backend) | — |
| **Connection pooler** | PgBouncer | Supabase (puerto TCP 6543) |
| **Control de versiones** | Git (rama `main` → producción automática) | GitHub |

### 3.2 Módulos funcionales del sistema (M1-M8)

| Módulo | Nombre | Responsabilidad técnica |
|--------|--------|-------------------------|
| **M1** | Seguridad y Auth | JWT, Google OAuth 2.0 callback, bcrypt, rate limiting |
| **M2** | Gestión de Usuarios | CRUD de usuarios, roles RBAC, asignación de estaciones |
| **M3** | Gestión de Estación | Despachos, inventario de tanques, actas de cierre, recepción de cisternas |
| **M4** | Precios y Zonas | Precios COP/L por zona y tipo de combustible, vigencia de decretos |
| **M5** | Normativa y Reglas | Motor experto que aplica Decreto 1428 y 763 en cada transacción |
| **M6** | Reportes y Exportación | Generación PDF/Excel, filtros avanzados por fecha/zona/placa/servicio |
| **M7** | Auditoría Central | Log inmutable de todas las operaciones (usuario, IP, timestamp, acción, resultado) |
| **M8** | Dashboard y Analítica | Google Maps interactivo, precios en tiempo real, ruta más económica |

---

## 4. Estructura del Código Fuente

### 4.1 Backend (`/backend`)

```
backend/
├── src/
│   ├── routes/          # Endpoints de la API REST (M1-M8)
│   ├── controllers/     # Orquestadores HTTP; delegan a services/
│   ├── validators/      # Esquemas Zod para validación de entrada
│   ├── services/        # Lógica de negocio pura (motor M5, cálculos M4, etc.)
│   ├── middleware/      # Auth JWT, rate limiting, registro de auditoría M7
│   ├── models/          # Tipos TypeScript de entidades Prisma
│   └── app.ts           # Inicialización Express
├── prisma/
│   ├── schema.prisma    # Esquema de la base de datos
│   └── migrations/      # Historial de migraciones de BD
├── .env                 # Variables de entorno (NO subir a Git)
└── package.json
```

**Entidades del modelo de datos (schema.prisma):**
- `Usuario` — roles: `ADMIN`, `TRABAJADOR_ESTACION`, `DISTRIBUIDOR`, `REGULADOR`
- `EstacionServicio` — con geolocalización y zona asignada
- `TanqueCombustible` — con constraint `CHECK (nivel >= 0)` en PostgreSQL
- `TransaccionCombustible` — placa, volumen, tipo servicio, precio aplicado, decreto usado
- `PrecioVigente` — precio COP/L por zona y tipo de combustible
- `DecretoNormativo` — Decreto 1428, Decreto 763 y futuros
- `RegistroAuditoria` — log inmutable de M7
- `ReporteGenerado` — metadatos de reportes PDF/Excel exportados
- `Distribuidor` — con remisiones y guías de despacho

### 4.2 Frontend (`/frontend`)

```
frontend/
├── src/
│   ├── components/      # Componentes React reutilizables (Tailwind CSS)
│   ├── pages/           # Vistas por módulo (Login, Dashboard M8, M3, M4...)
│   ├── context/         # Context API: AuthContext, UIContext
│   ├── hooks/           # Custom hooks (useAuth, usePrecio, etc.)
│   ├── services/        # Llamadas HTTP a la API REST del backend
│   └── main.tsx         # Punto de entrada Vite
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

---

## 5. Variables de Entorno

### 5.1 Backend (archivo `/backend/.env`)

| Variable | Descripción | Ejemplo |
|----------|-------------|--------|
| `DATABASE_URL` | Cadena de conexión Supabase vía PgBouncer (puerto **6543**) | `postgresql://user:pass@host:6543/easydiesel?pgbouncer=true` |
| `DIRECT_URL` | Cadena directa para migraciones Prisma (puerto **5432**) | `postgresql://user:pass@host:5432/easydiesel` |
| `JWT_SECRET` | Clave secreta para firmar tokens JWT (mín. 32 chars) | `supersecreto_easydiesel_2026` |
| `JWT_EXPIRES_IN` | Tiempo de vida del JWT | `8h` |
| `GOOGLE_CLIENT_ID` | Client ID de Google OAuth 2.0 | `xxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Client Secret de Google OAuth 2.0 | `GOCSPX-xxxxxxxx` |
| `GOOGLE_CALLBACK_URL` | URL de callback OAuth en producción | `https://api.easydiesel.railway.app/auth/google/callback` |
| `GOOGLE_MAPS_API_KEY` | API Key de Google Maps JavaScript API | `AIzaSyXXXXXXXXXXXX` |
| `PORT` | Puerto en que escucha el servidor Express | `3000` |
| `NODE_ENV` | Entorno de ejecución | `production` / `development` |
| `BCRYPT_ROUNDS` | Rondas de hashing de contraseñas con bcrypt | `12` |
| `RATE_LIMIT_MAX` | Máximo de peticiones por IP en 15 min (endpoints públicos) | `100` |

> **CRÍTICO:** El archivo `.env` nunca debe subirse al repositorio Git. Añadirlo a `.gitignore`. En Railway y Vercel, configurar las variables directamente en el panel de la plataforma.

### 5.2 Frontend (archivo `/frontend/.env`)

| Variable | Descripción |
|----------|-------------|
| `VITE_API_BASE_URL` | URL base del backend en Railway | `https://api.easydiesel.railway.app` |
| `VITE_GOOGLE_MAPS_KEY` | API Key de Google Maps para el frontend | `AIzaSyXXXXXXXXXXXX` |

---

## 6. Instalación en Entorno de Desarrollo Local

### 6.1 Requisitos previos
- Node.js 20 LTS o superior
- npm 10+ o pnpm 9+
- Git
- Cuenta en Supabase con proyecto creado (o instancia PostgreSQL local)
- Credenciales de Google Cloud (OAuth 2.0 y Maps API Key)

### 6.2 Pasos de instalación

**1. Clonar el repositorio:**
```bash
git clone <url-repositorio>
cd easydiesel
```

**2. Instalar dependencias del backend:**
```bash
cd backend
npm install
```

**3. Crear el archivo `.env`** en `/backend/` con las variables de la sección 5.1.

**4. Ejecutar migraciones de base de datos con Prisma:**
```bash
npx prisma migrate deploy
```
> Para desarrollo usa `npx prisma migrate dev` que también genera el cliente.

**5. (Opcional) Cargar datos semilla:**
```bash
npx prisma db seed
```
> El seed carga zonas geográficas iniciales, decretos base (1428 y 763) y un usuario ADMIN.

**6. Iniciar el backend:**
```bash
npm run dev
```
> El servidor Express escucha en `http://localhost:3000`.

**7. Instalar dependencias del frontend:**
```bash
cd ../frontend
npm install
```

**8. Crear el archivo `.env`** en `/frontend/` con `VITE_API_BASE_URL=http://localhost:3000`.

**9. Iniciar el frontend:**
```bash
npm run dev
```
> Vite sirve la SPA en `http://localhost:5173`.

---

## 7. Despliegue en Producción (CI/CD)

EasyDiesel usa un flujo CI/CD automático basado en la rama `main` del repositorio:

### 7.1 Frontend → Vercel
1. Cada `git push` a `main` dispara automáticamente la compilación en Vercel.
2. Vercel ejecuta `npm run build` (Vite) y publica el bundle `easydiesel-spa-bundle.js` en su red Edge CDN.
3. La SPA queda disponible con HTTPS automático y distribución global de latencia mínima.
4. **No se requiere intervención manual** para actualizar el frontend en producción.

### 7.2 Backend → Railway
1. Cada `git push` a `main` dispara el despliegue automático en Railway.
2. Railway ejecuta `npm install` + `npx prisma migrate deploy` + `npm start`.
3. Si el proceso falla, Railway hace rollback automático a la versión anterior y envía alerta por correo al equipo.
4. Variables de entorno del backend se configuran en **Railway → Variables** (no en `.env` de producción).

### 7.3 Base de datos → Supabase
- La base de datos PostgreSQL está en Supabase. Las migraciones las ejecuta Railway automáticamente en cada despliegue.
- **Backup automático diario:** Supabase realiza un snapshot automático cada 24h. Retención: 7 días en plan gratuito, 30 días en plan Pro.
- La conexión del backend usa **PgBouncer** (puerto `6543`) para pooling de conexiones. Nunca usar el puerto `5432` directo en producción.

---

## 8. Flujo de Autenticación Técnico

### 8.1 Autenticación con email/contraseña
```
Cliente (React SPA)
  → POST /auth/login { email, password }
Backend (Express M1)
  → Busca usuario en PostgreSQL por email
  → Compara password con hash bcrypt (12 rondas)
  → Si válido: genera JWT firmado con JWT_SECRET (expira en 8h)
  → Retorna { token: "eyJhbG..." }
Cliente
  → Guarda token en memoria (Context API AuthContext)
  → Incluye en header de cada petición: Authorization: Bearer <token>
```

### 8.2 Autenticación con Google OAuth 2.0
```
Cliente
  → GET /auth/google (redirige a Google)
Google
  → Muestra pantalla de autorización al usuario
  → Redirige a GOOGLE_CALLBACK_URL con código de autorización
Backend (Express M1 - callback)
  → Intercambia código por perfil de usuario Google
  → Verifica que el email Google esté registrado en la BD
  → Genera JWT interno de EasyDiesel
  → Redirige al frontend con el token
Cliente
  → Lee token de la URL → lo almacena en AuthContext
```

### 8.3 Validación de JWT en cada petición protegida
- El middleware `authMiddleware.ts` en Express intercepta todas las rutas protegidas.
- Verifica la firma del token con `JWT_SECRET`.
- Verifica que el token no haya expirado.
- Inyecta el objeto `{ userId, rol, estacionId }` en `req.user`.
- Si el token es inválido: responde `401 Unauthorized`.
- Si el rol no tiene permiso para el endpoint: responde `403 Forbidden`.

---

## 9. Operación del Sistema en Producción

### 9.1 Monitoreo de logs del backend (Railway)
1. Ingresar al panel de Railway → proyecto EasyDiesel → servicio backend.
2. Ir a la pestaña **Logs** para ver la salida en tiempo real del servidor Node.js.
3. Los logs incluyen: timestamp, nivel (INFO/WARN/ERROR), módulo origen y mensaje.
4. Los errores críticos (`ERROR`) generan alerta automática por correo al equipo técnico.

### 9.2 Indicadores a monitorear

| Indicador | Umbral de alerta | Acción inmediata |
|-----------|-----------------|------------------|
| Tiempo de respuesta API | > 3 segundos en consultas estándar | Revisar queries lentas en Supabase Dashboard |
| Errores HTTP 5xx | > 5 en 1 minuto | Revisar logs Railway; posible fallo en Prisma o Supabase |
| Conexiones activas BD (PgBouncer) | > 80% del pool | Escalar plan Railway o revisar queries sin cerrar |
| Rate limiting activado | Múltiples IPs bloqueadas | Posible ataque; revisar logs y ajustar `RATE_LIMIT_MAX` |
| Disponibilidad general | < 99% mensual | Revisar historial de incidentes en Railway y Supabase |

### 9.3 Backup y restauración de la base de datos

**Backup automático (Supabase):**
- Supabase ejecuta snapshots diarios automáticos de PostgreSQL.
- Para restaurar: Supabase Dashboard → Database → Backups → seleccionar punto de restauración → Restore.

**Backup manual (cuando se necesite antes de un cambio crítico):**
```bash
pg_dump -h <host_supabase> -p 5432 -U postgres -d easydiesel > backup_$(date +%Y%m%d).sql
```

### 9.4 Sincronización manual del Catálogo Nacional de Vehículos (UC-10)
Si el Administrador necesita forzar la sincronización:
1. Ir a **Administración → Sincronizar Catálogo de Vehículos** en la interfaz.
2. O llamar directamente al endpoint (solo rol ADMIN):
   ```
   POST /api/vehiculos/sincronizar
   Authorization: Bearer <jwt_admin>
   ```
3. El proceso puede tomar hasta 5 minutos dependiendo del volumen de datos. El sistema registra el resultado en M7 — Auditoría.

---

## 10. Mantenimiento y Actualización

### 10.1 Aplicar una nueva migración de base de datos
1. Crear la migración en desarrollo: `npx prisma migrate dev --name nombre_cambio`
2. Revisar el archivo generado en `prisma/migrations/`.
3. Subir los cambios a `main`. Railway ejecuta `npx prisma migrate deploy` automáticamente.
4. Verificar en Supabase Dashboard → Database → Tables que el esquema se actualizó correctamente.

### 10.2 Actualizar dependencias npm
```bash
npm outdated          # Ver dependencias desactualizadas
npm update            # Actualizar versiones patch/minor
npm audit             # Detectar vulnerabilidades de seguridad
npm audit fix         # Corregir vulnerabilidades automáticamente
```
> Ejecutar `npm test` y verificar cobertura mínima del 70% en servicios críticos antes de subir a `main`.

### 10.3 Proceso de despliegue de emergencia (hotfix)
1. Crear rama `hotfix/<descripcion>` desde `main`.
2. Implementar la corrección y ejecutar pruebas locales.
3. Hacer merge a `main` con Pull Request aprobado por al menos un par (Peer Review).
4. Railway y Vercel despliegan automáticamente en producción.
5. Verificar en los logs de Railway que no hay errores post-despliegue.

---

## 11. Seguridad Técnica

| Mecanismo | Implementación en EasyDiesel |
|-----------|------------------------------|
| **HTTPS obligatorio** | Vercel y Railway fuerzan HTTPS en todos los nodos. No se admiten conexiones HTTP. |
| **Contraseñas hasheadas** | bcrypt con 12 rondas (`BCRYPT_ROUNDS=12`). No se almacenan contraseñas en texto plano. |
| **Tokens JWT stateless** | Firmados con `JWT_SECRET`, expiran en 8h. El backend no guarda sesiones en memoria. |
| **Google OAuth 2.0** | Las credenciales físicas las maneja Google. EasyDiesel solo recibe el perfil validado. |
| **PgBouncer (puerto 6543)** | Aísla el puerto nativo de PostgreSQL (5432) del acceso externo. Previene saturación de conexiones (DoS). |
| **Rate limiting** | Máximo `RATE_LIMIT_MAX` peticiones por IP cada 15 min en endpoints públicos (configurable). |
| **Constraints BD** | `CHECK (nivel >= 0)` en `TanqueCombustible`. Última línea de defensa contra datos inválidos. |
| **Zod validators** | Validación estricta de toda entrada en el backend antes de llegar a los services. |
| **Secretos en variables de entorno** | Ninguna credencial está hardcodeada en el código fuente. Todo en `.env` (local) o panel de Railway/Vercel (producción). |

---

## 12. Resolución de Problemas Comunes

| Síntoma | Causa probable | Solución |
|---------|----------------|----------|
| `Prisma: Can't reach database server` | `DATABASE_URL` incorrecto o Supabase no disponible | Verificar cadena de conexión con puerto 6543 (PgBouncer) |
| `JWT: invalid signature` | `JWT_SECRET` diferente entre instancias | Asegurar que todos los servicios Railway usen la misma variable `JWT_SECRET` |
| `Google OAuth: redirect_uri_mismatch` | `GOOGLE_CALLBACK_URL` no coincide con la URI registrada en Google Cloud Console | Actualizar las URIs autorizadas en Google Cloud Console |
| `429 Too Many Requests` | Rate limiting activado | Aumentar `RATE_LIMIT_MAX` o revisar si es un ataque |
| `Error P2002: Unique constraint` | Intento de crear usuario con email duplicado | El email ya existe; verificar antes del INSERT |
| Frontend muestra mapa en blanco | `VITE_GOOGLE_MAPS_KEY` inválida o cuota agotada | Verificar en Google Cloud Console el estado de la API Key y cuotas |
| Migración Prisma falla en producción | Conflicto de esquema | Revisar el archivo de migración; ejecutar `npx prisma migrate resolve` si es necesario |

---

## 13. Referencias

- `SDS.md` — Documento de Diseño del Software EasyDiesel (arquitectura completa M1-M8)
- `SRS.md` — Especificación de Requerimientos del Software
- `ESTANDARES_CODIFICACION.md` — Estándares TypeScript, Zod, Prettier, ESLint del proyecto
- `PLAN_DE_CALIDAD.md` — Plan de calidad y cobertura de pruebas
- `PLAN_PRUEBAS_UNITARIAS.md` — Pruebas unitarias de servicios críticos
- `decreto.md` — Decreto 1428 de 2025

---

**Proyecto:** EasyDiesel  
**Versión:** 1.0  
**Actividad padre:** Elaborar documentación del producto de software  
**Fecha de elaboración:** Marzo 2026
