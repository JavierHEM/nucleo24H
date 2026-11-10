-- Resolución sanitaria y patente comercial son por local (casa matriz o sucursal).

ALTER TABLE public."Tenant"
  ADD COLUMN IF NOT EXISTS resolucion_sanitaria_presentada boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS patente_comercial_al_dia boolean NOT NULL DEFAULT false;
