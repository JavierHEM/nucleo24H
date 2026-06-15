-- Migración 010: hardening según advisors de Supabase
-- 1) Policies de lectura para tablas con RLS sin policies
-- 2) Revocar EXECUTE de funciones SECURITY DEFINER expuestas vía PostgREST
-- 3) Fijar search_path en set_updated_at

-- UserTenant: cada usuario solo ve sus propias membresías
DO $$ BEGIN
  CREATE POLICY "user_can_read_own_memberships"
    ON "UserTenant" FOR SELECT
    USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AsignacionAsesor: cada asesor solo ve sus asignaciones
DO $$ BEGIN
  CREATE POLICY "asesor_can_read_own_assignments"
    ON "AsignacionAsesor" FOR SELECT
    USING (asesor_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- get_user_context: solo el backend (Prisma con rol postgres) debe llamarla.
REVOKE EXECUTE ON FUNCTION public.get_user_context(uuid) FROM PUBLIC, anon, authenticated;

-- handle_new_user: función de trigger, no debe ser llamable vía RPC.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- set_updated_at: fijar search_path (advisor function_search_path_mutable)
ALTER FUNCTION public.set_updated_at() SET search_path = '';
