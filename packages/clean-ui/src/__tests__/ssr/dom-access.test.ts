import { describe, it, expect } from "vitest";
import { defineComponent, h, ref } from "vue";
import { renderToString } from "@vue/server-renderer";
import { useColorScheme } from "../../composables/useColorScheme";
import CuiSelect from "../../components/CuiSelect.vue";
import CuiCombobox from "../../components/CuiCombobox.vue";
import CuiTagInput from "../../components/CuiTagInput.vue";
import CuiDropdown from "../../components/CuiDropdown.vue";
import CuiDropdownTrigger from "../../components/CuiDropdownTrigger.vue";
import CuiDropdownMenu from "../../components/CuiDropdownMenu.vue";
import CuiContextMenu from "../../components/CuiContextMenu.vue";
import CuiPopover from "../../components/CuiPopover.vue";
import CuiResizablePanels from "../../components/CuiResizablePanels.vue";

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

// #203: the floating components register global listeners in setup. Passing `window` as
// an argument would throw here before any guard could run, so useEventListener names its
// target instead; this renders every adopter with no DOM to fall back on.

describe("floating components server-render", () => {
  const options = [{ value: "a", label: "A" }];
  it.each([
    ["CuiSelect", () => h(CuiSelect, { options })],
    ["CuiCombobox", () => h(CuiCombobox, { options })],
    ["CuiTagInput", () => h(CuiTagInput, { modelValue: [] })],
    ["CuiDropdown", () => h(CuiDropdown, null, () => [h(CuiDropdownTrigger, null, () => h("button", "Open")), h(CuiDropdownMenu)])],
    ["CuiContextMenu", () => h(CuiContextMenu, null, () => h("div", "Area"))],
    ["CuiPopover", () => h(CuiPopover, null, () => h("button", "Open"))],
    ["CuiResizablePanels", () => h(CuiResizablePanels)],
  ])("%s", async (_name, vnode) => {
    await expect(renderToString(vnode())).resolves.toContain("cui-");
  });
});
