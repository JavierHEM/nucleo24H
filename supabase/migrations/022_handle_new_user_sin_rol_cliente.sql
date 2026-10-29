-- El auto-registro siempre crea un local propio con rol admin_local.
-- Ignora rol y tenant_id del metadata: el cliente los envía en signUp.
-- Una invitación (invited_at) no crea filas; la ruta del servidor las crea.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tenant_id UUID;
  v_nombre TEXT;
  v_plan TEXT;
BEGIN
  IF NEW.invited_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  v_nombre := COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1));
  v_plan := COALESCE(NEW.raw_user_meta_data->>'plan', 'calidad');
  IF v_plan NOT IN ('calidad', 'integral') THEN
    v_plan := 'calidad';
  END IF;

  INSERT INTO public."Tenant" (nombre, rut, direccion, plan)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'nombre_local', 'Mi Local'),
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'rut_local', ''),
      'SIN-RUT-' || substr(NEW.id::text, 1, 8)
    ),
    COALESCE(NEW.raw_user_meta_data->>'direccion', 'Osorno'),
    v_plan
  )
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
$function$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
