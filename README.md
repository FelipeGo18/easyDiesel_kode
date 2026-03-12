# 🛢️ Plataforma de Gestión de Combustibles

Sistema web para el control, trazabilidad y regulación de combustibles en estaciones de servicio colombianas, desarrollado en cumplimiento del **Decreto 1428 de 2025** y el **Decreto 763 de 2024** del Ministerio de Minas y Energía.

> Proyecto de grado — Universidad Piloto de Colombia

---

## 📋 Descripción

La plataforma permite rastrear el combustible desde el distribuidor mayorista hasta la venta final al usuario, aplicando automáticamente el precio correcto según el tipo de vehículo (particular, público, diplomático u oficial), la zona geográfica y el decreto vigente.

**Problema que resuelve:** con el Decreto 1428/2025 los vehículos particulares dejaron de recibir subsidio en ACPM, mientras que transporte público y carga lo mantienen. Sin un sistema centralizado, las estaciones aplican precios manualmente con alto riesgo de error regulatorio.

---

## 🏗️ Arquitectura

```
frontend/          React + Vite + TypeScript + Tailwind CSS + shadcn/ui
backend/           Node.js + Express + TypeScript + Prisma ORM
                   └── PostgreSQL 16
```

El proyecto es un **monorepo** con frontend y backend como proyectos independientes que se despliegan por separado.

```
Usuario (navegador)
      │ HTTPS
      ▼
Vercel  ──────────  React SPA (frontend)
      │ REST / JSON
      ▼
Railway ──────────  Express API (backend)
      │ SQL / Prisma
      ▼
Supabase ─────────  PostgreSQL 16
```

---

## 🧩 Módulos del sistema

| Módulo                         | Descripción                                         |
| ------------------------------- | ---------------------------------------------------- |
| **M1 — Auth**            | Login, JWT, roles y permisos                         |
| **M2 — Usuarios**        | CRUD de actores del sistema                          |
| **M3 — Gestión de Estación** | Gestión de entradas/salidas de combustible por tanque y estación |
| **M4 — Precios y Zonas** | Precios vigentes según decreto y zona               |
| **M5 — Normativa**       | Motor de reglas para aplicación de decretos         |
| **M6 — Reportes**        | Generación de informes PDF/Excel para el Ministerio |
| **M7 — Auditoría**      | Log inmutable de todas las operaciones               |
| **M8 — Dashboard**       | KPIs en tiempo real e inventario por estación       |

---

## 👥 Roles de usuario

| Rol                       | Acceso                                         |
| ------------------------- | ---------------------------------------------- |
| `admin`                 | Acceso completo                                |
| `estacion`              | Inventario, transacciones, reportes propios    |
| `distribuidor`          | Registro de entregas, reportes                 |
| `regulador`             | Solo lectura — normativa, reportes, dashboard |
| `auditor`               | Solo lectura — logs de auditoría             |
| `particular`            | Consulta de precios, planificación de viajes   |
| `distribuidor_regulado` | Inventario y normativa                         |

> **Nota:** Los usuarios no autenticados tienen acceso de solo vista a precios y estaciones. El subsidio no es un rol, sino un cálculo automático del sistema basado en el tipo de servicio del vehículo, determinado por el trabajador de la estación en el momento del despacho.

---

## 🗂️ Estructura del repositorio

```
easyDiesel_kode/
├── backend/
│   ├── src/
│   │   ├── routes/          # Definición de endpoints
│   │   ├── controllers/     # Manejo de request/response
│   │   ├── services/        # Lógica de negocio y motor de reglas
│   │   ├── middleware/      # Auth JWT, roles, rate limiting, auditoría
│   │   ├── validators/      # Esquemas Zod para validación de body
│   │   ├── utils/           # Helpers y funciones auxiliares
│   │   └── types/           # Interfaces TypeScript del dominio
│   ├── prisma/
│   │   ├── schema.prisma    # Modelo de base de datos (13 tablas)
│   │   └── migrations/      # Historial de migraciones
│   ├── tests/
│   │   ├── unit/            # Pruebas de servicios con Jest
│   │   └── integration/     # Pruebas de endpoints con Supertest
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/           # Panel por rol + páginas de admin
│   │   ├── features/        # Componentes específicos del negocio
│   │   ├── components/
│   │   │   ├── ui/          # Componentes base (Button, Card, Badge...)
│   │   │   ├── common/      # Navbar, Sidebar, Table, Modal...
│   │   │   └── layout/      # Estructura de página
│   │   ├── hooks/           # Custom hooks por módulo
│   │   ├── services/        # Capa de llamadas a la API REST
│   │   ├── context/         # AuthContext
│   │   ├── types/           # Interfaces TypeScript del dominio
│   │   └── lib/             # Utils, constantes, ENUMs
│   ├── tests/
│   ├── .env.example
│   ├── vite.config.ts
│   ├── package.json
│   └── tsconfig.json
│
├── normativa/               # Documentación normativa (decretos, reglas)
│   └── decreto.md
├── .agents/                 # Skills reutilizables para agentes de IA
│   └── skills/
├── .gitignore
└── README.md
```

---

## ⚙️ Instalación local

### Requisitos previos

- Node.js 20 LTS
- Cuenta en [Google Cloud Console](https://console.cloud.google.com) con las APIs habilitadas: **Google OAuth 2.0** y **Maps JavaScript API**
- pnpm 9+ — `npm install -g pnpm`
- PostgreSQL 16 (local o cuenta en [Supabase](https://supabase.com))
- Git

### 1. Clonar el repositorio

```bash
git clone https://github.com/FelipeGo18/easyDiesel_kode.git
cd easyDiesel_kode
```

### 2. Configurar el backend

```bash
cd backend
cp .env.example .env
# Editar .env con tus credenciales
pnpm install
pnpm dlx prisma migrate dev
pnpm dev
```

El servidor queda disponible en `http://localhost:3000`

### 3. Configurar el frontend

```bash
cd ../frontend
cp .env.example .env
# Editar .env con la URL del backend
pnpm install
pnpm dev
```

La aplicación queda disponible en `http://localhost:5173`

### Variables de entorno — Backend

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/combustibles"
JWT_SECRET="tu_clave_secreta_muy_larga"
JWT_EXPIRES_IN="8h"
PORT=3000
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"

# Google OAuth 2.0
GOOGLE_CLIENT_ID="tu_google_client_id"
GOOGLE_CLIENT_SECRET="tu_google_client_secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"
```

### Variables de entorno — Frontend

```env
VITE_API_URL="http://localhost:3000/api"
VITE_GOOGLE_MAPS_API_KEY="tu_google_maps_api_key"
```

---

## 🧪 Pruebas

```bash
# Backend — pruebas unitarias
cd backend
pnpm test

# Backend — pruebas con cobertura
pnpm test:coverage

# Frontend — pruebas de componentes
cd frontend
pnpm test
```

Cobertura mínima esperada: **70%** en servicios del backend, con énfasis en el módulo de transacciones y el motor de reglas normativo.

---

## 🚀 Despliegue (producción)

| Servicio       | Proveedor                                                   | Notas                             |
| -------------- | ----------------------------------------------------------- | --------------------------------- |
| Frontend       | [Vercel](https://vercel.com)                                   | Deploy automático desde `main` |
| Backend        | [Railway](https://railway.app)                                 | Deploy automático desde `main` |
| Base de datos  | [Supabase](https://supabase.com)                               | PostgreSQL gestionado             |
| Autenticación | [Google OAuth 2.0](https://console.cloud.google.com)           | Login con Google                   |
| Mapas          | [Google Maps JavaScript API](https://console.cloud.google.com) | Mapa interactivo en M4 y M8       |

Cada push a la rama `main` dispara el despliegue automático en Vercel y Railway.

---

## 📐 Base de datos

El modelo de datos tiene **13 tablas** en PostgreSQL 16, gestionadas con Prisma Migrate:

`usuarios` · `roles` · `session_tokens` · `estaciones_servicio` · `distribuidores` · `tanques` · `transacciones_combustible` · `entregas_distribuidor` · `zonas_distribucion` · `precios_vigentes` · `decretos_normativos` · `auditoria_log` · `reportes`

Para visualizar el modelo entidad-relación, abrir `docs/modelo_base_datos_combustibles.puml` en [plantuml.com](https://www.plantuml.com/plantuml/uml).

---

## 📄 Documentación

| Documento                  | Descripción                                     |
| -------------------------- | ----------------------------------------------- |
| `normativa/decreto.md`   | Reglas del Decreto 1428/2025 y motor de precios |

---

## ⚖️ Marco normativo

| Decreto                       | Descripción                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------ |
| **Decreto 1428 / 2025** | Precios diferenciales ACPM: particulares sin subsidio, público y carga con subsidio |
| **Decreto 763 / 2024**  | Regulación de distribución de combustibles líquidos                               |
| **Decreto 318 / 2023**  | Zonificación para precios diferenciales por región                                 |

---

## 📌 Estado del proyecto

- [X] Arquitectura definida
- [X] Modelo de base de datos diseñado
- [X] API REST diseñada (12 grupos de endpoints)
- [X] Estructura de carpetas definida
- [X] Implementación backend (12 controllers, 12 services, 13 routes, middleware auth)
- [X] Implementación frontend (páginas y componentes de negocio — todos los roles)
- [X] Pruebas unitarias backend (11 archivos de tests con Jest)
- [ ] Despliegue en producción

---

## 🤖 AI Agent Skills

Este proyecto usa skills de IA en `.agents/skills/`. Cada skill es un `SKILL.md` con instrucciones reutilizables para agentes (Gemini, Claude, Cursor, Copilot).

### Skills disponibles

| Skill                       | Descripción                                                    |
| --------------------------- | -------------------------------------------------------------- |
| `nodejs-backend-patterns` | Patrones de backend Node.js con Express, middleware, auth      |
| `prisma-expert`           | Schema design, migraciones, query optimization con Prisma ORM  |
| `frontend-design`         | Interfaces frontend distintivas y de alta calidad              |
| `tailwind-design-system`  | Sistema de diseño con Tailwind CSS v4                          |
| `react-components`        | Componentes React modulares con Vite                           |
| `ui-ux-pro-max`           | UI/UX design intelligence: 50 estilos, paletas, tipografías   |
| `supabase-postgres-best-practices` | Optimización y best practices de Postgres            |
| `web-design-guidelines`   | Revisión de UI contra Web Interface Guidelines                 |
| `agent-browser`           | Automatización de browser para testing y scraping              |

Las skills se cargan automáticamente desde `.agents/skills/` según el agente configurado.

---

*Universidad Piloto de Colombia · 2026*
