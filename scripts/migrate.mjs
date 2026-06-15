import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL no definida");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SQL_007 = `
-- 1. Campos de cierre en NoConformidad
ALTER TABLE "NoConformidad"
  ADD COLUMN IF NOT EXISTS "evidencia_cierre" TEXT,
  ADD COLUMN IF NOT EXISTS "cerrada_at" TIMESTAMPTZ;

-- 2. Módulo Tareas
CREATE TABLE IF NOT EXISTS "Tarea" (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  titulo       TEXT NOT NULL,
  descripcion  TEXT,
  frecuencia   TEXT NOT NULL DEFAULT 'diaria',
  activa       BOOLEAN NOT NULL DEFAULT TRUE,
  orden        INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "TareaCompletacion" (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarea_id    UUID NOT NULL REFERENCES "Tarea"(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  fecha       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  observacion TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_tarea_tenant ON "Tarea"(tenant_id, activa);
CREATE INDEX IF NOT EXISTS idx_tareacomp_tarea ON "TareaCompletacion"(tarea_id, fecha);
CREATE INDEX IF NOT EXISTS idx_tareacomp_user ON "TareaCompletacion"(user_id);

-- RLS
ALTER TABLE "Tarea" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TareaCompletacion" ENABLE ROW LEVEL SECURITY;

-- Policies: Tarea
DO $$ BEGIN
  CREATE POLICY "tenant_members_can_read_tareas"
    ON "Tarea" FOR SELECT
    USING (
      tenant_id IN (
        SELECT tenant_id FROM "UserTenant" WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "admin_can_insert_tareas"
    ON "Tarea" FOR INSERT
    WITH CHECK (
      tenant_id IN (
        SELECT tenant_id FROM "UserTenant" WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "admin_can_update_tareas"
    ON "Tarea" FOR UPDATE
    USING (
      tenant_id IN (
        SELECT tenant_id FROM "UserTenant" WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policies: TareaCompletacion
DO $$ BEGIN
  CREATE POLICY "user_can_read_own_completaciones"
    ON "TareaCompletacion" FOR SELECT
    USING (
      user_id = auth.uid() OR
      tarea_id IN (
        SELECT t.id FROM "Tarea" t
        INNER JOIN "UserTenant" ut ON ut.tenant_id = t.tenant_id
        WHERE ut.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "user_can_insert_completaciones"
    ON "TareaCompletacion" FOR INSERT
    WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "user_can_delete_own_completaciones"
    ON "TareaCompletacion" FOR DELETE
    USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
`;

async function run() {
  console.log("🔄 Aplicando migración 007...");
  try {
    await prisma.$executeRawUnsafe(SQL_007);
    console.log("✅ Migración 007 aplicada correctamente");

    // Verificar tablas creadas
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema='public' 
        AND table_name IN ('Tarea', 'TareaCompletacion', 'NoConformidad')
      ORDER BY table_name
    `;
    console.log("📋 Tablas verificadas:", tables);
  } catch (err) {
    console.error("❌ Error en migración:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
