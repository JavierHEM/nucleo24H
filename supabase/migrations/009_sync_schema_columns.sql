-- Migración 009: sincronizar columnas faltantes con prisma/schema.prisma
-- (la BD us-east-2 no tenía las columnas agregadas en iteraciones previas)
-- Aplicada el 12/06/2026 vía MCP.

ALTER TABLE "Sello"
  ADD COLUMN IF NOT EXISTS "plan_mejoras" TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "descargos_habilitados" BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE "SolicitudArsopb"
  ADD COLUMN IF NOT EXISTS "descripcion" TEXT,
  ADD COLUMN IF NOT EXISTS "respondida_por" TEXT,
  ADD COLUMN IF NOT EXISTS "fecha_respuesta" TIMESTAMPTZ;

ALTER TABLE "DataProcessor"
  ADD COLUMN IF NOT EXISTS "dpa_url" TEXT,
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW();
