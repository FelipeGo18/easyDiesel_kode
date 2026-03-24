# Revisar los Documentos Previamente Elaborados - EasyDiesel

Este documento define el proceso formal de revisión de todos los documentos del proyecto EasyDiesel, con checklists específicos por documento basados en el contenido real del sistema (módulos M1-M8, stack React+Node.js+PostgreSQL, Decretos 1428 y 763).

---

## 1. Objetivo

Garantizar que todos los documentos del proyecto EasyDiesel sean revisados sistemáticamente con criterios específicos al contenido real del sistema, verificando coherencia con los módulos M1-M8, el stack tecnológico (React+Vite, Node.js+Express, PostgreSQL+Prisma, Vercel+Railway+Supabase) y la normativa del Decreto 1428 de 2025.

---

## 2. Documentos Sujetos a Revisión

| Documento | Archivo | Revisor sugerido | Prioridad |
|-----------|---------|------------------|-----------|
| Especificación de Requerimientos | `SRS.md` | Líder de Desarrollo + QA | **Alta** |
| Diseño del Software | `SDS.md` | Líder de Desarrollo | **Alta** |
| Plan de Calidad | `PLAN_DE_CALIDAD.md` | Líder de Calidad | **Alta** |
| Manual de Usuario | `MANUAL_USUARIO.md` | QA + Usuario piloto | **Alta** |
| Manual Técnico | `MANUAL_TECNICO.md` | Líder de Desarrollo + DevOps | **Alta** |
| Ayudas del Producto | `AYUDAS_PRODUCTO.md` | QA + Usuario piloto | **Alta** |
| Resumen de Casos de Uso | `Resumen_Casos_de_Uso.md` | Líder de Desarrollo | Media |
| Plan de Pruebas Unitarias | `PLAN_PRUEBAS_UNITARIAS.md` | QA | Media |
| Pruebas de Integración UC-01 | `Pruebas_Integracion_UC01.md` | QA | Media |
| Estándares de Codificación | `ESTANDARES_CODIFICACION.md` | Líder de Desarrollo | Media |
| Plan de Implementación | `PLANEACION_IMPLEMENTACION.md` | Líder de Planeación | Media |
| Decreto de referencia | `decreto.md` | Líder de Proyecto | Baja |

---

## 3. Flujo del Proceso de Revisión

```
Documento elaborado o actualizado
              ↓
  Asignación de revisor (Líder de Proyecto)
              ↓
  Revisor aplica checklist específico del documento
              ↓
        ¿Observaciones?
         /              \
        Sí               No
        ↓                 ↓
  Registrar en         Marcar como APROBADO
  GESTION_DEFECTOS      en tabla de registro
  _DOCUMENTACION.md
        ↓
  Autor corrige en ≤ 3 días hábiles (Alta/Media)
        ↓
  Revisor verifica correcciones
        ↓
  Marcar como APROBADO en tabla de registro
```

---

## 4. Checklists Específicos por Documento

### 4.1 Checklist General (aplica a TODOS los documentos)

- [ ] El documento tiene encabezado con: nombre del proyecto (EasyDiesel), versión, fecha de elaboración y actividad padre.
- [ ] El objetivo del documento está claramente definido en la sección 1.
- [ ] No existen secciones marcadas como "Por definir" o "TBD" sin justificación.
- [ ] Las referencias a otros documentos del proyecto usan los nombres de archivo exactos.
- [ ] El lenguaje está en español colombiano, sin ambigedades ni tecnicismos no explicados.
- [ ] El documento es coherente con los demás del proyecto (no hay contradicciones de nombres, módulos, roles o flujos).

---

### 4.2 Checklist Específico — `SRS.md`

- [ ] Los 10 casos de uso (UC-01 a UC-10) están documentados con actor, descripción, flujo principal, flujos alternativos y criterios de aceptación.
- [ ] Los actores del sistema están definidos: Ciudadano, Trabajador de Estación, Distribuidor, Regulador/Auditor, Administrador.
- [ ] El mecanismo diferencial de precios del **Decreto 1428 de 2025** está reflejado en UC-01 y UC-05.
- [ ] Los atributos de calidad incluyen: tiempo de respuesta < 3 segundos, disponibilidad ≥ 99%, autenticación JWT + Google OAuth 2.0.
- [ ] El modelo de dominio incluye las entidades: `Usuario`, `EstacionServicio`, `TanqueCombustible`, `TransaccionCombustible`, `PrecioVigente`, `DecretoNormativo`, `RegistroAuditoria`.
- [ ] Las restricciones no funcionales mencionan: HTTPS obligatorio, RBAC, PostgreSQL con integridad referencial, PgBouncer.

---

### 4.3 Checklist Específico — `SDS.md`

- [ ] Los 8 módulos (M1-M8) están documentados con su responsabilidad técnica específica.
- [ ] La arquitectura 3-Tier está descrita: React SPA (Vercel) / Node.js+Express (Railway) / PostgreSQL (Supabase).
- [ ] La estructura de carpetas del backend refleja: `routes/`, `controllers/`, `validators/`, `services/`, `middleware/`, `models/`.
- [ ] El flujo de autenticación JWT y Google OAuth 2.0 callback está documentado.
- [ ] El uso de PgBouncer (puerto 6543) para pooling de conexiones está especificado.
- [ ] Las decisiones de diseño tienen justificación documentada (React SPA, Node.js non-blocking I/O, PostgreSQL MVCC, Prisma ORM, JWT stateless).
- [ ] El modelo de datos EJB es consistente con las entidades del SRS.

---

### 4.4 Checklist Específico — `MANUAL_USUARIO.md`

- [ ] Cubre los 5 perfiles de usuario: Ciudadano (sin cuenta), Trabajador de Estación, Distribuidor, Regulador/Auditor, Administrador.
- [ ] La sección del formulario de Nuevo Despacho especifica los 5 campos obligatorios: placa, tipo de combustible, volumen (L), tipo de servicio del vehículo, estación.
- [ ] Se explica qué hace el **Motor Normativo (M5)** automáticamente al registrar un despacho.
- [ ] Los mensajes de error están listados para los flujos de login y registro de despacho.
- [ ] La sección del Dashboard (M8) explica el uso del mapa de Google Maps y la ruta más económica.
- [ ] Se explica que el log de auditoría (M7) es inmutable y que los despachos confirmados no pueden modificarse.
- [ ] El glosario incluye: ACPM, JWT, Zona geográfica, Tipo de servicio, Catálogo RUNT, Motor normativo.
- [ ] Las preguntas frecuentes responden a dudas reales del flujo principal (placa no encontrada, precio diferente, corrección de despacho).

---

### 4.5 Checklist Específico — `MANUAL_TECNICO.md`

- [ ] El stack tecnológico especifica: React 18+Vite, TypeScript v5+, Tailwind CSS, Node.js+Express, Prisma ORM, PostgreSQL, Supabase, Railway, Vercel.
- [ ] Las variables de entorno críticas están documentadas: `DATABASE_URL` (puerto 6543), `DIRECT_URL` (puerto 5432), `JWT_SECRET`, `JWT_EXPIRES_IN`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `GOOGLE_MAPS_API_KEY`, `BCRYPT_ROUNDS`, `RATE_LIMIT_MAX`.
- [ ] La estructura de carpetas del backend y frontend está detallada.
- [ ] Los pasos de instalación local incluyen: `npm install`, `npx prisma migrate dev`, `npx prisma db seed`, `npm run dev`.
- [ ] El flujo CI/CD explica: push a `main` → Vercel compila frontend, Railway despliega backend con `npx prisma migrate deploy`.
- [ ] El flujo de autenticación técnico (email/bcrypt + Google OAuth 2.0 callback) está documentado paso a paso.
- [ ] La tabla de resolución de problemas incluye: errores de Prisma, JWT, Google OAuth, rate limiting, migraciones.
- [ ] Se advierte que `.env` nunca debe subirse a Git y que las variables en producción van en el panel de Railway/Vercel.

---

### 4.6 Checklist Específico — `AYUDAS_PRODUCTO.md`

- [ ] Los tooltips de los 5 campos del formulario de Nuevo Despacho están redactados (placa, tipo combustible, volumen, tipo servicio, estación).
- [ ] Los mensajes Zod cubren todos los casos de error de UC-01 y UC-05 (placa inválida, volumen fuera de rango, tipo de servicio faltante, estación inactiva, zona sin precio).
- [ ] Los mensajes de error del login cubren: credenciales incorrectas, cuenta Google no autorizada, rate limiting, error de conexión.
- [ ] El texto de ayuda contextual `?` está definido para los módulos M1, M3, M4, M5, M6, M7 y M8.
- [ ] Las guías rápidas cubren los 3 roles operativos: Trabajador de Estación, Administrador, Regulador.
- [ ] Los mensajes de éxito (toast verde) están definidos para las 7 acciones principales del sistema.
- [ ] Los colores de los mensajes usan las clases Tailwind correctas: `text-red-500` (error), `text-green-600` (éxito).

---

### 4.7 Checklist Específico — `ESTANDARES_CODIFICACION.md`

- [ ] El lenguaje principal es TypeScript v5+ tanto para frontend como backend.
- [ ] Las convenciones de nomenclatura están definidas: `camelCase` (variables/funciones), `PascalCase` (clases/tipos), `UPPER_SNAKE_CASE` (constantes).
- [ ] La arquitectura de código del backend refleja: Controllers (solo HTTP + Zod), Services (lógica de negocio + Prisma), Validators (Zod schemas).
- [ ] La arquitectura del frontend menciona: componentes funcionales con React Hooks, Context API para estado global, Tailwind CSS.
- [ ] El checklist de inspección de código incluye: nomenclatura, pruebas unitarias, fugas de memoria, manejo de excepciones.
- [ ] Se especifica cobertura mínima del 70% en servicios críticos y ejecución automática de `npm test` en cada Pull Request.

---

### 4.8 Checklist Específico — `Pruebas_Integracion_UC01.md`

- [ ] Las pruebas cubren el flujo completo de UC-01: ingreso de placa → validación UC-05 → cálculo de precio vía M5 → guardado en BD → registro en auditoría M7.
- [ ] Existen casos de prueba para: placa válida, placa inválida, volumen fuera de rango, estación inactiva, vehículo particular (precio sin subsidio) y vehículo pública (precio subsidiado).
- [ ] Los resultados esperados especifican el código HTTP de respuesta (200 éxito, 400 validación, 401 auth, 404 no encontrado).

---

## 5. Registro de Revisiones

Completar durante el proceso de revisión formal:

| Documento | Revisor | Fecha revisión | Hallazgos (cant.) | Estado | ID defectos |
|-----------|---------|----------------|-------------------|--------|-------------|
| `SRS.md` | | | | Pendiente | |
| `SDS.md` | | | | Pendiente | |
| `PLAN_DE_CALIDAD.md` | | | | Pendiente | |
| `MANUAL_USUARIO.md` | | | | Pendiente | |
| `MANUAL_TECNICO.md` | | | | Pendiente | |
| `AYUDAS_PRODUCTO.md` | | | | Pendiente | |
| `Resumen_Casos_de_Uso.md` | | | | Pendiente | |
| `PLAN_PRUEBAS_UNITARIAS.md` | | | | Pendiente | |
| `Pruebas_Integracion_UC01.md` | | | | Pendiente | |
| `ESTANDARES_CODIFICACION.md` | | | | Pendiente | |
| `PLANEACION_IMPLEMENTACION.md` | | | | Pendiente | |
| `decreto.md` | | | | Pendiente | |

---

## 6. Responsables

| Rol | Responsabilidad en la revisión |
|-----|--------------------------------|
| **Líder de Proyecto** | Asignar revisores, hacer seguimiento del registro, aprobar cierre |
| **Líder de Desarrollo** | Revisar SRS, SDS, Estándares de Codificación, Manual Técnico |
| **Líder de Calidad (QA)** | Revisar manuales, pruebas unitarias, pruebas de integración, ayudas |
| **Líder de Planeación** | Revisar Plan de Implementación |
| **Usuario piloto** | Validar Manual de Usuario y Ayudas del Producto desde perspectiva del usuario final |
| **Autor del documento** | Corregir hallazgos en el plazo definido y notificar al revisor |

---

## 7. Criterios de Cierre de la Actividad

- El 100% de los documentos tienen estado **Aprobado** en la tabla de registro.
- El 100% de hallazgos de severidad **Alta** están resueltos y verificados.
- El 95% o más de hallazgos de severidad **Media** están resueltos.
- Los hallazgos de severidad **Baja** están registrados en `GESTION_DEFECTOS_DOCUMENTACION.md` para próxima iteración.
- El `LOG_DEFECTOS_INSPECCION.md` está actualizado con todos los defectos encontrados y su estado final.

---

## 8. Referencias

- `LOG_DEFECTOS_INSPECCION.md` — Log general de defectos del proyecto
- `GESTION_DEFECTOS_DOCUMENTACION.md` — Proceso detallado de gestión de defectos de documentación
- `PLAN_DE_CALIDAD.md` — Plan de calidad del proyecto EasyDiesel
- `ESTANDARES_CODIFICACION.md` — Estándares de TypeScript, Zod, Prettier, ESLint

---

**Proyecto:** EasyDiesel  
**Versión:** 1.0  
**Actividad padre:** Elaborar documentación del producto de software  
**Fecha de elaboración:** Marzo 2026
