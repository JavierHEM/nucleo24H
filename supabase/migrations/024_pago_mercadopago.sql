ALTER TABLE "Pago" ADD COLUMN IF NOT EXISTS "mp_payment_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Pago_mp_payment_id_key" ON "Pago" ("mp_payment_id");
