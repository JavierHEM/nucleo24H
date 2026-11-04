-- Sello v2, hallazgos, declaraciones, proveedores, capacitación y mora.

ALTER TABLE "Sello" ADD COLUMN IF NOT EXISTS esquema TEXT NOT NULL DEFAULT 'v1';
ALTER TABLE "Sello" ADD COLUMN IF NOT EXISTS estado TEXT NOT NULL DEFAULT 'emitido';
ALTER TABLE "Sello" ADD COLUMN IF NOT EXISTS score_seguimiento DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Sello" ADD COLUMN IF NOT EXISTS score_visita DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Sello" ADD COLUMN IF NOT EXISTS scores_componentes JSONB;
ALTER TABLE "Sello" ADD COLUMN IF NOT EXISTS bloqueo_critico BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "Sello" ADD COLUMN IF NOT EXISTS propuesto_por TEXT;
ALTER TABLE "Sello" ADD COLUMN IF NOT EXISTS aprobado_por TEXT;
ALTER TABLE "Sello" ADD COLUMN IF NOT EXISTS aprobado_at TIMESTAMPTZ;
ALTER TABLE "Sello" ADD COLUMN IF NOT EXISTS rechazo_motivo TEXT;
CREATE INDEX IF NOT EXISTS "Sello_estado_idx" ON "Sello"(estado);

ALTER TABLE "Registro" ADD COLUMN IF NOT EXISTS evidencia_estado TEXT NOT NULL DEFAULT 'declarado_cliente';
ALTER TABLE "Registro" ADD COLUMN IF NOT EXISTS extemporaneo BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS "RegistroEdicion" (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registro_id UUID NOT NULL REFERENCES "Registro"(id) ON DELETE CASCADE,
  actor_id    TEXT NOT NULL,
  motivo      TEXT NOT NULL,
  datos_antes JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "RegistroEdicion_registro_created_idx" ON "RegistroEdicion"(registro_id, created_at);

ALTER TABLE "Documento" ADD COLUMN IF NOT EXISTS evidencia_estado TEXT NOT NULL DEFAULT 'declarado_cliente';

ALTER TABLE "Suscripcion" ADD COLUMN IF NOT EXISTS acceso_hasta TIMESTAMPTZ;
ALTER TABLE "Suscripcion" ADD COLUMN IF NOT EXISTS cancelada_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS "Proveedor" (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  razon_social         TEXT NOT NULL,
  rut                  TEXT NOT NULL,
  contacto             TEXT,
  tipo_servicio        TEXT NOT NULL,
  autorizacion_entidad TEXT,
  autorizacion_numero  TEXT,
  autorizacion_fecha   TIMESTAMPTZ,
  vigencia             TIMESTAMPTZ,
  alcance              TEXT,
  proxima_prestacion   TIMESTAMPTZ,
  documentos           TEXT[] NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "Proveedor_tenant_idx" ON "Proveedor"(tenant_id);

CREATE TABLE IF NOT EXISTS "Hallazgo" (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  visita_id             UUID REFERENCES "Visita"(id) ON DELETE SET NULL,
  proveedor_id          UUID REFERENCES "Proveedor"(id) ON DELETE SET NULL,
  gravedad              TEXT NOT NULL,
  estado                TEXT NOT NULL DEFAULT 'abierto',
  descripcion           TEXT NOT NULL,
  fundamento            TEXT,
  ubicacion             TEXT,
  observador_id         TEXT NOT NULL,
  responsable_id        TEXT,
  plazo                 TIMESTAMPTZ,
  fotos_iniciales       TEXT[] NOT NULL DEFAULT '{}',
  contencion            TEXT,
  accion_correctiva     TEXT,
  evidencia_cierre      TEXT[] NOT NULL DEFAULT '{}',
  evidencia_estado      TEXT NOT NULL DEFAULT 'declarado_cliente',
  revisor_id            TEXT,
  revision_at           TIMESTAMPTZ,
  decision              TEXT,
  motivo_decision       TEXT,
  seguimiento_at        TIMESTAMPTZ,
  seguimiento_resultado TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "Hallazgo_tenant_estado_idx" ON "Hallazgo"(tenant_id, estado);
CREATE INDEX IF NOT EXISTS "Hallazgo_tenant_gravedad_idx" ON "Hallazgo"(tenant_id, gravedad);
CREATE INDEX IF NOT EXISTS "Hallazgo_visita_idx" ON "Hallazgo"(visita_id);

CREATE TABLE IF NOT EXISTS "HallazgoEvento" (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hallazgo_id UUID NOT NULL REFERENCES "Hallazgo"(id) ON DELETE CASCADE,
  actor_id    TEXT NOT NULL,
  de_estado   TEXT,
  a_estado    TEXT NOT NULL,
  nota        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "HallazgoEvento_hallazgo_created_idx" ON "HallazgoEvento"(hallazgo_id, created_at);

CREATE TABLE IF NOT EXISTS "DeclaracionVeracidad" (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  user_id      TEXT NOT NULL,
  tipo         TEXT NOT NULL,
  version      TEXT NOT NULL,
  texto        TEXT NOT NULL,
  evento       TEXT NOT NULL,
  recurso_tipo TEXT,
  recurso_id   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "DeclaracionVeracidad_tenant_tipo_idx" ON "DeclaracionVeracidad"(tenant_id, tipo);

CREATE TABLE IF NOT EXISTS "CapacitacionContenido" (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo       TEXT NOT NULL,
  descripcion  TEXT NOT NULL,
  url_recurso  TEXT NOT NULL,
  tipo_recurso TEXT NOT NULL DEFAULT 'video',
  preguntas    JSONB NOT NULL DEFAULT '[]',
  activo       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "CapacitacionRegistro" (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contenido_id UUID NOT NULL REFERENCES "CapacitacionContenido"(id) ON DELETE CASCADE,
  tenant_id    UUID NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  user_id      TEXT NOT NULL,
  puntaje      INT NOT NULL,
  aprobado     BOOLEAN NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "CapacitacionRegistro_tenant_user_idx" ON "CapacitacionRegistro"(tenant_id, user_id);

CREATE TABLE IF NOT EXISTS "AlertaResolucion" (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  TEXT NOT NULL,
  alerta_key TEXT NOT NULL,
  actor_id   TEXT NOT NULL,
  nota       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "AlertaResolucion_tenant_key_idx" ON "AlertaResolucion"(tenant_id, alerta_key);

ALTER TABLE "Hallazgo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HallazgoEvento" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DeclaracionVeracidad" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Proveedor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CapacitacionContenido" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CapacitacionRegistro" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RegistroEdicion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AlertaResolucion" ENABLE ROW LEVEL SECURITY;
