-- v2.0: Multi-local + 4 roles + UserTenant + AsignacionAsesor
-- Ejecutar en Supabase Dashboard → SQL Editor

-- 1. Crear UserTenant (many-to-many User <-> Tenant)
CREATE TABLE IF NOT EXISTS "UserTenant" (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL,
  tenant_id UUID NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  UNIQUE(user_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_usertenant_user_id ON "UserTenant"(user_id);
CREATE INDEX IF NOT EXISTS idx_usertenant_tenant_id ON "UserTenant"(tenant_id);

-- 2. Migrar datos existentes desde User.tenant_id a UserTenant
INSERT INTO "UserTenant" (user_id, tenant_id)
SELECT id, tenant_id FROM "User"
WHERE tenant_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 3. Crear AsignacionAsesor (asesor asignado a N locales)
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

-- 4. Actualizar CHECK constraint de rol (agrega trabajador_local)
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_rol_check";
ALTER TABLE "User" ADD CONSTRAINT "User_rol_check"
  CHECK (rol IN ('trabajador_local', 'admin_local', 'asesor', 'admin_nucleo'));

-- 5. Habilitar RLS en nuevas tablas
ALTER TABLE "UserTenant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AsignacionAsesor" ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON "UserTenant"
  USING (tenant_id::text = current_setting('app.current_tenant', true));

CREATE POLICY tenant_isolation ON "AsignacionAsesor"
  USING (tenant_id::text = current_setting('app.current_tenant', true));

-- 6. Trigger actualizado: usa UserTenant en lugar de User.tenant_id
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

-- 7. Función auxiliar: devuelve tenants[] y rol para el contexto tRPC
-- (SECURITY DEFINER bypasea RLS para el lookup inicial)
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
