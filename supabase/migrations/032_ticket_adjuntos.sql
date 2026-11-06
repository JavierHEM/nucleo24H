-- Evidencia de peticiones: archivos del caso y de cada respuesta.
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "adjuntos" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "Mensaje" ADD COLUMN IF NOT EXISTS "adjuntos" TEXT[] NOT NULL DEFAULT '{}';

UPDATE "Mensaje"
SET "adjuntos" = ARRAY["adjunto_url"]
WHERE "adjunto_url" IS NOT NULL
  AND "adjunto_url" <> ''
  AND (cardinality("adjuntos") = 0);
