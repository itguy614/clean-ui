import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

export default defineConfig({
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
