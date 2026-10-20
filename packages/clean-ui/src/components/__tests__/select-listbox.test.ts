import { describe, it, expect, afterEach } from "vitest";
import { mount, enableAutoUnmount } from "@vue/test-utils";
import { nextTick } from "vue";
import CuiSelect from "../CuiSelect.vue";

enableAutoUnmount(afterEach);

// #216: CuiSelect onto useListbox (select-only) and the shared listbox panel.
const options = [
  { value: "apple", label: "Apple", group: "Fruit" },
  { value: "carrot", label: "Carrot", group: "Veg" },
  { value: "banana", label: "Banana", group: "Fruit" },
  { value: "beet", label: "Beet", group: "Veg", disabled: true },
  { value: "none", label: "None" },
];

const press = async (el: Element, key: string) => {
  el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
  await nextTick();
};
const activeText = (trigger: Element) => document.getElementById(trigger.getAttribute("aria-activedescendant") ?? "")?.textContent?.trim();

function mountSelect(props: Record<string, unknown> = {}) {
  const w = mount(CuiSelect, { attachTo: document.body, props: { options, ...props } });
  return { w, trigger: w.find(".cui-select__trigger").element };
}

describe("CuiSelect listbox (#216)", () => {
  it("names the highlighted option on the trigger with aria-activedescendant", async () => {
    const { trigger } = mountSelect();
    await press(trigger, "ArrowDown"); // opens
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(document.getElementById(trigger.getAttribute("aria-controls")!)?.getAttribute("role")).toBe("listbox");
    await press(trigger, "ArrowDown");
    expect(activeText(trigger)).toBe("None"); // the ungrouped section is shown first
  });

  it("walks the options in the order they are shown, groups included, skipping disabled ones", async () => {
    const { trigger } = mountSelect();
    await press(trigger, "ArrowDown");
    const seen: Array<string | undefined> = [];
    for (let i = 0; i < 5; i++) {
      await press(trigger, "ArrowDown");
      seen.push(activeText(trigger));
    }
    // None, then Fruit (Apple, Banana), then Veg (Carrot; Beet is disabled), then stays.
    expect(seen).toEqual(["None", "Apple", "Banana", "Carrot", "Carrot"]);
  });

  it("Home and End reach the ends; a letter type-aheads", async () => {
    const { trigger } = mountSelect();
    await press(trigger, "ArrowDown");
    await press(trigger, "End");
    expect(activeText(trigger)).toBe("Carrot"); // Beet, last, is disabled
    await press(trigger, "Home");
    expect(activeText(trigger)).toBe("None");
    await press(trigger, "b");
    expect(activeText(trigger)).toBe("Banana");
  });

  it("groups are role=group, named by their headers", async () => {
    const { trigger } = mountSelect();
    await press(trigger, "ArrowDown");
    const groups = [...document.querySelectorAll('[role="listbox"] [role="group"]')];
    expect(groups.map((g) => document.getElementById(g.getAttribute("aria-labelledby")!)?.textContent?.trim())).toEqual(["Fruit", "Veg"]);
  });

  it("Enter selects the highlighted option; Escape closes", async () => {
    const { w, trigger } = mountSelect();
    await press(trigger, "ArrowDown");
    await press(trigger, "ArrowDown");
    await press(trigger, "ArrowDown"); // Apple
    await press(trigger, "Enter");
    expect(w.emitted("update:modelValue")?.at(-1)).toEqual(["apple"]);
    expect(trigger.getAttribute("aria-expanded")).toBe("false"); // single select closes
    await press(trigger, "ArrowDown"); // reopens; no v-model bound here, so no selection to start on
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    await press(trigger, "Escape");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("opening starts the highlight on the current selection", async () => {
    const { trigger } = mountSelect({ modelValue: "banana" });
    await press(trigger, "ArrowDown");
    expect(activeText(trigger)).toBe("Banana");
  });
});
