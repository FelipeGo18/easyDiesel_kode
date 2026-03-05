-- CreateEnum
CREATE TYPE "TipoCombustible" AS ENUM ('ACPM', 'GASOLINA_CORRIENTE', 'GASOLINA_EXTRA');

-- CreateEnum
CREATE TYPE "TipoServicio" AS ENUM ('PARTICULAR', 'PUBLICO', 'DIPLOMATICO', 'OFICIAL', 'CARGA');

-- CreateEnum
CREATE TYPE "TipoTransaccion" AS ENUM ('ENTRADA', 'SALIDA');

-- CreateEnum
CREATE TYPE "TipoDistribuidor" AS ENUM ('MAYORISTA', 'REGULADO');

-- CreateEnum
CREATE TYPE "TipoZona" AS ENUM ('INTERCONECTADA', 'NO_INTERCONECTADA');

-- CreateEnum
CREATE TYPE "EstadoTransaccion" AS ENUM ('COMPLETADA', 'ANULADA', 'PENDIENTE');

-- CreateEnum
CREATE TYPE "TipoReporte" AS ENUM ('INVENTARIO', 'TRANSACCIONES', 'PRECIOS', 'AUDITORIA', 'NORMATIVO');

-- CreateEnum
CREATE TYPE "FormatoReporte" AS ENUM ('PDF', 'EXCEL', 'CSV');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'GOOGLE');

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "permisos" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "google_id" TEXT,
    "auth_provider" "AuthProvider" NOT NULL DEFAULT 'LOCAL',
    "foto_url" TEXT,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "rol_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estaciones_servicio" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nit" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "departamento" TEXT NOT NULL,
    "codigo_sicom" TEXT NOT NULL,
    "latitud" DECIMAL(9,6),
    "longitud" DECIMAL(9,6),
    "zona_id" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estaciones_servicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distribuidores" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nit" TEXT NOT NULL,
    "tipo" "TipoDistribuidor" NOT NULL,
    "direccion" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "departamento" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "distribuidores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tanques" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "capacidad_galones" DECIMAL(10,2) NOT NULL,
    "nivel_actual" DECIMAL(10,2) NOT NULL,
    "nivel_minimo" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tipo_combustible" "TipoCombustible" NOT NULL,
    "estacion_id" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tanques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transacciones_combustible" (
    "id" TEXT NOT NULL,
    "estacion_id" TEXT NOT NULL,
    "tanque_id" TEXT NOT NULL,
    "distribuidor_id" TEXT,
    "entrega_id" TEXT,
    "tipo" "TipoTransaccion" NOT NULL DEFAULT 'SALIDA',
    "tipo_combustible" "TipoCombustible" NOT NULL,
    "tipo_servicio" "TipoServicio" NOT NULL,
    "galones" DECIMAL(10,3) NOT NULL,
    "precio_unitario" DECIMAL(10,2) NOT NULL,
    "precio_total" DECIMAL(10,2) NOT NULL,
    "placa_vehiculo" TEXT,
    "estado" "EstadoTransaccion" NOT NULL DEFAULT 'COMPLETADA',
    "decreto_aplicado" TEXT,
    "subsidio_aplicado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transacciones_combustible_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entregas_distribuidor" (
    "id" TEXT NOT NULL,
    "distribuidor_id" TEXT NOT NULL,
    "estacion_id" TEXT NOT NULL,
    "tanque_id" TEXT NOT NULL,
    "tipo_combustible" "TipoCombustible" NOT NULL,
    "galones" DECIMAL(10,2) NOT NULL,
    "precio_unitario" DECIMAL(10,2) NOT NULL,
    "precio_total" DECIMAL(10,2) NOT NULL,
    "numero_remision" TEXT NOT NULL,
    "fecha_entrega" TIMESTAMP(3) NOT NULL,
    "confirmada" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entregas_distribuidor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zonas_distribucion" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo_zona" "TipoZona" NOT NULL DEFAULT 'INTERCONECTADA',
    "departamentos" TEXT[],
    "descripcion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zonas_distribucion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "precios_vigentes" (
    "id" TEXT NOT NULL,
    "tipo_combustible" "TipoCombustible" NOT NULL,
    "tipo_servicio" "TipoServicio" NOT NULL,
    "zona_id" TEXT NOT NULL,
    "precio_galon" DECIMAL(10,2) NOT NULL,
    "subsidio_galon" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "decreto_id" TEXT NOT NULL,
    "vigencia_desde" TIMESTAMP(3) NOT NULL,
    "vigencia_hasta" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "precios_vigentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decretos_normativos" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "entidad" TEXT,
    "fecha_expedicion" TIMESTAMP(3) NOT NULL,
    "fecha_vigencia" TIMESTAMP(3) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "documento_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "decretos_normativos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria_log" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "modulo" TEXT,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidad_id" TEXT,
    "datos_antes" JSONB,
    "datos_despues" JSONB,
    "ip" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reportes" (
    "id" TEXT NOT NULL,
    "tipo" "TipoReporte" NOT NULL,
    "formato" "FormatoReporte" NOT NULL,
    "periodo_inicio" DATE NOT NULL,
    "periodo_fin" DATE NOT NULL,
    "parametros" JSONB,
    "archivo_url" TEXT,
    "generado_por" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reportes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_key" ON "roles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_google_id_key" ON "usuarios"("google_id");

-- CreateIndex
CREATE INDEX "usuarios_rol_id_idx" ON "usuarios"("rol_id");

-- CreateIndex
CREATE UNIQUE INDEX "estaciones_servicio_usuario_id_key" ON "estaciones_servicio"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "estaciones_servicio_nit_key" ON "estaciones_servicio"("nit");

-- CreateIndex
CREATE UNIQUE INDEX "estaciones_servicio_codigo_sicom_key" ON "estaciones_servicio"("codigo_sicom");

-- CreateIndex
CREATE INDEX "estaciones_servicio_zona_id_idx" ON "estaciones_servicio"("zona_id");

-- CreateIndex
CREATE INDEX "estaciones_servicio_ciudad_departamento_idx" ON "estaciones_servicio"("ciudad", "departamento");

-- CreateIndex
CREATE UNIQUE INDEX "distribuidores_usuario_id_key" ON "distribuidores"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "distribuidores_nit_key" ON "distribuidores"("nit");

-- CreateIndex
CREATE INDEX "tanques_estacion_id_idx" ON "tanques"("estacion_id");

-- CreateIndex
CREATE INDEX "tanques_tipo_combustible_idx" ON "tanques"("tipo_combustible");

-- CreateIndex
CREATE INDEX "transacciones_combustible_estacion_id_created_at_idx" ON "transacciones_combustible"("estacion_id", "created_at");

-- CreateIndex
CREATE INDEX "transacciones_combustible_tipo_combustible_tipo_servicio_idx" ON "transacciones_combustible"("tipo_combustible", "tipo_servicio");

-- CreateIndex
CREATE INDEX "transacciones_combustible_distribuidor_id_idx" ON "transacciones_combustible"("distribuidor_id");

-- CreateIndex
CREATE INDEX "transacciones_combustible_entrega_id_idx" ON "transacciones_combustible"("entrega_id");

-- CreateIndex
CREATE UNIQUE INDEX "entregas_distribuidor_numero_remision_key" ON "entregas_distribuidor"("numero_remision");

-- CreateIndex
CREATE INDEX "entregas_distribuidor_distribuidor_id_fecha_entrega_idx" ON "entregas_distribuidor"("distribuidor_id", "fecha_entrega");

-- CreateIndex
CREATE INDEX "entregas_distribuidor_estacion_id_idx" ON "entregas_distribuidor"("estacion_id");

-- CreateIndex
CREATE UNIQUE INDEX "zonas_distribucion_nombre_key" ON "zonas_distribucion"("nombre");

-- CreateIndex
CREATE INDEX "precios_vigentes_activo_tipo_combustible_idx" ON "precios_vigentes"("activo", "tipo_combustible");

-- CreateIndex
CREATE INDEX "precios_vigentes_zona_id_idx" ON "precios_vigentes"("zona_id");

-- CreateIndex
CREATE INDEX "precios_vigentes_decreto_id_idx" ON "precios_vigentes"("decreto_id");

-- CreateIndex
CREATE UNIQUE INDEX "precios_vigentes_tipo_combustible_tipo_servicio_zona_id_act_key" ON "precios_vigentes"("tipo_combustible", "tipo_servicio", "zona_id", "activo");

-- CreateIndex
CREATE UNIQUE INDEX "decretos_normativos_numero_key" ON "decretos_normativos"("numero");

-- CreateIndex
CREATE INDEX "auditoria_log_usuario_id_created_at_idx" ON "auditoria_log"("usuario_id", "created_at");

-- CreateIndex
CREATE INDEX "auditoria_log_entidad_entidad_id_idx" ON "auditoria_log"("entidad", "entidad_id");

-- CreateIndex
CREATE INDEX "reportes_tipo_created_at_idx" ON "reportes"("tipo", "created_at");

-- CreateIndex
CREATE INDEX "reportes_generado_por_idx" ON "reportes"("generado_por");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estaciones_servicio" ADD CONSTRAINT "estaciones_servicio_zona_id_fkey" FOREIGN KEY ("zona_id") REFERENCES "zonas_distribucion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estaciones_servicio" ADD CONSTRAINT "estaciones_servicio_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuidores" ADD CONSTRAINT "distribuidores_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tanques" ADD CONSTRAINT "tanques_estacion_id_fkey" FOREIGN KEY ("estacion_id") REFERENCES "estaciones_servicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacciones_combustible" ADD CONSTRAINT "transacciones_combustible_estacion_id_fkey" FOREIGN KEY ("estacion_id") REFERENCES "estaciones_servicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacciones_combustible" ADD CONSTRAINT "transacciones_combustible_tanque_id_fkey" FOREIGN KEY ("tanque_id") REFERENCES "tanques"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacciones_combustible" ADD CONSTRAINT "transacciones_combustible_distribuidor_id_fkey" FOREIGN KEY ("distribuidor_id") REFERENCES "distribuidores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacciones_combustible" ADD CONSTRAINT "transacciones_combustible_entrega_id_fkey" FOREIGN KEY ("entrega_id") REFERENCES "entregas_distribuidor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entregas_distribuidor" ADD CONSTRAINT "entregas_distribuidor_distribuidor_id_fkey" FOREIGN KEY ("distribuidor_id") REFERENCES "distribuidores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entregas_distribuidor" ADD CONSTRAINT "entregas_distribuidor_estacion_id_fkey" FOREIGN KEY ("estacion_id") REFERENCES "estaciones_servicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entregas_distribuidor" ADD CONSTRAINT "entregas_distribuidor_tanque_id_fkey" FOREIGN KEY ("tanque_id") REFERENCES "tanques"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "precios_vigentes" ADD CONSTRAINT "precios_vigentes_zona_id_fkey" FOREIGN KEY ("zona_id") REFERENCES "zonas_distribucion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "precios_vigentes" ADD CONSTRAINT "precios_vigentes_decreto_id_fkey" FOREIGN KEY ("decreto_id") REFERENCES "decretos_normativos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_log" ADD CONSTRAINT "auditoria_log_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes" ADD CONSTRAINT "reportes_generado_por_fkey" FOREIGN KEY ("generado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
