import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import { workspaceAliases, workspaceVersionDefines } from "../../config/workspace-aliases";

// The same source aliases and version defines as vite.config.ts: the tests mount the docs
// components, which import the library from workspace source.
export default defineConfig({
  plugins: [vue()],
  define: workspaceVersionDefines(),
  resolve: { alias: workspaceAliases() },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
  },
});
