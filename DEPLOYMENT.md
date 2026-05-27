# Despliegue rapido: Vercel + Render

Este proyecto se despliega como dos servicios:

- `frontend/`: Vite + React en Vercel.
- `backend/`: Express + Prisma en Render usando Docker.

## 1. Backend en Render

Opcion rapida con dashboard:

1. Entra a Render y selecciona `New` > `Web Service`.
2. Conecta el repositorio de GitHub.
3. Elige `Docker` como runtime.
4. Usa estos valores:

```text
Root Directory: dejar vacio
Dockerfile Path: ./backend/Dockerfile
Docker Build Context Directory: .
Health Check Path: /api/health
```

Tambien puedes usar el blueprint `render.yaml` incluido en la raiz del repo.

Agrega estas variables de entorno en Render:

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
JWT_SECRET=una_clave_larga_y_segura
JWT_EXPIRES_IN=8h
JWT_REFRESH_EXPIRES_IN_DAYS=14
FRONTEND_URL=https://tu-frontend.vercel.app
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key
GOOGLE_MAPS_API_KEY=tu_google_maps_api_key
```

Render define `PORT` automaticamente. No lo sobreescribas salvo que sea necesario.

El contenedor ejecuta `prisma migrate deploy` antes de iniciar la API, asi que las migraciones del directorio `backend/prisma/migrations` se aplican en produccion.

Verifica el backend con:

```bash
https://tu-backend.onrender.com/api/health
```

## 2. Frontend en Vercel

1. Importa el mismo repositorio en Vercel.
2. Configura el `Root Directory` como `frontend`.
3. Usa estos settings:

```text
Framework Preset: Vite
Install Command: pnpm install
Build Command: pnpm build
Output Directory: dist
```

4. Agrega estas variables de entorno en Vercel:

```env
VITE_API_URL=https://tu-backend.up.railway.app/api
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
VITE_MAPBOX_TOKEN=tu_token_publico_mapbox
VITE_GOOGLE_MAPS_API_KEY=tu_google_maps_api_key
```

Cuando Vercel termine, copia la URL final del frontend y actualiza `FRONTEND_URL` en Render con esa URL exacta para CORS.

## 3. Orden recomendado

1. Despliega Render primero.
2. Prueba `/api/health`.
3. Despliega Vercel con `VITE_API_URL` apuntando a Render.
4. Actualiza `FRONTEND_URL` en Render con la URL de Vercel.
5. Redeploy del backend si Render no lo hace automaticamente al cambiar variables.
