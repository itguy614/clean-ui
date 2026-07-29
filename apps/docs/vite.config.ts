import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";
import { workspaceAliases, cleanUiVersionDefine } from "../../config/workspace-aliases";

export default defineConfig({
  // GitHub Pages: set base to "/<repo-name>/" via env, or "/" for local dev
  base: process.env.VITE_BASE ?? "/",
  plugins: [vue(), tailwindcss()],
  define: cleanUiVersionDefine(),
  resolve: {
    alias: workspaceAliases(),
  },
  server: {
    // Allow importing repo-root files (VERSION, CHANGELOG.md) via ?raw in dev.
    fs: { allow: [resolve(__dirname, "../..")] },
  },
});
