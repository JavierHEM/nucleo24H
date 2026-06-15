import "dotenv/config";
import { defineConfig } from "prisma/config";

// DATABASE_URL → puerto 6543 (pgbouncer) para runtime
// DIRECT_URL   → puerto 5432 (conexión directa) para migraciones
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
