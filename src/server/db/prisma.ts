import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaConnectionString: string | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL!;

  const pool = new pg.Pool({
    connectionString,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
}

function tenantConoceDocumentos(client: PrismaClient): boolean {
  const runtime = client as PrismaClient & {
    _runtimeDataModel?: {
      models?: Record<string, { fields?: Record<string, unknown> | Array<{ name: string }> }>;
    };
  };
  const tenant = runtime._runtimeDataModel?.models?.Tenant ?? runtime._runtimeDataModel?.models?.tenant;
  if (!tenant?.fields) return true;
  if (Array.isArray(tenant.fields)) {
    return tenant.fields.some((campo) => campo.name === "resolucion_sanitaria_presentada");
  }
  return "resolucion_sanitaria_presentada" in tenant.fields;
}

function prismaEstaDesactualizado(client: PrismaClient | undefined): boolean {
  if (!client) return false;
  if (globalForPrisma.prismaConnectionString !== process.env.DATABASE_URL) return true;
  const delegates = client as PrismaClient & { ticket?: { create?: unknown }; notificacion?: { count?: unknown } };
  if (typeof delegates.ticket?.create !== "function" || typeof delegates.notificacion?.count !== "function") {
    return true;
  }
  return !tenantConoceDocumentos(client);
}

// En dev, recrear el cliente si cambió DATABASE_URL o el schema (modelos nuevos).
if (process.env.NODE_ENV !== "production" && prismaEstaDesactualizado(globalForPrisma.prisma)) {
  void globalForPrisma.prisma?.$disconnect().catch(() => {});
  globalForPrisma.prisma = undefined;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaConnectionString = process.env.DATABASE_URL;
}
