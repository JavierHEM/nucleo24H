import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "src/server/sello-engine/**",
        "src/lib/payments/**",
        "src/lib/utils.ts",
      ],
      exclude: [
        "src/**/__tests__/**",
        "src/**/*.test.ts",
        // Excluir archivos de I/O puro (Prisma/fetch) que no son testeables sin mocks de BD
        "src/server/sello-engine/emitirService.ts",
        "src/server/sello-engine/recolectar.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
