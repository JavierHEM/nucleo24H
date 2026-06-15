-- Índices en Mensaje para mejorar rendimiento de consultas por de/para
CREATE INDEX IF NOT EXISTS "Mensaje_de_idx" ON "Mensaje"("de");
CREATE INDEX IF NOT EXISTS "Mensaje_para_idx" ON "Mensaje"("para");
