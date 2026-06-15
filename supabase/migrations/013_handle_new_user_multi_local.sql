-- Migración 013: handle_new_user consciente de invitaciones y multi-local.
--
-- Antes: SIEMPRE creaba un tenant nuevo ("Mi Local", RUT '0.000.000-0') e
-- ignoraba el tenant_id/rol que /api/admin/invitar-local envía en metadata.
-- Consecuencias: tenants basura, conflicto de RUT único que hacía fallar el
-- trigger silenciosamente, e imposibilidad de vincular usuarios existentes.
--
-- Ahora:
--   1. Invitación con tenant_id en metadata → vincula al tenant existente.
--   2. Invitación con rol distinto de admin_local (ej: asesor) → solo User.
--   3. Registro propio → crea el local con los datos del formulario y un
--      placeholder de RUT único si no viene informado.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tenant_id UUID;
  v_rol TEXT;
  v_nombre TEXT;
BEGIN
  v_nombre := COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1));
  v_rol    := COALESCE(NEW.raw_user_meta_data->>'rol', 'admin_local');

  -- Caso 1: invitación a un tenant existente (admin_local de uno o más locales)
  IF NEW.raw_user_meta_data ? 'tenant_id' THEN
    v_tenant_id := (NEW.raw_user_meta_data->>'tenant_id')::uuid;

    INSERT INTO public."User" (id, email, nombre, rol)
    VALUES (NEW.id, NEW.email, v_nombre, v_rol)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public."UserTenant" (user_id, tenant_id)
    VALUES (NEW.id, v_tenant_id)
    ON CONFLICT DO NOTHING;

    RETURN NEW;
  END IF;

  -- Caso 2: invitación sin tenant (asesor, admin_nucleo) → solo el User
  IF v_rol <> 'admin_local' THEN
    INSERT INTO public."User" (id, email, nombre, rol)
    VALUES (NEW.id, NEW.email, v_nombre, v_rol)
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
  END IF;

  -- Caso 3: registro propio → crear el local con datos del formulario
  INSERT INTO public."Tenant" (nombre, rut, direccion, plan)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'nombre_local', 'Mi Local'),
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'rut_local', ''),
      'SIN-RUT-' || substr(NEW.id::text, 1, 8)
    ),
    COALESCE(NEW.raw_user_meta_data->>'direccion', 'Osorno'),
    COALESCE(NEW.raw_user_meta_data->>'plan', 'calidad')
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
