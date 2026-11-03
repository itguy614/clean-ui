import { describe, it, expect, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick, reactive } from "vue";
import CuiCombobox from "../CuiCombobox.vue";
import type { ComboboxOption } from "../CuiCombobox.vue";

const OPTIONS: ComboboxOption[] = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
];

// The dropdown teleports to document.body. Find option rows there.
function dropdownOptionTexts(): string[] {
  return [...document.body.querySelectorAll('[role="option"]')].map(
    (el) => (el as HTMLElement).textContent?.trim() ?? "",
  );
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("CuiCombobox", () => {
  it("opens the dropdown on focus and lists all options", async () => {
    const wrapper = mount(CuiCombobox, {
      props: { options: OPTIONS },
      attachTo: document.body,
    });
    await wrapper.find("input").trigger("focus");
    await nextTick();

    const texts = dropdownOptionTexts();
    expect(texts).toEqual(["Apple", "Banana", "Cherry"]);
    wrapper.unmount();
  });

  it("filters options by the typed query (case-insensitive)", async () => {
    const wrapper = mount(CuiCombobox, {
      props: { options: OPTIONS },
      attachTo: document.body,
    });
    const input = wrapper.find("input");
    await input.trigger("focus");
    await input.setValue("an"); // matches "Banana"
    await nextTick();

    expect(dropdownOptionTexts()).toEqual(["Banana"]);
    wrapper.unmount();
  });

  it("shows the no-results text when nothing matches", async () => {
    const wrapper = mount(CuiCombobox, {
      props: { options: OPTIONS, noResultsText: "Nada" },
      attachTo: document.body,
    });
    const input = wrapper.find("input");
    await input.trigger("focus");
    await input.setValue("zzz");
    await nextTick();

    expect(dropdownOptionTexts()).toEqual([]);
    expect(document.body.textContent).toContain("Nada");
    wrapper.unmount();
  });

  it("emits update:modelValue with the option value when an option is clicked (single)", async () => {
    const wrapper = mount(CuiCombobox, {
      props: { options: OPTIONS },
      attachTo: document.body,
    });
    await wrapper.find("input").trigger("focus");
    await nextTick();

    const cherry = [...document.body.querySelectorAll('[role="option"]')].find(
      (el) => el.textContent?.trim() === "Cherry",
    ) as HTMLElement;
    cherry.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await nextTick();

    const emitted = wrapper.emitted("update:modelValue");
    expect(emitted).toBeTruthy();
    expect(emitted![0]).toEqual(["cherry"]);
    wrapper.unmount();
  });

  it("displays the selected label in the input when closed", async () => {
    const wrapper = mount(CuiCombobox, {
      props: { options: OPTIONS, modelValue: "banana" },
      attachTo: document.body,
    });
    await nextTick();
    const input = wrapper.find("input").element as HTMLInputElement;
    expect(input.value).toBe("Banana");
    wrapper.unmount();
  });

  it("renders removable tags in multiple mode and removeTag emits the pruned array", async () => {
    const wrapper = mount(CuiCombobox, {
      props: { options: OPTIONS, multiple: true, modelValue: ["apple", "banana"] },
      attachTo: document.body,
    });
    await nextTick();

    // Two selected tags (CuiBadge with removable) render in the input area.
    const removeButtons = wrapper.findAll(".cui-badge button, .cui-badge [aria-label]");
    expect(removeButtons.length).toBeGreaterThanOrEqual(1);

    await removeButtons[0].trigger("click");
    const emitted = wrapper.emitted("update:modelValue");
    expect(emitted).toBeTruthy();
    // Removing the first tag (apple) leaves banana.
    expect(emitted![emitted!.length - 1]).toEqual([["banana"]]);
    wrapper.unmount();
  });

  it("does not open the dropdown when disabled", async () => {
    const wrapper = mount(CuiCombobox, {
      props: { options: OPTIONS, disabled: true },
      attachTo: document.body,
    });
    const input = wrapper.find("input");
    expect((input.element as HTMLInputElement).disabled).toBe(true);

    await input.trigger("focus");
    await nextTick();
    expect(dropdownOptionTexts()).toEqual([]);
    wrapper.unmount();
  });

  // ── Focus ring ────────────────────────────────────────────────────────────
  // The control had no focus styling at all and suppressed the input's native
  // outline, so a focused combobox showed nothing once its dropdown closed.
  // jsdom can't evaluate `:focus-within`, so these pin the two things the rule
  // depends on instead.
  describe("focus ring", () => {
    function control(wrapper: ReturnType<typeof mount>) {
      return wrapper.get(".cui-combobox__control").element as HTMLElement;
    }

    it("exposes the focus-ring custom properties from the color role", () => {
      const wrapper = mount(CuiCombobox, { props: { options: OPTIONS } });
      const style = control(wrapper).style;

      expect(style.getPropertyValue("--_combobox-focus-ring").trim()).toBe(
        "var(--cui-primary-focus-ring)",
      );
      expect(style.getPropertyValue("--_combobox-focus-border").trim()).toBe("var(--cui-primary)");
      wrapper.unmount();
    });

    it("follows the color prop", () => {
      const wrapper = mount(CuiCombobox, { props: { options: OPTIONS, color: "success" } });
      const style = control(wrapper).style;

      expect(style.getPropertyValue("--_combobox-focus-ring").trim()).toBe(
        "var(--cui-success-focus-ring)",
      );
      expect(style.getPropertyValue("--_combobox-focus-border").trim()).toBe("var(--cui-success)");
      wrapper.unmount();
    });

    it("uses the error role when error is set", () => {
      const wrapper = mount(CuiCombobox, { props: { options: OPTIONS, error: true } });
      const style = control(wrapper).style;

      expect(style.getPropertyValue("--_combobox-focus-ring").trim()).toBe("var(--cui-error-focus-ring)");
      expect(style.getPropertyValue("--_combobox-focus-border").trim()).toBe("var(--cui-error)");
      wrapper.unmount();
    });

    // The reason `border` moved out of the inline `:style` and into the scoped
    // stylesheet: an inline `border` shorthand outranks the `border-color` in
    // `:focus-within`, so re-adding one here would silently kill the focus
    // border while every other test still passed.
    it("keeps border out of the inline style so the focus rule can win", () => {
      const wrapper = mount(CuiCombobox, { props: { options: OPTIONS } });
      const style = control(wrapper).style;

      expect(style.border).toBe("");
      expect(style.borderColor).toBe("");
      wrapper.unmount();
    });

    it("marks the control disabled so the focus rule can opt out", () => {
      const wrapper = mount(CuiCombobox, { props: { options: OPTIONS, disabled: true } });

      expect(wrapper.get(".cui-combobox__control").classes()).toContain(
        "cui-combobox__control--disabled",
      );
      wrapper.unmount();
    });
  });
});

// #346 — the highlight was an index: inserting an option above it (a "Favorites" section)
// moved it onto a different option, and Enter selected that one.
describe("CuiCombobox highlight when the list changes", () => {
  const highlighted = () => {
    const id = document.querySelector("input")!.getAttribute("aria-activedescendant");
    return id ? document.getElementById(id)?.textContent?.trim() : undefined;
  };

  async function openOnBanana() {
    const w = mount(CuiCombobox, { props: { options: OPTIONS }, attachTo: document.body });
    const input = w.find("input");
    await input.trigger("focus");
    await input.trigger("keydown", { key: "ArrowDown" });
    await input.trigger("keydown", { key: "ArrowDown" });
    expect(highlighted()).toBe("Banana");
    return w;
  }

  it("stays on the same option when one is added above it", async () => {
    const w = await openOnBanana();
    await w.setProps({ options: [{ value: "fav-cherry", label: "★ Cherry" }, ...OPTIONS] });
    await nextTick();
    expect(highlighted()).toBe("Banana");
    await w.find("input").trigger("keydown", { key: "Enter" });
    expect(w.emitted("update:modelValue")?.at(-1)).toEqual(["banana"]);
  });

  it("stays on the same option when the list is changed in place", async () => {
    const options = reactive([...OPTIONS]);
    const w = mount(CuiCombobox, { props: { options }, attachTo: document.body });
    const input = w.find("input");
    await input.trigger("focus");
    await input.trigger("keydown", { key: "ArrowDown" });
    await input.trigger("keydown", { key: "ArrowDown" });
    expect(highlighted()).toBe("Banana");
    options.unshift({ value: "fav", label: "★ Favourite" });
    await nextTick();
    expect(highlighted()).toBe("Banana");
  });

  it("clears when the highlighted option leaves the list", async () => {
    const w = await openOnBanana();
    await w.setProps({ options: OPTIONS.filter((o) => o.value !== "banana") });
    await nextTick();
    expect(highlighted()).toBeUndefined();
  });

  it("clears when the option it was on is now disabled", async () => {
    const w = await openOnBanana();
    await w.setProps({ options: OPTIONS.map((o) => (o.value === "banana" ? { ...o, disabled: true } : o)) });
    await nextTick();
    expect(highlighted()).toBeUndefined();
  });
});

// A row action's keyboard route (#347).
describe("CuiCombobox option-keydown", () => {
  async function openCombobox(extra: Record<string, unknown> = {}, slots = {}) {
    const w = mount(CuiCombobox, { props: { options: OPTIONS, ...extra }, slots, attachTo: document.body });
    const input = w.find("input");
    await input.trigger("focus");
    await nextTick();
    return { w, input };
  }
  const calls = (w: ReturnType<typeof mount>) => (w.emitted("option-keydown") ?? []) as [KeyboardEvent, ComboboxOption][];

  it("is not emitted while nothing is highlighted", async () => {
    const { w, input } = await openCombobox();
    await input.trigger("keydown", { key: "a" });
    expect(calls(w)).toHaveLength(0);
    expect((w.vm as unknown as { highlightedOption: unknown }).highlightedOption).toBeNull();
  });

  it("is not emitted when the list is closed", async () => {
    const { w, input } = await openCombobox();
    await input.trigger("keydown", { key: "ArrowDown" });
    await input.trigger("keydown", { key: "Escape" });
    await input.trigger("keydown", { key: "a" });
    expect(calls(w).map(([, o]) => o.value)).toEqual(["apple"]); // the Escape, while still open
    expect((w.vm as unknown as { highlightedOption: unknown }).highlightedOption).toBeNull();
  });

  it("carries the highlighted option, following ArrowDown", async () => {
    const { w, input } = await openCombobox();
    await input.trigger("keydown", { key: "ArrowDown" }); // nothing highlighted yet: no emit
    await input.trigger("keydown", { key: "ArrowDown" }); // on Apple when pressed
    await input.trigger("keydown", { key: "x" }); // on Banana
    expect(calls(w).map(([e, o]) => [e.key, o.value])).toEqual([
      ["ArrowDown", "apple"],
      ["x", "banana"],
    ]);
  });

  it("exposes the highlighted option", async () => {
    const { w, input } = await openCombobox();
    const vm = w.vm as unknown as { highlightedOption: ComboboxOption | null };
    await input.trigger("keydown", { key: "ArrowDown" });
    await input.trigger("keydown", { key: "ArrowDown" });
    expect(vm.highlightedOption?.value).toBe("banana");
  });

  it("passes `highlighted` to the option slot, true on the highlighted row only", async () => {
    const { input } = await openCombobox(
      {},
      { option: `<template #option="{ option, highlighted }"><i :data-hl="highlighted">{{ option.label }}</i></template>` },
    );
    await input.trigger("keydown", { key: "ArrowDown" });
    await input.trigger("keydown", { key: "ArrowDown" });
    const marks = [...document.body.querySelectorAll("[data-hl]")].map((el) => el.getAttribute("data-hl"));
    expect(marks).toEqual(["false", "true", "false"]);
  });

  it("is emitted before the built-in handling, so preventDefault() stops Enter selecting", async () => {
    const { w, input } = await openCombobox();
    await input.trigger("keydown", { key: "ArrowDown" });
    await input.trigger("keydown", { key: "ArrowDown" });
    await w.setProps({ "onOption-keydown": (e: KeyboardEvent) => e.preventDefault() } as never);
    await input.trigger("keydown", { key: "Enter" });
    expect(w.emitted("update:modelValue")).toBeUndefined();
  });

  it("still selects on Enter when the consumer leaves the event alone", async () => {
    const { w, input } = await openCombobox();
    await input.trigger("keydown", { key: "ArrowDown" });
    await input.trigger("keydown", { key: "ArrowDown" });
    await input.trigger("keydown", { key: "Enter" });
    expect(w.emitted("update:modelValue")?.[0]).toEqual(["banana"]);
  });

  it("lets a consumer wire an Alt+F favorite shortcut", async () => {
    const favorites = new Set<string | number>();
    const { w, input } = await openCombobox({
      "onOption-keydown": (e: KeyboardEvent, o: ComboboxOption) => {
        if (e.altKey && e.key.toLowerCase() === "f") {
          e.preventDefault();
          if (!favorites.delete(o.value)) favorites.add(o.value);
        }
      },
    });
    await input.trigger("keydown", { key: "ArrowDown" });
    await input.trigger("keydown", { key: "ArrowDown" });
    await input.trigger("keydown", { key: "f", altKey: true });
    expect([...favorites]).toEqual(["banana"]);
    await input.trigger("keydown", { key: "ArrowDown" });
    await input.trigger("keydown", { key: "F", altKey: true });
    expect([...favorites]).toEqual(["banana", "cherry"]);
    expect(w.emitted("update:modelValue")).toBeUndefined();
  });
});
