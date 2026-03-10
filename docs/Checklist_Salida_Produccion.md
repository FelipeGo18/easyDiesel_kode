# Checklist de Salida a Produccion

Este checklist resume las verificaciones minimas antes de promover EasyDiesel a un entorno productivo.

## 1. Variables y secretos

- Backend: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `FRONTEND_URL`, `PORT`.
- Backend OAuth/Supabase: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`.
- Backend red: `TRUST_PROXY` cuando se despliegue detras de Railway, Vercel o reverse proxy.
- Frontend: `VITE_API_URL`, `VITE_MAPBOX_TOKEN`.
- Verificar que `JWT_SECRET` no use el valor por defecto en produccion.
- Verificar que las variables de frontend apunten al backend productivo y no a localhost.

## 2. Base de datos y migraciones

- Ejecutar `pnpm prisma:generate` en backend si cambian modelos o cliente Prisma.
- Ejecutar `pnpm test:integration` antes del despliegue para validar auth e inventario.
- Ejecutar `pnpm exec prisma migrate deploy` en el entorno destino antes de levantar trafico.
- Confirmar que no existan migraciones pendientes ni drift de esquema.
- Mantener backup o snapshot previo a despliegues con cambios estructurales.

## 3. Seed y datos controlados

- Mantener `prisma/seed.ts` solo con catalogos y datos de demo seguros.
- No cargar seeds con usuarios reales ni secretos embebidos.
- Separar claramente datos demo de datos operativos si se publica una instancia de demostracion.
- Ejecutar seed solo cuando el entorno lo requiera y con aprobacion explicita.

## 4. Seguridad operativa

- Confirmar expiracion JWT esperada (`JWT_EXPIRES_IN`) y politica de re-login.
- Confirmar expiracion de refresh token esperada (`JWT_REFRESH_EXPIRES_IN_DAYS`) y estrategia de rotacion.
- Verificar que auth y endpoints publicos tengan rate limiting activo.
- Confirmar `x-powered-by` deshabilitado y `trust proxy` configurado si aplica.
- Revisar CORS para permitir solo el frontend oficial.
- Validar que Swagger no exponga informacion sensible o se proteja si se publica fuera de un entorno controlado.
- Verificar revocacion de refresh token al hacer logout y renovacion de sesion ante expiracion del access token.

## 5. Build y calidad

- Frontend: ejecutar `pnpm lint` y `pnpm build`.
- Backend: ejecutar `pnpm build` y `pnpm test:integration`.
- Confirmar que no existan errores de TypeScript ni suites fallando.
- Revisar warnings no bloqueantes conocidos: tamano de bundle frontend y configuracion Prisma deprecada.

## 6. Observabilidad y logs

- Confirmar que el proveedor de despliegue retenga logs del backend.
- Verificar que errores 5xx queden trazables en logs.
- Registrar healthcheck activo en `/api/health`.
- Definir monitoreo minimo para disponibilidad, errores de auth y errores de base de datos.

## 7. Smoke test post-despliegue

- Login con usuario valido.
- Consulta publica de precios y estaciones.
- Registro de entrega de inventario.
- Registro de salida de combustible.
- Cierre de turno.
- Consulta de dashboard.
- Generacion de reporte.
- Verificacion de auditoria asociada a una operacion critica.

## 8. Riesgos abiertos actuales

- El refresh token sigue almacenado en frontend; para un endurecimiento mayor conviene migrarlo a cookie httpOnly segura.
- La documentacion principal aun no refleja completamente el estado implementado.
- El backend usa configuracion Prisma en `package.json`, marcada como deprecada para Prisma 7.
- El frontend mantiene advertencia de tamano de chunk en build productivo.