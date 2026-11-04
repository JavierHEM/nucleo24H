-- Pago mensual (Checkout Pro) y débito automático (preapproval Mercado Pago) coexisten.
ALTER TABLE "Suscripcion" ADD COLUMN IF NOT EXISTS "modo_cobro" TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE "Suscripcion" ADD COLUMN IF NOT EXISTS "mp_preapproval_id" TEXT;
ALTER TABLE "Suscripcion" ADD COLUMN IF NOT EXISTS "mp_preapproval_status" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Suscripcion_mp_preapproval_id_key"
  ON "Suscripcion" ("mp_preapproval_id");
