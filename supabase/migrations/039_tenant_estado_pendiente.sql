-- El local nace pendiente de pago. El check viejo solo aceptaba activo/suspendido/baja.

ALTER TABLE public."Tenant"
  DROP CONSTRAINT IF EXISTS "Tenant_estado_check";

ALTER TABLE public."Tenant"
  ADD CONSTRAINT "Tenant_estado_check"
  CHECK (estado = ANY (ARRAY['pendiente'::text, 'activo'::text, 'suspendido'::text, 'baja'::text]));

ALTER TABLE public."Tenant"
  ALTER COLUMN estado SET DEFAULT 'pendiente';
