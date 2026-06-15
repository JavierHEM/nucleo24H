-- Migración 012: User.tenant_id es columna legacy (pre multi-local) que ya
-- no existe en prisma/schema.prisma. Su NOT NULL hacía fallar handle_new_user
-- (silenciosamente, por el EXCEPTION handler) y cualquier insert vía Prisma.
-- Aplicada el 12/06/2026 vía MCP. Pendiente: eliminar la columna cuando se
-- confirme que ninguna policy/función la usa.

ALTER TABLE "User" ALTER COLUMN "tenant_id" DROP NOT NULL;
