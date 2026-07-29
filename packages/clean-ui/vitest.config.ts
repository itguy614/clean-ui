import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Mirrors vite.config.ts's `define` — tests import src/version.ts too, and
// vitest transforms source through its own Vite instance (this config), not
// the library's build config.
const pkg = JSON.parse(readFileSync(resolve(__dirname, "package.json"), "utf-8"));

export default defineConfig({
  plugins: [vue()],
  define: {
    __CUI_VERSION__: JSON.stringify(pkg.version),
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    // The first mount of a CuiIcon in a worker pays for importing the whole
    // @phosphor-icons/vue barrel (see #42), which can take several seconds under
    // parallel load. Vitest's 5s default left the overlay suites — whose first
    // test mounts an icon — flaking whenever another suite competed for CPU.
    // Raise the ceiling rather than thin out coverage; real failures are
    // assertions, not timeouts.
    testTimeout: 20_000,
    hookTimeout: 20_000,
    // Type-level tests (messages.test-d.ts) — the augmentation seam is a
    // type-only guarantee; no runtime test could catch a regression here.
    typecheck: {
      enabled: true,
      checker: "vue-tsc",
      tsconfig: "./tsconfig.typecheck.json",
    },
  },
});
