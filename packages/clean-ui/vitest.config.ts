import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
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
  },
});
