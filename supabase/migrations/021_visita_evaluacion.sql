ALTER TABLE "Visita" ADD COLUMN IF NOT EXISTS evaluacion jsonb;
ALTER TABLE "NoConformidad" ADD COLUMN IF NOT EXISTS area text;
