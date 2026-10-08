-- Buckets privados para planillas impresas y documentos del local.
-- La primera carpeta del objeto es el id del local.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types, type, versioning_status)
values
  (
    'registros',
    'registros',
    false,
    10485760,
    array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
    'STANDARD',
    'DISABLED'
  ),
  (
    'documentos',
    'documentos',
    false,
    10485760,
    array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
    'STANDARD',
    'DISABLED'
  )
on conflict (id) do nothing;

create or replace function public.archivo_tenant(object_name text)
returns uuid
language sql
immutable
as $$
  select case
    when (storage.foldername(object_name))[1] ~
      '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then (storage.foldername(object_name))[1]::uuid
    else null
  end
$$;

create or replace function public.puede_subir_archivo_local(p_tenant uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_tenant is not null and exists (
    select 1
    from "User" u
    where u.id = auth.uid()
      and u.activo = true
      and (
        u.rol = 'admin_nucleo'
        or (
          u.rol in ('jefe_local', 'admin_local')
          and exists (
            select 1
            from "UserTenant" ut
            where ut.user_id = u.id
              and ut.tenant_id = p_tenant
          )
        )
      )
  );
$$;

create or replace function public.puede_leer_archivo_local(p_tenant uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_tenant is not null and exists (
    select 1
    from "User" u
    where u.id = auth.uid()
      and u.activo = true
      and (
        u.rol = 'admin_nucleo'
        or (
          u.rol in ('jefe_local', 'admin_local', 'trabajador_local')
          and exists (
            select 1
            from "UserTenant" ut
            where ut.user_id = u.id
              and ut.tenant_id = p_tenant
          )
        )
        or (
          u.rol = 'asesor'
          and exists (
            select 1
            from "AsignacionAsesor" a
            where a.asesor_id = u.id
              and a.tenant_id = p_tenant
              and a.activo = true
          )
        )
      )
  );
$$;

revoke all on function public.archivo_tenant(text) from public;
revoke all on function public.puede_subir_archivo_local(uuid) from public;
revoke all on function public.puede_leer_archivo_local(uuid) from public;
grant execute on function public.archivo_tenant(text) to authenticated;
grant execute on function public.puede_subir_archivo_local(uuid) to authenticated;
grant execute on function public.puede_leer_archivo_local(uuid) to authenticated;

drop policy if exists "archivos_locales_select" on storage.objects;
drop policy if exists "archivos_locales_insert" on storage.objects;
drop policy if exists "archivos_locales_update" on storage.objects;
drop policy if exists "archivos_locales_delete" on storage.objects;

create policy "archivos_locales_select"
on storage.objects
for select
to authenticated
using (
  bucket_id in ('registros', 'documentos')
  and public.puede_leer_archivo_local(public.archivo_tenant(name))
);

create policy "archivos_locales_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('registros', 'documentos')
  and public.puede_subir_archivo_local(public.archivo_tenant(name))
);

create policy "archivos_locales_update"
on storage.objects
for update
to authenticated
using (
  bucket_id in ('registros', 'documentos')
  and public.puede_subir_archivo_local(public.archivo_tenant(name))
)
with check (
  bucket_id in ('registros', 'documentos')
  and public.puede_subir_archivo_local(public.archivo_tenant(name))
);

create policy "archivos_locales_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('registros', 'documentos')
  and public.puede_subir_archivo_local(public.archivo_tenant(name))
);
