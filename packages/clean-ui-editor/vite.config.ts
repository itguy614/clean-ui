import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";

// Read (not import) package.json — importing it would put it under vue-tsc's
// rootDir-checked program; reading it here keeps that entirely out of `src`.
const pkg = JSON.parse(readFileSync(resolve(__dirname, "package.json"), "utf-8"));

// Externalize by rule, matching the policy landing in clean-ui's own build
// (docs/platform/multi-package-build-and-release.md P1): anything this
// package declares as a dependency or peer dependency must be resolved from
// the consumer's own install, never inlined. Prefix-matched so subpath
// imports are covered too.
const externalNames = [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.peerDependencies ?? {})];
function isExternal(id: string): boolean {
  return externalNames.some((name) => id === name || id.startsWith(`${name}/`));
}

export default defineConfig({
  plugins: [vue()],
  define: {
    // Replaced with a literal at build time — see src/version.ts. Never read
    // from the filesystem at runtime, so it can't drift from what's published.
    __CUI_EDITOR_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    lib: {
      // Three entries: the barrel, the render subpath (no renderer in core —
      // FR36/FR38), and the codemirror subpath (FR24a — a raw-tier plugin
      // author's single path to CodeMirror, so one instance is the default).
      // A module unreachable from the barrel is never emitted otherwise —
      // exactly the lesson recorded in clean-ui's build config for its lazy
      // icon module.
      entry: [
        resolve(__dirname, "src/index.ts"),
        resolve(__dirname, "src/render.ts"),
        resolve(__dirname, "src/codemirror.ts"),
      ],
      formats: ["es"],
    },
    rollupOptions: {
      external: isExternal,
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
