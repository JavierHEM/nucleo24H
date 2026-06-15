-- Migración 011: get_user_context debe retornar el rol aunque el usuario
-- no tenga tenants (caso admin_nucleo y asesores sin asignaciones).
-- Antes el JOIN con UserTenant dejaba a admin_nucleo sin contexto.

CREATE OR REPLACE FUNCTION public.get_user_context(p_user_id uuid)
RETURNS TABLE(tenant_ids text[], rol text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    COALESCE(
      ARRAY_AGG(ut.tenant_id::text) FILTER (WHERE ut.tenant_id IS NOT NULL),
      '{}'
    ) AS tenant_ids,
    u.rol
  FROM public."User" u
  LEFT JOIN public."UserTenant" ut ON ut.user_id = u.id
  WHERE u.id = p_user_id AND u.activo = true
  GROUP BY u.rol
  LIMIT 1;
$function$;

-- Mantener el hardening de la migración 010
REVOKE EXECUTE ON FUNCTION public.get_user_context(uuid) FROM PUBLIC, anon, authenticated;
