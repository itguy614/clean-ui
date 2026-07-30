import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";
import { workspaceAliases, workspaceVersionDefines } from "../../config/workspace-aliases";

export default defineConfig({
  // GitHub Pages composed artifact: "/clean-ui/editor/" in production (see
  // config/docs-sites.mjs), "/" for local dev.
  base: process.env.VITE_BASE ?? "/",
  plugins: [vue(), tailwindcss()],
  define: workspaceVersionDefines(),
  resolve: {
    alias: workspaceAliases(),
  },
  server: {
    // Allow importing repo-root files (VERSION) via ?raw in dev.
    fs: { allow: [resolve(__dirname, "../..")] },
  },
});
