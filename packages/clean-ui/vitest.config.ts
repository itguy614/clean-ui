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
    // Three projects, all inheriting the plugins/define above (extends: true):
    // "jsdom" is the existing component/composable suite; "ssr" proves
    // server-rendering properties jsdom can't (it always provides a DOM, so it
    // can't fail a component that wrongly touches one during setup()); "browser"
    // covers layout/selection/input-method-dependent behaviour jsdom's no-op
    // layout engine can't verify either (getComputedStyle/scrollHeight are
    // always zero there).
    projects: [
      {
        extends: true,
        test: {
          name: "jsdom",
          environment: "jsdom",
          setupFiles: ["./src/test-setup.ts"],
          include: ["src/**/*.test.ts"],
          exclude: [
            "**/node_modules/**",
            "**/dist/**",
            "src/__tests__/ssr/**",
            "src/__tests__/browser/**",
          ],
          // The first mount of a CuiIcon in a worker pays for importing the whole
          // @phosphor-icons/vue barrel (see #42), which can take several seconds under
          // parallel load. Vitest's 5s default left the overlay suites — whose first
          // test mounts an icon — flaking whenever another suite competed for CPU.
          // Raise the ceiling rather than thin out coverage; real failures are
          // assertions, not timeouts.
          testTimeout: 20_000,
          hookTimeout: 20_000,
        },
      },
      {
        extends: true,
        test: {
          name: "ssr",
          environment: "node",
          include: ["src/__tests__/ssr/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "browser",
          include: ["src/__tests__/browser/**/*.test.ts"],
          browser: {
            enabled: true,
            provider: "playwright",
            headless: true,
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
    // Type-level tests (messages.test-d.ts) — the augmentation seam is a
    // type-only guarantee; no runtime test could catch a regression here.
    typecheck: {
      enabled: true,
      checker: "vue-tsc",
      tsconfig: "./tsconfig.typecheck.json",
    },
  },
});
