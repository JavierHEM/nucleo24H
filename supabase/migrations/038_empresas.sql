-- Empresa (ficha legal) 1 → N locales. El RUT vive una vez; Tenant.rut se sincroniza.

CREATE TABLE IF NOT EXISTS public."Empresa" (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razon_social                 TEXT NOT NULL,
  rut                          TEXT NOT NULL,
  giro                         TEXT,
  domicilio_legal              TEXT,
  telefono                     TEXT NOT NULL DEFAULT '',
  email                        TEXT,
  representante_legal_nombre   TEXT NOT NULL DEFAULT '',
  representante_legal_rut      TEXT NOT NULL DEFAULT '',
  representante_legal_telefono TEXT,
  notas_internas               TEXT,
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "Empresa_rut_key" ON public."Empresa"(rut);
CREATE INDEX IF NOT EXISTS "Empresa_razon_social_idx" ON public."Empresa"(razon_social);

ALTER TABLE public."Tenant"
  ADD COLUMN IF NOT EXISTS empresa_id UUID,
  ADD COLUMN IF NOT EXISTS telefono TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS encargado_nombre TEXT,
  ADD COLUMN IF NOT EXISTS encargado_telefono TEXT;

INSERT INTO public."Empresa" (razon_social, rut, domicilio_legal, telefono, created_at)
SELECT
  casa.nombre,
  casa.rut_norm,
  NULLIF(btrim(casa.direccion), ''),
  '',
  casa.created_at
FROM (
  SELECT DISTINCT ON (upper(replace(replace(t.rut, '.', ''), ' ', '')))
    t.nombre,
    t.direccion,
    t.created_at,
    upper(replace(replace(t.rut, '.', ''), ' ', '')) AS rut_norm
  FROM public."Tenant" t
  WHERE NULLIF(btrim(t.rut), '') IS NOT NULL
    AND t.empresa_id IS NULL
  ORDER BY upper(replace(replace(t.rut, '.', ''), ' ', '')), t.created_at ASC, t.id ASC
) casa
WHERE NOT EXISTS (
  SELECT 1 FROM public."Empresa" e WHERE e.rut = casa.rut_norm
);

UPDATE public."Tenant" t
SET empresa_id = e.id
FROM public."Empresa" e
WHERE t.empresa_id IS NULL
  AND e.rut = upper(replace(replace(t.rut, '.', ''), ' ', ''));

INSERT INTO public."Empresa" (razon_social, rut, domicilio_legal, telefono, created_at)
SELECT
  t.nombre,
  'PENDIENTE-' || t.id,
  NULLIF(btrim(t.direccion), ''),
  '',
  t.created_at
FROM public."Tenant" t
WHERE t.empresa_id IS NULL;

UPDATE public."Tenant" t
SET empresa_id = e.id
FROM public."Empresa" e
WHERE t.empresa_id IS NULL
  AND e.rut = 'PENDIENTE-' || t.id;

UPDATE public."Tenant" t
SET rut = e.rut
FROM public."Empresa" e
WHERE t.empresa_id = e.id
  AND e.rut NOT LIKE 'PENDIENTE-%';

ALTER TABLE public."Tenant"
  ALTER COLUMN empresa_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Tenant_empresa_id_fkey'
  ) THEN
    ALTER TABLE public."Tenant"
      ADD CONSTRAINT "Tenant_empresa_id_fkey"
      FOREIGN KEY (empresa_id) REFERENCES public."Empresa"(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Tenant_empresa_id_idx" ON public."Tenant"(empresa_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tenant_id UUID;
  v_empresa_id UUID;
  v_nombre TEXT;
  v_nombre_local TEXT;
  v_rut_local TEXT;
  v_rut_norm TEXT;
  v_direccion TEXT;
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
  v_direccion := COALESCE(NULLIF(btrim(NEW.raw_user_meta_data->>'direccion'), ''), 'Osorno');
  v_rut_norm := upper(replace(replace(v_rut_local, '.', ''), ' ', ''));

  SELECT id INTO v_empresa_id FROM public."Empresa" WHERE rut = v_rut_norm;
  IF v_empresa_id IS NULL THEN
    INSERT INTO public."Empresa" (razon_social, rut, domicilio_legal, telefono)
    VALUES (v_nombre_local, v_rut_norm, v_direccion, '')
    RETURNING id INTO v_empresa_id;
  END IF;

  INSERT INTO public."Tenant" (nombre, rut, direccion, plan, empresa_id, estado)
  VALUES (v_nombre_local, v_rut_norm, v_direccion, v_plan, v_empresa_id, 'pendiente')
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
