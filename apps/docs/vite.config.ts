import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

export default defineConfig({
  // GitHub Pages: set base to "/<repo-name>/" via env, or "/" for local dev
  base: process.env.VITE_BASE ?? "/",
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      "@itguy614/clean-ui": resolve(
        __dirname,
        "../../packages/clean-ui/src/index.ts",
      ),
    },
  },
});
