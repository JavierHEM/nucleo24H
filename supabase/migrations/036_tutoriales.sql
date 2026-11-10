-- Videos internos: solo admin_nucleo sube y asigna quién puede verlos.

create table if not exists public."Tutorial" (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text not null default '',
  ruta_video text not null,
  duracion_s int,
  activo boolean not null default true,
  creado_por uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists "Tutorial_activo_created_at_idx"
  on public."Tutorial" (activo, created_at);

create table if not exists public."TutorialAcceso" (
  id uuid primary key default gen_random_uuid(),
  tutorial_id uuid not null references public."Tutorial"(id) on delete cascade,
  user_id uuid not null references public."User"(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (tutorial_id, user_id)
);

create index if not exists "TutorialAcceso_user_id_idx"
  on public."TutorialAcceso" (user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tutoriales',
  'tutoriales',
  false,
  83886080,
  array['video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do nothing;

create or replace function public.puede_gestionar_tutoriales()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from "User" u
    where u.id = auth.uid()
      and u.activo = true
      and u.rol = 'admin_nucleo'
  );
$$;

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
      join "TutorialAcceso" a on a.tutorial_id = t.id
      where t.activo = true
        and a.user_id = auth.uid()
        and public.archivo_tenant(object_name) = t.id
    );
$$;

revoke all on function public.puede_gestionar_tutoriales() from public;
revoke all on function public.puede_ver_objeto_tutorial(text) from public;
grant execute on function public.puede_gestionar_tutoriales() to authenticated;
grant execute on function public.puede_ver_objeto_tutorial(text) to authenticated;

drop policy if exists "tutoriales_select" on storage.objects;
drop policy if exists "tutoriales_insert" on storage.objects;
drop policy if exists "tutoriales_update" on storage.objects;
drop policy if exists "tutoriales_delete" on storage.objects;

create policy "tutoriales_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'tutoriales'
  and public.puede_ver_objeto_tutorial(name)
);

create policy "tutoriales_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'tutoriales'
  and public.puede_gestionar_tutoriales()
);

create policy "tutoriales_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'tutoriales'
  and public.puede_gestionar_tutoriales()
)
with check (
  bucket_id = 'tutoriales'
  and public.puede_gestionar_tutoriales()
);

create policy "tutoriales_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'tutoriales'
  and public.puede_gestionar_tutoriales()
);
