-- El trigger no inventa "Mi Local" / SIN-RUT-*. Solo crea un tenant si el
-- signUp trae nombre_local y rut_local. Las invitaciones las arma el servidor.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tenant_id UUID;
  v_nombre TEXT;
  v_nombre_local TEXT;
  v_rut_local TEXT;
  v_plan TEXT;
BEGIN
  IF NEW.invited_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  v_nombre_local := NULLIF(btrim(NEW.raw_user_meta_data->>'nombre_local'), '');
  v_rut_local := NULLIF(btrim(NEW.raw_user_meta_data->>'rut_local'), '');

  IF v_nombre_local IS NULL OR v_rut_local IS NULL THEN
    RETURN NEW;
  END IF;

  v_nombre := COALESCE(
    NULLIF(btrim(NEW.raw_user_meta_data->>'nombre'), ''),
    split_part(NEW.email, '@', 1)
  );
  v_plan := COALESCE(NEW.raw_user_meta_data->>'plan', 'calidad');
  IF v_plan NOT IN ('calidad', 'integral') THEN
    v_plan := 'calidad';
  END IF;

  INSERT INTO public."Tenant" (nombre, rut, direccion, plan)
  VALUES (
    v_nombre_local,
    v_rut_local,
    COALESCE(NULLIF(btrim(NEW.raw_user_meta_data->>'direccion'), ''), 'Osorno'),
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

DELETE FROM public."Tenant"
WHERE nombre = 'Mi Local'
  AND rut LIKE 'SIN-RUT-%';
