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
