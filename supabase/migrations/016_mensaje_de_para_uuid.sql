-- Corregir tipos de columna en Mensaje para que coincidan con User.id (uuid)
ALTER TABLE "Mensaje" ALTER COLUMN "de" TYPE uuid USING "de"::uuid;
ALTER TABLE "Mensaje" ALTER COLUMN "para" TYPE uuid USING "para"::uuid;

-- Índices y FK constraints
CREATE INDEX IF NOT EXISTS "Mensaje_de_idx" ON "Mensaje"("de");
CREATE INDEX IF NOT EXISTS "Mensaje_para_idx" ON "Mensaje"("para");

ALTER TABLE "Mensaje" ADD CONSTRAINT "Mensaje_de_fkey" FOREIGN KEY ("de") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "Mensaje" ADD CONSTRAINT "Mensaje_para_fkey" FOREIGN KEY ("para") REFERENCES "User"("id") ON DELETE CASCADE;
