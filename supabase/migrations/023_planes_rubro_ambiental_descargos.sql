-- Migración 023: rubro del local, visitas agendadas, gestión ambiental,
-- fiscalizaciones y descargos. Cambios aditivos: el código anterior sigue funcionando.

ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS tipo_local TEXT NOT NULL DEFAULT 'restaurante';
ALTER TABLE "Visita" ADD COLUMN IF NOT EXISTS estado TEXT NOT NULL DEFAULT 'realizada';

CREATE TABLE IF NOT EXISTS "GestionAmbiental" (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  tipo        TEXT NOT NULL,
  fecha       TIMESTAMPTZ NOT NULL,
  detalle     TEXT NOT NULL,
  folio       TEXT,
  vence       TIMESTAMPTZ,
  adjunto_url TEXT,
  created_by  UUID NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "GestionAmbiental_tenant_id_tipo_idx" ON "GestionAmbiental"(tenant_id, tipo);
CREATE INDEX IF NOT EXISTS "GestionAmbiental_tenant_id_fecha_idx" ON "GestionAmbiental"(tenant_id, fecha);

CREATE TABLE IF NOT EXISTS "Fiscalizacion" (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  fecha      TIMESTAMPTZ NOT NULL,
  autoridad  TEXT NOT NULL,
  resultado  TEXT NOT NULL,
  detalle    TEXT,
  acta_url   TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "Fiscalizacion_tenant_id_fecha_idx" ON "Fiscalizacion"(tenant_id, fecha);

CREATE TABLE IF NOT EXISTS "Descargo" (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  fiscalizacion_id UUID REFERENCES "Fiscalizacion"(id) ON DELETE SET NULL,
  titulo           TEXT NOT NULL,
  descripcion      TEXT NOT NULL,
  estado           TEXT NOT NULL DEFAULT 'abierto',
  adjuntos         TEXT[] NOT NULL DEFAULT '{}',
  respuesta        TEXT,
  solicitado_por   UUID NOT NULL,
  atendido_por     UUID,
  presentado_at    TIMESTAMPTZ,
  cerrado_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "Descargo_tenant_id_estado_idx" ON "Descargo"(tenant_id, estado);

-- Solo el backend (Prisma) escribe y lee: sin políticas, PostgREST no expone estas tablas.
ALTER TABLE "GestionAmbiental" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Fiscalizacion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Descargo" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE TRIGGER trg_descargo_updated_at
    BEFORE UPDATE ON "Descargo"
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
