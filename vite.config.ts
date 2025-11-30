import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  // =========================
  // RESOLUÇÃO DE ALIASES
  // =========================
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },

  // =========================
  // CONFIGURAÇÃO DO VITEST
  // =========================
  test: {
    /**
     * Permite usar:
     * describe, it, expect, beforeEach, vi
     * sem precisar importar nada
     */
    globals: true,

    /**
     * Ambiente de testes para React
     */
    environment: "jsdom",

    /**
     * Arquivo de setup global (jest-dom)
     */
    setupFiles: ["./client/src/vitest.setup.ts"],

    /**
     * Onde o Vitest deve procurar testes
     */
    include: [
      // Front-end (React)
      "client/src/**/*.test.tsx",
      "client/src/**/*.test.ts",

      // Back-end (se existir)
      "server/**/*.test.ts",
      "server/**/*.spec.ts",
    ],

    /**
     * Arquivos/pastas ignorados
     */
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.git/**",
    ],
  },
});
