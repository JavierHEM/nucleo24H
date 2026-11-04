-- Bucket privado para fotos e informes de hallazgos.
-- La primera carpeta del objeto es el id del local.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types, type, versioning_status)
values (
  'hallazgos',
  'hallazgos',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
  'STANDARD',
  'DISABLED'
)
on conflict (id) do nothing;

create or replace function public.puede_subir_archivo_hallazgo(p_tenant uuid)
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
          u.rol in ('trabajador_local', 'jefe_local', 'admin_local')
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

revoke all on function public.puede_subir_archivo_hallazgo(uuid) from public;
grant execute on function public.puede_subir_archivo_hallazgo(uuid) to authenticated;

drop policy if exists "archivos_locales_select" on storage.objects;
drop policy if exists "archivos_locales_insert" on storage.objects;
drop policy if exists "archivos_locales_update" on storage.objects;
drop policy if exists "archivos_locales_delete" on storage.objects;
drop policy if exists "archivos_hallazgos_select" on storage.objects;
drop policy if exists "archivos_hallazgos_insert" on storage.objects;
drop policy if exists "archivos_hallazgos_update" on storage.objects;
drop policy if exists "archivos_hallazgos_delete" on storage.objects;

create policy "archivos_locales_select"
on storage.objects
for select
to authenticated
using (
  bucket_id in ('registros', 'documentos', 'hallazgos')
  and public.puede_leer_archivo_local(public.archivo_tenant(name))
);

create policy "archivos_locales_insert"
on storage.objects
for insert
to authenticated
with check (
  (
    bucket_id in ('registros', 'documentos')
    and public.puede_subir_archivo_local(public.archivo_tenant(name))
  )
  or (
    bucket_id = 'hallazgos'
    and public.puede_subir_archivo_hallazgo(public.archivo_tenant(name))
  )
);

create policy "archivos_locales_update"
on storage.objects
for update
to authenticated
using (
  (
    bucket_id in ('registros', 'documentos')
    and public.puede_subir_archivo_local(public.archivo_tenant(name))
  )
  or (
    bucket_id = 'hallazgos'
    and public.puede_subir_archivo_hallazgo(public.archivo_tenant(name))
  )
)
with check (
  (
    bucket_id in ('registros', 'documentos')
    and public.puede_subir_archivo_local(public.archivo_tenant(name))
  )
  or (
    bucket_id = 'hallazgos'
    and public.puede_subir_archivo_hallazgo(public.archivo_tenant(name))
  )
);

create policy "archivos_locales_delete"
on storage.objects
for delete
to authenticated
using (
  (
    bucket_id in ('registros', 'documentos')
    and public.puede_subir_archivo_local(public.archivo_tenant(name))
  )
  or (
    bucket_id = 'hallazgos'
    and public.puede_subir_archivo_hallazgo(public.archivo_tenant(name))
  )
);
