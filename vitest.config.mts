import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  // postcss.config.mjs написан в формате Next.js, Vite его не читает; в тестах PostCSS не нужен
  css: { postcss: {} },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
  },
});
