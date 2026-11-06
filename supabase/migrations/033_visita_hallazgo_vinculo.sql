-- Vincula visita ↔ hallazgo en ambos sentidos:
-- Visita.hallazgo_origen_id = hallazgo que originó la visita (local reportó, staff agenda).
-- Hallazgo.visita_id ya existía: hallazgo encontrado o verificado en esa visita.
ALTER TABLE "Visita" ADD COLUMN IF NOT EXISTS "motivo" TEXT NOT NULL DEFAULT 'rutina';
ALTER TABLE "Visita" ADD COLUMN IF NOT EXISTS "hallazgo_origen_id" UUID;

CREATE INDEX IF NOT EXISTS "Visita_hallazgo_origen_id_idx" ON "Visita"("hallazgo_origen_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Visita_hallazgo_origen_id_fkey'
  ) THEN
    ALTER TABLE "Visita"
      ADD CONSTRAINT "Visita_hallazgo_origen_id_fkey"
      FOREIGN KEY ("hallazgo_origen_id") REFERENCES "Hallazgo"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
