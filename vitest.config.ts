import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react"; // ✅ AQUI
import path from "path";

export default defineConfig({
  // ✅ AQUI (plugin React)
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },

  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./client/src/vitest.setup.ts"],
    include: [
      "client/src/**/*.test.tsx",
      "client/src/**/*.test.ts",
      "server/**/*.test.ts",
      "server/**/*.spec.ts",
    ],
  },
});
