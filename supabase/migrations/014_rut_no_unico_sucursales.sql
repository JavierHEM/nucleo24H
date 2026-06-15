-- Migración 014: el RUT es de la empresa, no del local.
-- Una empresa con varios locales (casa central + sucursales) comparte RUT,
-- por lo que el unique constraint sobra. Se mantiene índice para búsquedas.
-- Aplicada el 12/06/2026 vía MCP.

ALTER TABLE "Tenant" DROP CONSTRAINT IF EXISTS "Tenant_rut_key";
CREATE INDEX IF NOT EXISTS idx_tenant_rut ON "Tenant"(rut);
