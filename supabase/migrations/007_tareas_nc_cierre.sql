-- Migración 007: Módulo Tareas + campos cierre NC
-- Aplicar manualmente en: supabase.com → SQL Editor

-- 1. Campos de cierre en NoConformidad
ALTER TABLE "NoConformidad"
  ADD COLUMN IF NOT EXISTS "evidencia_cierre" TEXT,
  ADD COLUMN IF NOT EXISTS "cerrada_at" TIMESTAMPTZ;

-- 2. Módulo Tareas
CREATE TABLE IF NOT EXISTS "Tarea" (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  titulo       TEXT NOT NULL,
  descripcion  TEXT,
  frecuencia   TEXT NOT NULL DEFAULT 'diaria',
  activa       BOOLEAN NOT NULL DEFAULT TRUE,
  orden        INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "TareaCompletacion" (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarea_id    UUID NOT NULL REFERENCES "Tarea"(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  fecha       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  observacion TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_tarea_tenant ON "Tarea"(tenant_id, activa);
CREATE INDEX IF NOT EXISTS idx_tareacomp_tarea ON "TareaCompletacion"(tarea_id, fecha);
CREATE INDEX IF NOT EXISTS idx_tareacomp_user ON "TareaCompletacion"(user_id);

-- RLS
ALTER TABLE "Tarea" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TareaCompletacion" ENABLE ROW LEVEL SECURITY;

-- Policies: Tarea
CREATE POLICY "tenant_members_can_read_tareas"
  ON "Tarea" FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM "UserTenant" WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "tenant_members_can_complete_tareas"
  ON "Tarea" FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM "UserTenant" WHERE user_id = auth.uid()
    )
  );

-- Policies: TareaCompletacion
CREATE POLICY "user_can_read_own_completaciones"
  ON "TareaCompletacion" FOR SELECT
  USING (
    user_id = auth.uid() OR
    tarea_id IN (
      SELECT t.id FROM "Tarea" t
      INNER JOIN "UserTenant" ut ON ut.tenant_id = t.tenant_id
      WHERE ut.user_id = auth.uid()
    )
  );

CREATE POLICY "user_can_insert_completaciones"
  ON "TareaCompletacion" FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_can_delete_own_completaciones"
  ON "TareaCompletacion" FOR DELETE
  USING (user_id = auth.uid());
