-- ═══════════════════════════════════════════════════════
-- APLICAR EN: supabase.com → SQL Editor
-- Migraciones 006 + 007 combinadas (idempotentes con IF NOT EXISTS)
-- ═══════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────
-- MIG 006: Multi-local + roles + UserTenant + AsignacionAsesor
-- ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "UserTenant" (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL,
  tenant_id UUID NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  UNIQUE(user_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_usertenant_user_id ON "UserTenant"(user_id);
CREATE INDEX IF NOT EXISTS idx_usertenant_tenant_id ON "UserTenant"(tenant_id);

-- Migrar datos existentes desde User.tenant_id
INSERT INTO "UserTenant" (user_id, tenant_id)
SELECT id, tenant_id FROM "User"
WHERE tenant_id IS NOT NULL
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS "AsignacionAsesor" (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asesor_id UUID NOT NULL,
  tenant_id UUID NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  activo    BOOLEAN NOT NULL DEFAULT true,
  desde     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(asesor_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_asignacion_asesor ON "AsignacionAsesor"(asesor_id);
CREATE INDEX IF NOT EXISTS idx_asignacion_tenant ON "AsignacionAsesor"(tenant_id);

-- Ampliar CHECK de rol
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_rol_check";
ALTER TABLE "User" ADD CONSTRAINT "User_rol_check"
  CHECK (rol IN ('trabajador_local', 'admin_local', 'asesor', 'admin_nucleo'));

ALTER TABLE "UserTenant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AsignacionAsesor" ENABLE ROW LEVEL SECURITY;

-- Trigger: crear tenant + userTenant al registrar usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_nombre TEXT;
  v_nombre_local TEXT;
  v_rut_local TEXT;
  v_direccion TEXT;
  v_plan TEXT;
BEGIN
  v_nombre       := COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1));
  v_nombre_local := COALESCE(NEW.raw_user_meta_data->>'nombre_local', 'Mi Local');
  v_rut_local    := COALESCE(NEW.raw_user_meta_data->>'rut_local', '0.000.000-0');
  v_direccion    := COALESCE(NEW.raw_user_meta_data->>'direccion', 'Osorno');
  v_plan         := COALESCE(NEW.raw_user_meta_data->>'plan', 'calidad');

  INSERT INTO public."Tenant" (nombre, rut, direccion, plan)
  VALUES (v_nombre_local, v_rut_local, v_direccion, v_plan)
  RETURNING id INTO v_tenant_id;

  INSERT INTO public."User" (id, email, nombre, rol)
  VALUES (NEW.id, NEW.email, v_nombre, 'admin_local')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public."UserTenant" (user_id, tenant_id)
  VALUES (NEW.id, v_tenant_id)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'handle_new_user error for %: % %', NEW.email, SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Función auxiliar de contexto (bypasea RLS para tRPC)
CREATE OR REPLACE FUNCTION get_user_context(p_user_id UUID)
RETURNS TABLE(tenant_ids TEXT[], rol TEXT)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    ARRAY_AGG(ut.tenant_id::text) AS tenant_ids,
    u.rol
  FROM public."User" u
  JOIN public."UserTenant" ut ON ut.user_id = u.id
  WHERE u.id = p_user_id AND u.activo = true
  GROUP BY u.rol
  LIMIT 1;
$$;

-- ─────────────────────────────────────────────────────
-- MIG 007: Cierre NC + módulo Tareas
-- ─────────────────────────────────────────────────────

ALTER TABLE "NoConformidad"
  ADD COLUMN IF NOT EXISTS "evidencia_cierre" TEXT,
  ADD COLUMN IF NOT EXISTS "cerrada_at" TIMESTAMPTZ;

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

CREATE INDEX IF NOT EXISTS idx_tarea_tenant ON "Tarea"(tenant_id, activa);
CREATE INDEX IF NOT EXISTS idx_tareacomp_tarea ON "TareaCompletacion"(tarea_id, fecha);
CREATE INDEX IF NOT EXISTS idx_tareacomp_user ON "TareaCompletacion"(user_id);

ALTER TABLE "Tarea" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TareaCompletacion" ENABLE ROW LEVEL SECURITY;

-- RLS policies con bloques DO para idempotencia
DO $$ BEGIN
  CREATE POLICY "tenant_members_can_read_tareas"
    ON "Tarea" FOR SELECT
    USING (tenant_id IN (
      SELECT tenant_id FROM "UserTenant" WHERE user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "admin_can_insert_tareas"
    ON "Tarea" FOR INSERT
    WITH CHECK (tenant_id IN (
      SELECT tenant_id FROM "UserTenant" WHERE user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "admin_can_update_tareas"
    ON "Tarea" FOR UPDATE
    USING (tenant_id IN (
      SELECT tenant_id FROM "UserTenant" WHERE user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "user_can_read_completaciones"
    ON "TareaCompletacion" FOR SELECT
    USING (
      user_id = auth.uid() OR
      tarea_id IN (
        SELECT t.id FROM "Tarea" t
        JOIN "UserTenant" ut ON ut.tenant_id = t.tenant_id
        WHERE ut.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "user_can_insert_completaciones"
    ON "TareaCompletacion" FOR INSERT
    WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "user_can_delete_completaciones"
    ON "TareaCompletacion" FOR DELETE
    USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────
-- Verificación final
-- ─────────────────────────────────────────────────────
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('UserTenant','AsignacionAsesor','Tarea','TareaCompletacion')
ORDER BY table_name;
