import { describe, it, expect } from "vitest";
import { defineComponent, h, ref } from "vue";
import { renderToString } from "@vue/server-renderer";
import { useColorScheme } from "../../composables/useColorScheme";

// This project runs under Vitest's "node" environment (see vitest.config.ts) —
// no jsdom, no `document`/`window` at all. jsdom always provides a DOM, so it
// cannot prove a component or composable never touches one during setup; only
// a real server-render, in an environment with no DOM to fall back on, can.
describe("server rendering (node environment)", () => {
  it("fails a component that touches the DOM outside a lifecycle hook", async () => {
    const BadComponent = defineComponent({
      setup() {
        // Deliberately wrong: DOM access during setup(), not inside onMounted.
        // Harmless under jsdom; there is no `document` here at all.
        document.createElement("div");
        return () => h("div");
      },
    });

    await expect(renderToString(h(BadComponent))).rejects.toThrow();
  });

  it("renders useColorScheme's consumer without DOM access", async () => {
    const Consumer = defineComponent({
      setup() {
        const elRef = ref<HTMLElement | null>(null);
        const { isDark } = useColorScheme(elRef);
        return () => h("div", String(isDark.value));
      },
    });

    // onMounted never runs during server rendering, so useColorScheme never
    // touches `document` or `MutationObserver` — isDark stays at its default.
    await expect(renderToString(h(Consumer))).resolves.toContain("false");
  });
});
