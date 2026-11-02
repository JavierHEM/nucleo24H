-- Peticiones (tickets) del local hacia Núcleo + notificaciones in-app.
CREATE TABLE IF NOT EXISTS "Ticket" (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  creado_por  UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  asignado_a  UUID REFERENCES "User"(id) ON DELETE SET NULL,
  asunto      TEXT NOT NULL,
  categoria   TEXT NOT NULL DEFAULT 'consulta',
  estado      TEXT NOT NULL DEFAULT 'abierta',
  prioridad   TEXT NOT NULL DEFAULT 'normal',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resuelto_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS "Ticket_tenant_estado_updated_idx" ON "Ticket"(tenant_id, estado, updated_at);
CREATE INDEX IF NOT EXISTS "Ticket_asignado_estado_idx" ON "Ticket"(asignado_a, estado);
CREATE INDEX IF NOT EXISTS "Ticket_creado_por_idx" ON "Ticket"(creado_por);

ALTER TABLE "Mensaje" ADD COLUMN IF NOT EXISTS ticket_id UUID REFERENCES "Ticket"(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS "Mensaje_ticket_created_idx" ON "Mensaje"(ticket_id, created_at);

CREATE TABLE IF NOT EXISTS "Notificacion" (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  tenant_id  UUID REFERENCES "Tenant"(id) ON DELETE CASCADE,
  ticket_id  UUID REFERENCES "Ticket"(id) ON DELETE CASCADE,
  tipo       TEXT NOT NULL,
  titulo     TEXT NOT NULL,
  cuerpo     TEXT NOT NULL,
  href       TEXT NOT NULL,
  leida      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "Notificacion_user_leida_created_idx" ON "Notificacion"(user_id, leida, created_at);
CREATE INDEX IF NOT EXISTS "Notificacion_ticket_idx" ON "Notificacion"(ticket_id);

ALTER TABLE "Ticket" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notificacion" ENABLE ROW LEVEL SECURITY;

-- El cliente solo lee sus propias notificaciones (campana). Escritura: Prisma.
CREATE POLICY "notificacion_propia_select" ON "Notificacion"
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
