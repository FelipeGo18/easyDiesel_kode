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
| **M3 — Inventario**      | Entradas y salidas por tanque                        |
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
| `particular`            | Consulta de precios vigentes                   |
| `subsidiado`            | Consulta de precios con subsidio               |
| `distribuidor_regulado` | Inventario y normativa                         |

---

## 🗂️ Estructura del repositorio

```
combustibles-app/
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
│   │   ├── schema.prisma    # Modelo de base de datos
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
│   │   ├── pages/           # Una carpeta por módulo del sistema
│   │   ├── features/        # Componentes específicos del negocio
│   │   ├── components/
│   │   │   ├── ui/          # Componentes base de shadcn/ui
│   │   │   ├── common/      # Navbar, Sidebar, Table, Modal...
│   │   │   └── layout/      # Estructura de página
│   │   ├── hooks/           # Custom hooks por módulo
│   │   ├── services/        # Capa de llamadas a la API REST
│   │   ├── context/         # AuthContext, RolContext
│   │   ├── types/           # Interfaces TypeScript del dominio
│   │   └── lib/             # Utils de shadcn/ui, constantes, ENUMs
│   ├── tests/
│   ├── .env.example
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                    # Documentación técnica del proyecto
│   ├── Arquitectura_Plataforma_Combustibles.docx
│   ├── arquitectura_combustibles.puml
│   ├── modelo_base_datos_combustibles.puml
│   └── estructura_carpetas.puml
├── .skills/                 # Skills reutilizables para agentes de IA (skills.sh)
│   ├── backend/
│   │   └── SKILL.md         # Convenciones del backend (Express, Prisma, estructura)
│   ├── frontend/
│   │   └── SKILL.md         # Convenciones del frontend (React, Tailwind, shadcn/ui)
│   ├── normativa/
│   │   └── SKILL.md         # Reglas del Decreto 1428 y motor de precios
│   └── db/
│       └── SKILL.md         # Modelo de datos, relaciones y convenciones SQL
├── .gitignore
└── README.md
```

---

## ⚙️ Instalación local

### Requisitos previos

- Node.js 20 LTS
- pnpm 9+ — `npm install -g pnpm`
- PostgreSQL 16 (local o cuenta en [Supabase](https://supabase.com))
- Git

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/combustibles-app.git
cd combustibles-app
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
```

### Variables de entorno — Frontend

```env
VITE_API_URL="http://localhost:3000/api"
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

| Servicio      | Proveedor                     | Notas                             |
| ------------- | ----------------------------- | --------------------------------- |
| Frontend      | [Vercel](https://vercel.com)     | Deploy automático desde `main` |
| Backend       | [Railway](https://railway.app)   | Deploy automático desde `main` |
| Base de datos | [Supabase](https://supabase.com) | PostgreSQL gestionado             |

Cada push a la rama `main` dispara el despliegue automático en Vercel y Railway.

---

## 📐 Base de datos

El modelo de datos tiene **12 tablas** en PostgreSQL 16, gestionadas con Prisma Migrate:

`usuarios` · `roles` · `estaciones_servicio` · `distribuidores` · `tanques` · `transacciones_combustible` · `entregas_distribuidor` · `zonas_distribucion` · `precios_vigentes` · `decretos_normativos` · `auditoria_log` · `reportes`

Para visualizar el modelo entidad-relación, abrir `docs/modelo_base_datos_combustibles.puml` en [plantuml.com](https://www.plantuml.com/plantuml/uml).

---

## 📄 Documentación

| Documento                                          | Descripción                                         |
| -------------------------------------------------- | ---------------------------------------------------- |
| `docs/Arquitectura_Plataforma_Combustibles.docx` | Arquitectura, modelo de BD y diseño de API completo |
| `docs/arquitectura_combustibles.puml`            | Diagrama de arquitectura (PlantUML)                  |
| `docs/modelo_base_datos_combustibles.puml`       | Diagrama ERD (PlantUML)                              |
| `docs/estructura_carpetas.puml`                  | Estructura de carpetas del proyecto (PlantUML)       |

---

## ⚖️ Marco normativo

| Decreto                       | Descripción                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------ |
| **Decreto 1428 / 2025** | Precios diferenciales ACPM: particulares sin subsidio, público y carga con subsidio |
| **Decreto 763 / 2024**  | Regulación de distribución de combustibles líquidos                               |
| **Decreto 318 / 2023**  | Zonificación para precios diferenciales por región                                 |

---

## 🤖 AI Agent Skills

Este proyecto usa [skills.sh](https://skills.sh) — el ecosistema abierto de skills para agentes de IA. Las skills son instrucciones reutilizables empaquetadas en archivos `SKILL.md` que permiten a cualquier agente (Claude Code, Cursor, Copilot, Codex) cargar el conocimiento específico del proyecto sin necesidad de re-explicarlo en cada sesión.

### Skills disponibles

| Skill         | Descripción                                                                       |
| ------------- | ---------------------------------------------------------------------------------- |
| `backend`   | Convenciones de Express, estructura de rutas/controllers/services, patrones Prisma |
| `frontend`  | Convenciones React + Vite, uso de shadcn/ui, estructura de hooks y servicios       |
| `normativa` | Reglas del Decreto 1428/2025, lógica del motor de precios, tipos de servicio      |
| `db`        | Modelo de datos, relaciones entre tablas, convenciones de nomenclatura SQL         |

### Instalar las skills en tu agente

```bash
# Instalar todas las skills del proyecto
pnpm dlx skills add ./  --all

# Instalar una skill específica
pnpm dlx skills add ./ --skill backend
```

> Las skills se instalan automáticamente en el agente que tengas configurado (Claude Code, Cursor, etc.)

---

## 📌 Estado del proyecto

- [X] Arquitectura definida
- [X] Modelo de base de datos diseñado
- [X] API REST diseñada (11 grupos de endpoints)
- [X] Estructura de carpetas definida
- [ ] Implementación backend
- [ ] Implementación frontend
- [ ] Pruebas unitarias
- [ ] Despliegue en producción

*Universidad Piloto de Colombia · 2026*
