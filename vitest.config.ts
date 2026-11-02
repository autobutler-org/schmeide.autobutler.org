/// <reference types="vitest/config" />
import { fileURLToPath, URL } from "node:url";

import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

// Plain-Vite config used only by Vitest, for mounting presentational
// components without spinning up the full Nuxt runtime. Nuxt's own build
// uses nuxt.config.ts.
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "~": fileURLToPath(new URL(".", import.meta.url)),
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    include: ["**/__tests__/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".nuxt", ".output"],
  },
});
