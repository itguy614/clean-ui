import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";

// Read (not import) package.json — importing it would put it under vue-tsc's
// rootDir-checked program; reading it here keeps that entirely out of `src`.
const pkg = JSON.parse(readFileSync(resolve(__dirname, "package.json"), "utf-8"));

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  define: {
    // Replaced with a literal at build time — see src/version.ts. Never read
    // from the filesystem at runtime, so it can't drift from what's published.
    __CUI_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    lib: {
      // Two entries: the barrel, plus the opt-in lazy icon resolver. The latter
      // is unreachable from the barrel by design (importing it would drag the
      // whole icon package into every consumer bundle), so it needs its own
      // entry or Rollup never emits it for the "./icons/lazy" export.
      entry: [resolve(__dirname, "src/index.ts"), resolve(__dirname, "src/icons/lazy.ts")],
      formats: ["es"],
    },
    rollupOptions: {
      external: ["vue", "@floating-ui/vue", "@floating-ui/dom", "@phosphor-icons/vue"],
      output: {
        preserveModules: true,
        preserveModulesRoot: resolve(__dirname, "src"),
        entryFileNames: "[name].js",
        globals: {
          vue: "Vue",
        },
      },
    },
  },
});
