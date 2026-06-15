-- Migración 008: Suscripciones y Pagos (Flow.cl)
-- Aplicar en: supabase.com → SQL Editor (o vía MCP)

-- 1. Suscripción — una por tenant
CREATE TABLE IF NOT EXISTS "Suscripcion" (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL UNIQUE REFERENCES "Tenant"(id) ON DELETE CASCADE,
  plan       TEXT NOT NULL,
  monto_clp  INTEGER NOT NULL,
  estado     TEXT NOT NULL DEFAULT 'activa',
  dia_cobro  INTEGER NOT NULL DEFAULT 5,
  desde      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hasta      TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Pagos — historial por tenant y período
CREATE TABLE IF NOT EXISTS "Pago" (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  suscripcion_id UUID REFERENCES "Suscripcion"(id) ON DELETE SET NULL,
  periodo        TEXT NOT NULL,
  monto_clp      INTEGER NOT NULL,
  metodo         TEXT NOT NULL DEFAULT 'flow',
  estado         TEXT NOT NULL DEFAULT 'pendiente',
  flow_token     TEXT UNIQUE,
  flow_order     INTEGER,
  pagado_at      TIMESTAMPTZ,
  registrado_por UUID,
  observacion    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pago_tenant_periodo ON "Pago"(tenant_id, periodo);
CREATE INDEX IF NOT EXISTS idx_pago_estado ON "Pago"(estado);

-- RLS
ALTER TABLE "Suscripcion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Pago" ENABLE ROW LEVEL SECURITY;

-- Lectura: miembros del tenant. Escritura: solo backend (service role / Prisma).
DO $$ BEGIN
  CREATE POLICY "tenant_members_can_read_suscripcion"
    ON "Suscripcion" FOR SELECT
    USING (
      tenant_id IN (
        SELECT tenant_id FROM "UserTenant" WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "tenant_members_can_read_pagos"
    ON "Pago" FOR SELECT
    USING (
      tenant_id IN (
        SELECT tenant_id FROM "UserTenant" WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Trigger updated_at para Suscripcion
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_suscripcion_updated_at
    BEFORE UPDATE ON "Suscripcion"
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
