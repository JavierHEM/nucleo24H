CREATE TABLE IF NOT EXISTS "Lead" (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT NOT NULL,
  local       TEXT NOT NULL,
  telefono    TEXT NOT NULL,
  tipo_local  TEXT NOT NULL,
  mensaje     TEXT,
  origen      TEXT NOT NULL DEFAULT 'landing',
  atendido    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "Lead_created_at_idx" ON "Lead"(created_at);
CREATE INDEX IF NOT EXISTS "Lead_telefono_created_at_idx" ON "Lead"(telefono, created_at);

-- Solo el backend (Prisma) escribe y lee: sin políticas, PostgREST no expone la tabla.
ALTER TABLE "Lead" ENABLE ROW LEVEL SECURITY;
