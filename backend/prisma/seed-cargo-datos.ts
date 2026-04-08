// =============================================================================
// SEED - Carga inicial de datos
// =============================================================================
//
// REQUISITOS PREVIOS:
//   1. Tener corrido `prisma migrate dev` al menos una vez (las tablas deben existir).
//   2. Tener el archivo .env en la raíz del proyecto con las variables:
//        DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public"
//        DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public"
//      (En Supabase ambas URLs las encuentras en:
//       Project Settings → Database → Connection string → URI)
//
// INSTALACIÓN DE DEPENDENCIAS:
//   npm install bcryptjs
//   npm install -D @types/bcryptjs ts-node
//
// REGISTRO DEL SEED EN package.json:
//   Agrega este bloque dentro de tu package.json (al mismo nivel que "scripts"):
//
//   "prisma": {
//     "seed": "ts-node prisma/seed.ts"
//   }
//
//   Si usas ESModules (type: "module" en package.json), usa en su lugar:
//   "seed": "ts-node --esm prisma/seed.ts"
//
// UBICACIÓN DEL ARCHIVO:
//   Coloca este archivo en:  prisma/seed.ts
//
// EJECUCIÓN:
//   npx prisma db seed
//
//   Alternativamente puedes correrlo directamente con:
//   npx ts-node prisma/seed.ts
//
// IMPORTANTE - IDEMPOTENCIA:
//   El seed usa `upsert` en la mayoría de entidades, lo que significa que
//   puede correrse múltiples veces sin duplicar datos maestros (roles, zonas,
//   decretos, precios, usuarios, distribuidores, estaciones).
//   Las entidades sin clave natural única (tanques, transacciones, auditoría,
//   reportes) SÍ se duplicarán si corres el seed más de una vez. Para evitarlo
//   en desarrollo, limpia esas tablas antes con:
//   npx prisma migrate reset   ← borra TODO y re-aplica migraciones + seed
//
// =============================================================================

import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// UTILIDADES
// ─────────────────────────────────────────────
async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
async function main() {
  console.log("🌱 Iniciando seed de la base de datos...\n");

  // ── 1. ROLES ──────────────────────────────────────────────────────────────
  console.log("📌 Creando roles...");

  const rolAdmin = await prisma.rol.upsert({
    where: { nombre: "ADMIN" },
    update: {},
    create: {
      nombre: "ADMIN",
      descripcion: "Administrador del sistema con acceso total",
      permisos: {
        usuarios: ["crear", "leer", "actualizar", "eliminar"],
        estaciones: ["crear", "leer", "actualizar", "eliminar"],
        distribuidores: ["crear", "leer", "actualizar", "eliminar"],
        transacciones: ["crear", "leer", "actualizar", "anular"],
        reportes: ["generar", "leer"],
        precios: ["crear", "leer", "actualizar"],
        decretos: ["crear", "leer", "actualizar"],
      },
    },
  });

  const rolSupervisor = await prisma.rol.upsert({
    where: { nombre: "SUPERVISOR" },
    update: {},
    create: {
      nombre: "SUPERVISOR",
      descripcion: "Supervisor de zona con acceso de lectura y reportes",
      permisos: {
        estaciones: ["leer"],
        distribuidores: ["leer"],
        transacciones: ["leer"],
        reportes: ["generar", "leer"],
        precios: ["leer"],
      },
    },
  });

  const rolEstacion = await prisma.rol.upsert({
    where: { nombre: "ESTACION" },
    update: {},
    create: {
      nombre: "ESTACION",
      descripcion: "Operador de estación de servicio",
      permisos: {
        transacciones: ["crear", "leer"],
        tanques: ["leer", "actualizar"],
        entregas: ["leer", "confirmar"],
      },
    },
  });

  const rolDistribuidor = await prisma.rol.upsert({
    where: { nombre: "DISTRIBUIDOR" },
    update: {},
    create: {
      nombre: "DISTRIBUIDOR",
      descripcion: "Distribuidor de combustible (mayorista o regulado)",
      permisos: {
        entregas: ["crear", "leer", "actualizar"],
        estaciones: ["leer"],
        transacciones: ["leer"],
      },
    },
  });

  console.log("  ✅ 4 roles creados\n");

  // ── 2. ZONAS DE DISTRIBUCIÓN ───────────────────────────────────────────────
  console.log("📌 Creando zonas de distribución...");

  const zonaCentro = await prisma.zonaDistribucion.upsert({
    where: { nombre: "Zona Centro" },
    update: {},
    create: {
      nombre: "Zona Centro",
      tipoZona: "INTERCONECTADA",
      departamentos: ["Cundinamarca", "Boyacá", "Tolima", "Huila"],
      municipios: ["Bogotá", "Tunja", "Ibagué", "Neiva", "Girardot", "Facatativá"],
      descripcion: "Zona central del país con red de distribución interconectada",
    },
  });

  const zonaCaribe = await prisma.zonaDistribucion.upsert({
    where: { nombre: "Zona Caribe" },
    update: {},
    create: {
      nombre: "Zona Caribe",
      tipoZona: "INTERCONECTADA",
      departamentos: ["Atlántico", "Bolívar", "Magdalena", "Cesar", "Guajira", "Córdoba", "Sucre"],
      municipios: ["Barranquilla", "Cartagena", "Santa Marta", "Valledupar", "Riohacha", "Montería", "Sincelejo"],
      descripcion: "Zona costera del Caribe colombiano",
    },
  });

  const zonaAntioquiaCafe = await prisma.zonaDistribucion.upsert({
    where: { nombre: "Zona Antioquia - Eje Cafetero" },
    update: {},
    create: {
      nombre: "Zona Antioquia - Eje Cafetero",
      tipoZona: "INTERCONECTADA",
      departamentos: ["Antioquia", "Caldas", "Risaralda", "Quindío"],
      municipios: ["Medellín", "Manizales", "Pereira", "Armenia", "Bello", "Envigado"],
      descripcion: "Zona noroccidental: Antioquia y Eje Cafetero",
    },
  });

  const zonaPacifica = await prisma.zonaDistribucion.upsert({
    where: { nombre: "Zona Pacífica" },
    update: {},
    create: {
      nombre: "Zona Pacífica",
      tipoZona: "INTERCONECTADA",
      departamentos: ["Valle del Cauca", "Cauca", "Nariño", "Chocó"],
      municipios: ["Cali", "Popayán", "Pasto", "Buenaventura", "Quibdó"],
      descripcion: "Zona del Pacífico colombiano",
    },
  });

  const zonaOriente = await prisma.zonaDistribucion.upsert({
    where: { nombre: "Zona Oriente" },
    update: {},
    create: {
      nombre: "Zona Oriente",
      tipoZona: "INTERCONECTADA",
      departamentos: ["Norte de Santander", "Santander", "Arauca", "Casanare"],
      municipios: ["Bucaramanga", "Cúcuta", "Arauca", "Yopal", "Barrancabermeja"],
      descripcion: "Zona oriental y piedemonte llanero",
    },
  });

  const zonaAmazonia = await prisma.zonaDistribucion.upsert({
    where: { nombre: "Zona Amazonía - Orinoquía" },
    update: {},
    create: {
      nombre: "Zona Amazonía - Orinoquía",
      tipoZona: "NO_INTERCONECTADA",
      departamentos: ["Amazonas", "Vaupés", "Guainía", "Vichada", "Meta", "Guaviare", "Putumayo", "Caquetá"],
      municipios: ["Leticia", "Mitú", "Inírida", "Puerto Carreño", "Villavicencio", "San José del Guaviare", "Mocoa", "Florencia"],
      descripcion: "Zona de difícil acceso - régimen de precios diferencial",
    },
  });

  console.log("  ✅ 6 zonas creadas\n");

  // ── 3. DECRETOS NORMATIVOS ─────────────────────────────────────────────────
  console.log("📌 Creando decretos normativos...");

  const decreto001 = await prisma.decretoNormativo.upsert({
    where: { numero: "DECRETO-2024-001" },
    update: {},
    create: {
      numero: "DECRETO-2024-001",
      titulo: "Regulación de precios de combustibles líquidos - I semestre 2024",
      descripcion: "Establece los precios máximos de venta al público de gasolina corriente y ACPM para el primer semestre de 2024",
      entidad: "Ministerio de Minas y Energía",
      fechaExpedicion: new Date("2024-01-01"),
      fechaVigencia: new Date("2024-06-30"),
      activo: false,
      documentoUrl: "https://storage.example.com/decretos/decreto-2024-001.pdf",
    },
  });

  const decreto002 = await prisma.decretoNormativo.upsert({
    where: { numero: "DECRETO-2024-002" },
    update: {},
    create: {
      numero: "DECRETO-2024-002",
      titulo: "Regulación de precios de combustibles líquidos - II semestre 2024",
      descripcion: "Establece los precios máximos de venta al público para el segundo semestre de 2024, con ajuste por inflación",
      entidad: "Ministerio de Minas y Energía",
      fechaExpedicion: new Date("2024-07-01"),
      fechaVigencia: new Date("2024-12-31"),
      activo: false,
      documentoUrl: "https://storage.example.com/decretos/decreto-2024-002.pdf",
    },
  });

  const decreto003 = await prisma.decretoNormativo.upsert({
    where: { numero: "DECRETO-2025-001" },
    update: {},
    create: {
      numero: "DECRETO-2025-001",
      titulo: "Regulación de precios de combustibles líquidos - Vigencia 2025",
      descripcion: "Marco regulatorio de precios para el año 2025. Incluye ajuste diferencial para zonas no interconectadas y nuevos subsidios para transporte público",
      entidad: "Ministerio de Minas y Energía",
      fechaExpedicion: new Date("2025-01-01"),
      fechaVigencia: new Date("2025-12-31"),
      activo: true,
      documentoUrl: "https://storage.example.com/decretos/decreto-2025-001.pdf",
    },
  });

  console.log("  ✅ 3 decretos creados\n");

  // ── 4. PRECIOS VIGENTES ────────────────────────────────────────────────────
  console.log("📌 Creando precios vigentes...");

  // Precios para zona Centro (referencia base)
  const preciosZonaCentro = [
    { tipoCombustible: "GASOLINA_CORRIENTE" as const, tipoServicio: "PARTICULAR" as const, precioGalon: 9850.00, subsidioGalon: 0 },
    { tipoCombustible: "GASOLINA_CORRIENTE" as const, tipoServicio: "PUBLICO" as const,     precioGalon: 8600.00, subsidioGalon: 1250.00 },
    { tipoCombustible: "GASOLINA_CORRIENTE" as const, tipoServicio: "OFICIAL" as const,     precioGalon: 9500.00, subsidioGalon: 350.00 },
    { tipoCombustible: "GASOLINA_CORRIENTE" as const, tipoServicio: "DIPLOMATICO" as const, precioGalon: 9850.00, subsidioGalon: 0 },
    { tipoCombustible: "GASOLINA_CORRIENTE" as const, tipoServicio: "CARGA" as const,       precioGalon: 9700.00, subsidioGalon: 150.00 },
    { tipoCombustible: "ACPM" as const,               tipoServicio: "PARTICULAR" as const,  precioGalon: 8200.00, subsidioGalon: 0 },
    { tipoCombustible: "ACPM" as const,               tipoServicio: "PUBLICO" as const,     precioGalon: 6800.00, subsidioGalon: 1400.00 },
    { tipoCombustible: "ACPM" as const,               tipoServicio: "OFICIAL" as const,     precioGalon: 7900.00, subsidioGalon: 300.00 },
    { tipoCombustible: "ACPM" as const,               tipoServicio: "CARGA" as const,       precioGalon: 7500.00, subsidioGalon: 700.00 },
    { tipoCombustible: "GASOLINA_EXTRA" as const,     tipoServicio: "PARTICULAR" as const,  precioGalon: 12400.00, subsidioGalon: 0 },
    { tipoCombustible: "GASOLINA_EXTRA" as const,     tipoServicio: "DIPLOMATICO" as const, precioGalon: 12400.00, subsidioGalon: 0 },
  ];

  for (const precio of preciosZonaCentro) {
    await prisma.precioVigente.upsert({
      where: {
        tipoCombustible_tipoServicio_zonaId_activo: {
          tipoCombustible: precio.tipoCombustible,
          tipoServicio: precio.tipoServicio,
          zonaId: zonaCentro.id,
          activo: true,
        },
      },
      update: {},
      create: {
        tipoCombustible: precio.tipoCombustible,
        tipoServicio: precio.tipoServicio,
        zonaId: zonaCentro.id,
        precioGalon: precio.precioGalon,
        subsidioGalon: precio.subsidioGalon,
        decretoId: decreto003.id,
        vigenciaDesde: new Date("2025-01-01"),
        vigenciaHasta: new Date("2025-12-31"),
        activo: true,
      },
    });
  }

  // Amazonía tiene recargo diferencial (+8% aprox por transporte)
  const preciosZonaAmazonia = [
    { tipoCombustible: "GASOLINA_CORRIENTE" as const, tipoServicio: "PARTICULAR" as const, precioGalon: 10640.00, subsidioGalon: 0 },
    { tipoCombustible: "GASOLINA_CORRIENTE" as const, tipoServicio: "PUBLICO" as const,    precioGalon: 9290.00,  subsidioGalon: 1350.00 },
    { tipoCombustible: "ACPM" as const,               tipoServicio: "PARTICULAR" as const, precioGalon: 8860.00,  subsidioGalon: 0 },
    { tipoCombustible: "ACPM" as const,               tipoServicio: "PUBLICO" as const,    precioGalon: 7350.00,  subsidioGalon: 1510.00 },
    { tipoCombustible: "ACPM" as const,               tipoServicio: "CARGA" as const,      precioGalon: 8100.00,  subsidioGalon: 760.00 },
    { tipoCombustible: "GASOLINA_EXTRA" as const,     tipoServicio: "PARTICULAR" as const, precioGalon: 13390.00, subsidioGalon: 0 },
  ];

  for (const precio of preciosZonaAmazonia) {
    await prisma.precioVigente.upsert({
      where: {
        tipoCombustible_tipoServicio_zonaId_activo: {
          tipoCombustible: precio.tipoCombustible,
          tipoServicio: precio.tipoServicio,
          zonaId: zonaAmazonia.id,
          activo: true,
        },
      },
      update: {},
      create: {
        tipoCombustible: precio.tipoCombustible,
        tipoServicio: precio.tipoServicio,
        zonaId: zonaAmazonia.id,
        precioGalon: precio.precioGalon,
        subsidioGalon: precio.subsidioGalon,
        decretoId: decreto003.id,
        vigenciaDesde: new Date("2025-01-01"),
        vigenciaHasta: new Date("2025-12-31"),
        activo: true,
      },
    });
  }

  console.log("  ✅ Precios vigentes creados para zonas Centro y Amazonía\n");

  // ── 5. USUARIOS ADMINISTRATIVOS ───────────────────────────────────────────
  console.log("📌 Creando usuarios administrativos...");

  const adminUser = await prisma.usuario.upsert({
    where: { email: "admin@combustibles.gov.co" },
    update: {},
    create: {
      email: "admin@combustibles.gov.co",
      passwordHash: await hashPassword("Admin@2025!"),
      authProvider: "LOCAL",
      nombre: "Administrador Principal",
      activo: true,
      rolId: rolAdmin.id,
    },
  });

  const supervisorCentro = await prisma.usuario.upsert({
    where: { email: "supervisor.centro@combustibles.gov.co" },
    update: {},
    create: {
      email: "supervisor.centro@combustibles.gov.co",
      passwordHash: await hashPassword("Supervisor@2025!"),
      authProvider: "LOCAL",
      nombre: "Carlos Rodríguez Morales",
      activo: true,
      rolId: rolSupervisor.id,
    },
  });

  const supervisorCaribe = await prisma.usuario.upsert({
    where: { email: "supervisor.caribe@combustibles.gov.co" },
    update: {},
    create: {
      email: "supervisor.caribe@combustibles.gov.co",
      passwordHash: await hashPassword("Supervisor@2025!"),
      authProvider: "LOCAL",
      nombre: "María Fernanda Ospina Díaz",
      activo: true,
      rolId: rolSupervisor.id,
    },
  });

  // Usuarios para distribuidores
  const userDistMayorista = await prisma.usuario.upsert({
    where: { email: "operaciones@terpel.com.co" },
    update: {},
    create: {
      email: "operaciones@terpel.com.co",
      passwordHash: await hashPassword("Terpel@2025!"),
      authProvider: "LOCAL",
      nombre: "Andrés Felipe Gutiérrez",
      activo: true,
      rolId: rolDistribuidor.id,
    },
  });

  const userDistRegulado = await prisma.usuario.upsert({
    where: { email: "despachos@combustol.com.co" },
    update: {},
    create: {
      email: "despachos@combustol.com.co",
      passwordHash: await hashPassword("Combustol@2025!"),
      authProvider: "LOCAL",
      nombre: "Luisa María Vargas",
      activo: true,
      rolId: rolDistribuidor.id,
    },
  });

  // Usuarios para estaciones
  const userEstacion1 = await prisma.usuario.upsert({
    where: { email: "estacion.bogota.norte@example.com" },
    update: {},
    create: {
      email: "estacion.bogota.norte@example.com",
      passwordHash: await hashPassword("Estacion@2025!"),
      authProvider: "LOCAL",
      nombre: "Jorge Hernández Castro",
      activo: true,
      rolId: rolEstacion.id,
    },
  });

  const userEstacion2 = await prisma.usuario.upsert({
    where: { email: "estacion.medellin.laureles@example.com" },
    update: {},
    create: {
      email: "estacion.medellin.laureles@example.com",
      passwordHash: await hashPassword("Estacion@2025!"),
      authProvider: "LOCAL",
      nombre: "Paula Andrea Restrepo",
      activo: true,
      rolId: rolEstacion.id,
    },
  });

  const userEstacion3 = await prisma.usuario.upsert({
    where: { email: "estacion.barranquilla.centro@example.com" },
    update: {},
    create: {
      email: "estacion.barranquilla.centro@example.com",
      passwordHash: await hashPassword("Estacion@2025!"),
      authProvider: "LOCAL",
      nombre: "Roberto Carlos Pertuz",
      activo: true,
      rolId: rolEstacion.id,
    },
  });

  console.log("  ✅ 7 usuarios creados\n");

  // ── 6. DISTRIBUIDORES ─────────────────────────────────────────────────────
  console.log("📌 Creando distribuidores...");

  const distribTerpel = await prisma.distribuidor.upsert({
    where: { nit: "890.903.938-3" },
    update: {},
    create: {
      usuarioId: userDistMayorista.id,
      nombre: "Terpel S.A.",
      nit: "890.903.938-3",
      tipo: "MAYORISTA",
      direccion: "Calle 100 # 8A - 55, Piso 12",
      ciudad: "Bogotá",
      departamento: "Cundinamarca",
      activo: true,
    },
  });

  const distribCombustol = await prisma.distribuidor.upsert({
    where: { nit: "800.123.456-7" },
    update: {},
    create: {
      usuarioId: userDistRegulado.id,
      nombre: "Combustol Ltda.",
      nit: "800.123.456-7",
      tipo: "REGULADO",
      direccion: "Carrera 43A # 16A Sur - 38",
      ciudad: "Medellín",
      departamento: "Antioquia",
      activo: true,
    },
  });

  const distribPetrocosta = await prisma.distribuidor.upsert({
    where: { nit: "901.234.567-8" },
    update: {},
    create: {
      nombre: "Petrocosta S.A.S.",
      nit: "901.234.567-8",
      tipo: "REGULADO",
      direccion: "Cra 46 # 74 - 12",
      ciudad: "Barranquilla",
      departamento: "Atlántico",
      activo: true,
    },
  });

  console.log("  ✅ 3 distribuidores creados\n");

  // ── 7. ESTACIONES DE SERVICIO ──────────────────────────────────────────────
  console.log("📌 Creando estaciones de servicio...");

  const estacionBogotaNorte = await prisma.estacionServicio.upsert({
    where: { nit: "700.111.222-1" },
    update: {},
    create: {
      usuarioId: userEstacion1.id,
      nombre: "EDS Bogotá Norte - Autopista",
      nit: "700.111.222-1",
      direccion: "Autopista Norte Km 7, Salida Chía",
      ciudad: "Bogotá",
      departamento: "Cundinamarca",
      codigoSicom: "SICOM-BOG-001",
      latitud: 4.7890,
      longitud: -74.0450,
      zonaId: zonaCentro.id,
      distribuidorId: distribTerpel.id,
      activa: true,
    },
  });

  const estacionBogotaSur = await prisma.estacionServicio.upsert({
    where: { nit: "700.111.222-2" },
    update: {},
    create: {
      nombre: "EDS Bogotá Sur - Soacha",
      nit: "700.111.222-2",
      direccion: "Autopista Sur # 50 - 80",
      ciudad: "Bogotá",
      departamento: "Cundinamarca",
      codigoSicom: "SICOM-BOG-002",
      latitud: 4.5781,
      longitud: -74.1420,
      zonaId: zonaCentro.id,
      distribuidorId: distribTerpel.id,
      activa: true,
    },
  });

  const estacionMedellin = await prisma.estacionServicio.upsert({
    where: { nit: "700.222.333-1" },
    update: {},
    create: {
      usuarioId: userEstacion2.id,
      nombre: "EDS Medellín - Laureles",
      nit: "700.222.333-1",
      direccion: "Circular 76 # 39A - 12",
      ciudad: "Medellín",
      departamento: "Antioquia",
      codigoSicom: "SICOM-MED-001",
      latitud: 6.2476,
      longitud: -75.5658,
      zonaId: zonaAntioquiaCafe.id,
      distribuidorId: distribCombustol.id,
      activa: true,
    },
  });

  const estacionBarranquilla = await prisma.estacionServicio.upsert({
    where: { nit: "700.333.444-1" },
    update: {},
    create: {
      usuarioId: userEstacion3.id,
      nombre: "EDS Barranquilla Centro",
      nit: "700.333.444-1",
      direccion: "Carrera 46 # 72 - 55",
      ciudad: "Barranquilla",
      departamento: "Atlántico",
      codigoSicom: "SICOM-BAR-001",
      latitud: 10.9639,
      longitud: -74.7964,
      zonaId: zonaCaribe.id,
      distribuidorId: distribPetrocosta.id,
      activa: true,
    },
  });

  const estacionCali = await prisma.estacionServicio.upsert({
    where: { nit: "700.444.555-1" },
    update: {},
    create: {
      nombre: "EDS Cali - Sur",
      nit: "700.444.555-1",
      direccion: "Calle 5 # 38 - 20, Ciudad Jardín",
      ciudad: "Cali",
      departamento: "Valle del Cauca",
      codigoSicom: "SICOM-CAL-001",
      latitud: 3.3815,
      longitud: -76.5205,
      zonaId: zonaPacifica.id,
      distribuidorId: distribTerpel.id,
      activa: true,
    },
  });

  console.log("  ✅ 5 estaciones creadas\n");

  // ── 8. TANQUES ─────────────────────────────────────────────────────────────
  console.log("📌 Creando tanques por estación...");

  // Bogotá Norte
  const tanqueBogNorteGasCorriente = await prisma.tanque.create({
    data: {
      nombre: "Tanque GC-01 Bogotá Norte",
      capacidadGalones: 10000,
      nivelActual: 7200,
      nivelMinimo: 1000,
      tipoCombustible: "GASOLINA_CORRIENTE",
      estacionId: estacionBogotaNorte.id,
      activo: true,
    },
  });

  const tanqueBogNorteGasExtra = await prisma.tanque.create({
    data: {
      nombre: "Tanque GE-01 Bogotá Norte",
      capacidadGalones: 5000,
      nivelActual: 3100,
      nivelMinimo: 500,
      tipoCombustible: "GASOLINA_EXTRA",
      estacionId: estacionBogotaNorte.id,
      activo: true,
    },
  });

  const tanqueBogNorteAcpm = await prisma.tanque.create({
    data: {
      nombre: "Tanque ACPM-01 Bogotá Norte",
      capacidadGalones: 12000,
      nivelActual: 9500,
      nivelMinimo: 1200,
      tipoCombustible: "ACPM",
      estacionId: estacionBogotaNorte.id,
      activo: true,
    },
  });

  // Medellín
  const tanqueMedGasCorriente = await prisma.tanque.create({
    data: {
      nombre: "Tanque GC-01 Medellín Laureles",
      capacidadGalones: 8000,
      nivelActual: 4500,
      nivelMinimo: 800,
      tipoCombustible: "GASOLINA_CORRIENTE",
      estacionId: estacionMedellin.id,
      activo: true,
    },
  });

  const tanqueMedAcpm = await prisma.tanque.create({
    data: {
      nombre: "Tanque ACPM-01 Medellín Laureles",
      capacidadGalones: 10000,
      nivelActual: 6000,
      nivelMinimo: 1000,
      tipoCombustible: "ACPM",
      estacionId: estacionMedellin.id,
      activo: true,
    },
  });

  // Barranquilla
  const tanqueBarGasCorriente = await prisma.tanque.create({
    data: {
      nombre: "Tanque GC-01 Barranquilla Centro",
      capacidadGalones: 9000,
      nivelActual: 2800,
      nivelMinimo: 900,
      tipoCombustible: "GASOLINA_CORRIENTE",
      estacionId: estacionBarranquilla.id,
      activo: true,
    },
  });

  const tanqueBarAcpm = await prisma.tanque.create({
    data: {
      nombre: "Tanque ACPM-01 Barranquilla Centro",
      capacidadGalones: 11000,
      nivelActual: 7700,
      nivelMinimo: 1100,
      tipoCombustible: "ACPM",
      estacionId: estacionBarranquilla.id,
      activo: true,
    },
  });

  // Cali
  const tanqueCaliGasCorriente = await prisma.tanque.create({
    data: {
      nombre: "Tanque GC-01 Cali Sur",
      capacidadGalones: 8500,
      nivelActual: 5100,
      nivelMinimo: 850,
      tipoCombustible: "GASOLINA_CORRIENTE",
      estacionId: estacionCali.id,
      activo: true,
    },
  });

  // Bogotá Sur
  const tanqueBogSurGasCorriente = await prisma.tanque.create({
    data: {
      nombre: "Tanque GC-01 Bogotá Sur",
      capacidadGalones: 9500,
      nivelActual: 6300,
      nivelMinimo: 950,
      tipoCombustible: "GASOLINA_CORRIENTE",
      estacionId: estacionBogotaSur.id,
      activo: true,
    },
  });

  const tanqueBogSurAcpm = await prisma.tanque.create({
    data: {
      nombre: "Tanque ACPM-01 Bogotá Sur",
      capacidadGalones: 13000,
      nivelActual: 10200,
      nivelMinimo: 1300,
      tipoCombustible: "ACPM",
      estacionId: estacionBogotaSur.id,
      activo: true,
    },
  });

  console.log("  ✅ 10 tanques creados\n");

  // ── 9. ENTREGAS DE DISTRIBUIDOR ────────────────────────────────────────────
  console.log("📌 Creando entregas de distribuidor...");

  const entrega1 = await prisma.entregaDistribuidor.upsert({
    where: { numeroRemision: "REM-2025-00001" },
    update: {},
    create: {
      distribuidorId: distribTerpel.id,
      estacionId: estacionBogotaNorte.id,
      tanqueId: tanqueBogNorteGasCorriente.id,
      tipoCombustible: "GASOLINA_CORRIENTE",
      galones: 3000,
      precioUnitario: 8100.00,
      precioTotal: 24300000.00,
      numeroRemision: "REM-2025-00001",
      fechaEntrega: new Date("2025-03-10T08:00:00Z"),
      confirmada: true,
    },
  });

  const entrega2 = await prisma.entregaDistribuidor.upsert({
    where: { numeroRemision: "REM-2025-00002" },
    update: {},
    create: {
      distribuidorId: distribTerpel.id,
      estacionId: estacionBogotaNorte.id,
      tanqueId: tanqueBogNorteAcpm.id,
      tipoCombustible: "ACPM",
      galones: 4000,
      precioUnitario: 6700.00,
      precioTotal: 26800000.00,
      numeroRemision: "REM-2025-00002",
      fechaEntrega: new Date("2025-03-12T09:30:00Z"),
      confirmada: true,
    },
  });

  const entrega3 = await prisma.entregaDistribuidor.upsert({
    where: { numeroRemision: "REM-2025-00003" },
    update: {},
    create: {
      distribuidorId: distribCombustol.id,
      estacionId: estacionMedellin.id,
      tanqueId: tanqueMedGasCorriente.id,
      tipoCombustible: "GASOLINA_CORRIENTE",
      galones: 2500,
      precioUnitario: 8100.00,
      precioTotal: 20250000.00,
      numeroRemision: "REM-2025-00003",
      fechaEntrega: new Date("2025-03-15T07:00:00Z"),
      confirmada: true,
    },
  });

  const entrega4 = await prisma.entregaDistribuidor.upsert({
    where: { numeroRemision: "REM-2025-00004" },
    update: {},
    create: {
      distribuidorId: distribPetrocosta.id,
      estacionId: estacionBarranquilla.id,
      tanqueId: tanqueBarAcpm.id,
      tipoCombustible: "ACPM",
      galones: 5000,
      precioUnitario: 6700.00,
      precioTotal: 33500000.00,
      numeroRemision: "REM-2025-00004",
      fechaEntrega: new Date("2025-03-18T06:00:00Z"),
      confirmada: false,
    },
  });

  console.log("  ✅ 4 entregas creadas\n");

  // ── 10. TRANSACCIONES DE COMBUSTIBLE ──────────────────────────────────────
  console.log("📌 Creando transacciones de combustible...");

  // Entradas por entregas
  await prisma.transaccionCombustible.create({
    data: {
      estacionId: estacionBogotaNorte.id,
      tanqueId: tanqueBogNorteGasCorriente.id,
      distribuidorId: distribTerpel.id,
      entregaId: entrega1.id,
      tipo: "ENTRADA",
      tipoCombustible: "GASOLINA_CORRIENTE",
      tipoServicio: "PARTICULAR",
      galones: 3000,
      precioUnitario: 8100.00,
      precioTotal: 24300000.00,
      estado: "COMPLETADA",
      subsidioAplicado: false,
      decretoAplicado: "DECRETO-2025-001",
    },
  });

  await prisma.transaccionCombustible.create({
    data: {
      estacionId: estacionBogotaNorte.id,
      tanqueId: tanqueBogNorteAcpm.id,
      distribuidorId: distribTerpel.id,
      entregaId: entrega2.id,
      tipo: "ENTRADA",
      tipoCombustible: "ACPM",
      tipoServicio: "CARGA",
      galones: 4000,
      precioUnitario: 6700.00,
      precioTotal: 26800000.00,
      estado: "COMPLETADA",
      subsidioAplicado: false,
      decretoAplicado: "DECRETO-2025-001",
    },
  });

  // Ventas (salidas) - particulares
  const ventasParticulares = [
    { estacionId: estacionBogotaNorte.id, tanqueId: tanqueBogNorteGasCorriente.id, galones: 12.5,  placa: "ABC-123", tipo: "GASOLINA_CORRIENTE" as const, precio: 9850.00 },
    { estacionId: estacionBogotaNorte.id, tanqueId: tanqueBogNorteGasCorriente.id, galones: 8.0,   placa: "DEF-456", tipo: "GASOLINA_CORRIENTE" as const, precio: 9850.00 },
    { estacionId: estacionBogotaNorte.id, tanqueId: tanqueBogNorteGasExtra.id,     galones: 10.0,  placa: "GHI-789", tipo: "GASOLINA_EXTRA" as const,     precio: 12400.00 },
    { estacionId: estacionBogotaNorte.id, tanqueId: tanqueBogNorteAcpm.id,         galones: 40.0,  placa: "JKL-012", tipo: "ACPM" as const,               precio: 8200.00 },
    { estacionId: estacionMedellin.id,    tanqueId: tanqueMedGasCorriente.id,      galones: 15.0,  placa: "MNO-345", tipo: "GASOLINA_CORRIENTE" as const, precio: 9850.00 },
    { estacionId: estacionMedellin.id,    tanqueId: tanqueMedAcpm.id,              galones: 60.0,  placa: "PQR-678", tipo: "ACPM" as const,               precio: 8200.00 },
    { estacionId: estacionBarranquilla.id,tanqueId: tanqueBarGasCorriente.id,      galones: 9.5,   placa: "STU-901", tipo: "GASOLINA_CORRIENTE" as const, precio: 9850.00 },
    { estacionId: estacionCali.id,        tanqueId: tanqueCaliGasCorriente.id,     galones: 11.0,  placa: "VWX-234", tipo: "GASOLINA_CORRIENTE" as const, precio: 9850.00 },
    { estacionId: estacionBogotaSur.id,   tanqueId: tanqueBogSurAcpm.id,           galones: 80.0,  placa: "YZA-567", tipo: "ACPM" as const,               precio: 8200.00 },
    { estacionId: estacionBogotaSur.id,   tanqueId: tanqueBogSurGasCorriente.id,   galones: 7.5,   placa: "BCD-890", tipo: "GASOLINA_CORRIENTE" as const, precio: 9850.00 },
  ];

  for (const venta of ventasParticulares) {
    await prisma.transaccionCombustible.create({
      data: {
        estacionId: venta.estacionId,
        tanqueId: venta.tanqueId,
        tipo: "SALIDA",
        tipoCombustible: venta.tipo,
        tipoServicio: "PARTICULAR",
        galones: venta.galones,
        precioUnitario: venta.precio,
        precioTotal: parseFloat((venta.galones * venta.precio).toFixed(2)),
        placaVehiculo: venta.placa,
        estado: "COMPLETADA",
        subsidioAplicado: false,
        decretoAplicado: "DECRETO-2025-001",
      },
    });
  }

  // Ventas a transporte público (con subsidio)
  await prisma.transaccionCombustible.create({
    data: {
      estacionId: estacionBogotaNorte.id,
      tanqueId: tanqueBogNorteGasCorriente.id,
      tipo: "SALIDA",
      tipoCombustible: "GASOLINA_CORRIENTE",
      tipoServicio: "PUBLICO",
      galones: 25.0,
      precioUnitario: 8600.00,
      precioTotal: 215000.00,
      placaVehiculo: "TPC-0011",
      estado: "COMPLETADA",
      subsidioAplicado: true,
      decretoAplicado: "DECRETO-2025-001",
    },
  });

  await prisma.transaccionCombustible.create({
    data: {
      estacionId: estacionMedellin.id,
      tanqueId: tanqueMedAcpm.id,
      tipo: "SALIDA",
      tipoCombustible: "ACPM",
      tipoServicio: "PUBLICO",
      galones: 120.0,
      precioUnitario: 6800.00,
      precioTotal: 816000.00,
      placaVehiculo: "BUS-5502",
      estado: "COMPLETADA",
      subsidioAplicado: true,
      decretoAplicado: "DECRETO-2025-001",
    },
  });

  // Transacción anulada (ejemplo de auditoría)
  await prisma.transaccionCombustible.create({
    data: {
      estacionId: estacionBogotaSur.id,
      tanqueId: tanqueBogSurGasCorriente.id,
      tipo: "SALIDA",
      tipoCombustible: "GASOLINA_CORRIENTE",
      tipoServicio: "PARTICULAR",
      galones: 5.0,
      precioUnitario: 9850.00,
      precioTotal: 49250.00,
      placaVehiculo: "EFG-999",
      estado: "ANULADA",
      subsidioAplicado: false,
      decretoAplicado: "DECRETO-2025-001",
    },
  });

  console.log("  ✅ Transacciones de combustible creadas\n");

  // ── 11. REPORTES ───────────────────────────────────────────────────────────
  console.log("📌 Creando reportes de ejemplo...");

  await prisma.reporte.create({
    data: {
      tipo: "INVENTARIO",
      formato: "PDF",
      periodoInicio: new Date("2025-03-01"),
      periodoFin: new Date("2025-03-31"),
      parametros: { zonas: ["Zona Centro", "Zona Caribe"], incluirGraficas: true },
      archivoUrl: "https://storage.example.com/reportes/inventario-marzo-2025.pdf",
      generadoPor: adminUser.id,
    },
  });

  await prisma.reporte.create({
    data: {
      tipo: "TRANSACCIONES",
      formato: "EXCEL",
      periodoInicio: new Date("2025-03-01"),
      periodoFin: new Date("2025-03-31"),
      parametros: { tipoServicio: ["PUBLICO", "CARGA"], agrupadoPor: "estacion" },
      archivoUrl: "https://storage.example.com/reportes/transacciones-marzo-2025.xlsx",
      generadoPor: supervisorCentro.id,
    },
  });

  await prisma.reporte.create({
    data: {
      tipo: "PRECIOS",
      formato: "CSV",
      periodoInicio: new Date("2025-01-01"),
      periodoFin: new Date("2025-03-31"),
      parametros: { incluirHistorico: true, formato: "sicom" },
      generadoPor: adminUser.id,
    },
  });

  console.log("  ✅ 3 reportes creados\n");

  // ── 12. AUDITORÍA ──────────────────────────────────────────────────────────
  console.log("📌 Creando registros de auditoría...");

  await prisma.auditoriaLog.create({
    data: {
      usuarioId: adminUser.id,
      modulo: "USUARIOS",
      accion: "CREATE",
      entidad: "Usuario",
      entidadId: supervisorCentro.id,
      datosAntes: null,
      datosDespues: { email: supervisorCentro.email, rolId: rolSupervisor.id, nombre: supervisorCentro.nombre },
      ip: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0",
    },
  });

  await prisma.auditoriaLog.create({
    data: {
      usuarioId: adminUser.id,
      modulo: "PRECIOS",
      accion: "CREATE",
      entidad: "PrecioVigente",
      datosAntes: null,
      datosDespues: { tipoCombustible: "GASOLINA_CORRIENTE", tipoServicio: "PUBLICO", precioGalon: 8600.00 },
      ip: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0",
    },
  });

  await prisma.auditoriaLog.create({
    data: {
      usuarioId: supervisorCentro.id,
      modulo: "TRANSACCIONES",
      accion: "ANULAR",
      entidad: "TransaccionCombustible",
      datosAntes: { estado: "COMPLETADA", placaVehiculo: "EFG-999" },
      datosDespues: { estado: "ANULADA", motivoAnulacion: "Error en registro de placa" },
      ip: "10.0.0.55",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1",
    },
  });

  console.log("  ✅ 3 registros de auditoría creados\n");

  // ── RESUMEN FINAL ──────────────────────────────────────────────────────────
  console.log("═══════════════════════════════════════════════");
  console.log("✅ SEED COMPLETADO EXITOSAMENTE");
  console.log("═══════════════════════════════════════════════");
  console.log(`  Roles:               4`);
  console.log(`  Zonas distribución:  6`);
  console.log(`  Decretos:            3`);
  console.log(`  Precios vigentes:    ${preciosZonaCentro.length + preciosZonaAmazonia.length}`);
  console.log(`  Usuarios:            7`);
  console.log(`  Distribuidores:      3`);
  console.log(`  Estaciones:          5`);
  console.log(`  Tanques:             10`);
  console.log(`  Entregas:            4`);
  console.log(`  Transacciones:       ${ventasParticulares.length + 4}`);
  console.log(`  Reportes:            3`);
  console.log(`  Auditoría:           3`);
  console.log("═══════════════════════════════════════════════\n");
  console.log("🔑 Credenciales de acceso:");
  console.log("  admin@combustibles.gov.co          → Admin@2025!");
  console.log("  supervisor.centro@combustibles...  → Supervisor@2025!");
  console.log("  operaciones@terpel.com.co           → Terpel@2025!");
  console.log("  estacion.bogota.norte@example.com   → Estacion@2025!\n");
}

main()
  .catch((e) => {
    console.error("❌ Error durante el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
