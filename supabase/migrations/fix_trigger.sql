-- Ejecutar en Supabase Dashboard → SQL Editor
-- Corrige el trigger que fallaba al hacer UPDATE en auth.users

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_rol TEXT := 'admin_local';
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

  INSERT INTO public."User" (id, tenant_id, email, nombre, rol)
  VALUES (NEW.id, v_tenant_id, NEW.email, v_nombre, v_rol);

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
