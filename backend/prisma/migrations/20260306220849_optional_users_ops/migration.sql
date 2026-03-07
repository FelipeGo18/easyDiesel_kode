-- DropForeignKey
ALTER TABLE "distribuidores" DROP CONSTRAINT "distribuidores_usuario_id_fkey";

-- DropForeignKey
ALTER TABLE "estaciones_servicio" DROP CONSTRAINT "estaciones_servicio_usuario_id_fkey";

-- AlterTable
ALTER TABLE "distribuidores" ALTER COLUMN "usuario_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "estaciones_servicio" ALTER COLUMN "usuario_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "estaciones_servicio" ADD CONSTRAINT "estaciones_servicio_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuidores" ADD CONSTRAINT "distribuidores_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
