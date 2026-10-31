alter function public.archivo_tenant(text) set search_path = public, storage;

revoke execute on function public.puede_subir_archivo_local(uuid) from anon;
revoke execute on function public.puede_leer_archivo_local(uuid) from anon;
revoke execute on function public.archivo_tenant(text) from anon;
