import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "CleanUI",
      formats: ["es", "umd"],
      fileName: "clean-ui",
    },
    rollupOptions: {
      external: ["vue", "@floating-ui/vue", "@floating-ui/dom", "@phosphor-icons/vue"],
      output: {
        globals: {
          vue: "Vue",
          "@floating-ui/vue": "FloatingUIVue",
          "@floating-ui/dom": "FloatingUIDom",
          "@phosphor-icons/vue": "PhosphorIconsVue",
        },
      },
    },
  },
});
