-- Acceso a tutoriales por rol, no por usuario.

drop policy if exists "tutoriales_select" on storage.objects;

alter table public."Tutorial"
  add column if not exists roles_acceso text[] not null default '{}';

do $$
begin
  if to_regclass('public."TutorialAcceso"') is not null then
    update public."Tutorial" t
    set roles_acceso = coalesce((
      select array_agg(distinct u.rol)
      from public."TutorialAcceso" a
      join public."User" u on u.id = a.user_id
      where a.tutorial_id = t.id
    ), t.roles_acceso);
  end if;
end $$;

drop table if exists public."TutorialAcceso";

create or replace function public.puede_ver_objeto_tutorial(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.puede_gestionar_tutoriales()
    or exists (
      select 1
      from "Tutorial" t
      join "User" u on u.id = auth.uid()
      where t.activo = true
        and u.activo = true
        and u.rol = any (t.roles_acceso)
        and public.archivo_tenant(object_name) = t.id
    );
$$;

create policy "tutoriales_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'tutoriales'
  and public.puede_ver_objeto_tutorial(name)
);
