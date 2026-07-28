import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

export default defineConfig({
  // GitHub Pages: set base to "/<repo-name>/" via env, or "/" for local dev
  base: process.env.VITE_BASE ?? "/",
  plugins: [vue(), tailwindcss()],
  resolve: {
    // Array form, longest find first: an object alias prefix-matches, so the bare
    // package key would also swallow the "/icons/lazy" subpath.
    alias: [
      {
        find: "@itguy614/clean-ui/icons/lazy",
        replacement: resolve(__dirname, "../../packages/clean-ui/src/icons/lazy.ts"),
      },
      {
        find: /^@itguy614\/clean-ui$/,
        replacement: resolve(__dirname, "../../packages/clean-ui/src/index.ts"),
      },
    ],
  },
  server: {
    // Allow importing repo-root files (VERSION, CHANGELOG.md) via ?raw in dev.
    fs: { allow: [resolve(__dirname, "../..")] },
  },
});
