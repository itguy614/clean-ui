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
    __CUI_EDITOR_VERSION__: JSON.stringify(pkg.version),
  },
  test: {
    // Three projects, all inheriting the plugins/define above (extends: true):
    // "jsdom" is the main component/composable suite; "ssr" proves
    // server-rendering properties jsdom can't — it always provides a DOM, so
    // it can't fail a component that wrongly touches one during setup();
    // "browser" covers the cascade and laid-out geometry, neither of which
    // jsdom models (#145). It mirrors clean-ui's own browser project.
    projects: [
      {
        extends: true,
        test: {
          name: "jsdom",
          environment: "jsdom",
          setupFiles: ["./src/test-setup.ts"],
          include: ["src/**/*.test.ts"],
          exclude: ["**/node_modules/**", "**/dist/**", "src/__tests__/ssr/**", "src/__tests__/browser/**"],
          testTimeout: 20_000,
          hookTimeout: 20_000,
        },
      },
      {
        extends: true,
        test: {
          name: "ssr",
          environment: "node",
          setupFiles: ["./src/test-setup-ssr.ts"],
          include: ["src/__tests__/ssr/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "browser",
          include: ["src/__tests__/browser/**/*.test.ts"],
          setupFiles: ["./src/__tests__/browser/setup.ts"],
          browser: {
            enabled: true,
            provider: "playwright",
            headless: true,
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
