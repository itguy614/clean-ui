import { describe, it, expect, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import CuiCombobox from "../CuiCombobox.vue";
import type { ComboboxOption } from "../CuiCombobox.vue";

const OPTIONS: ComboboxOption[] = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
];

// The dropdown teleports to document.body. Find option rows there.
function dropdownOptionTexts(): string[] {
  return [...document.body.querySelectorAll("[data-index]")].map(
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

    const cherry = [...document.body.querySelectorAll("[data-index]")].find(
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

      expect(style.getPropertyValue("--_cb-focus-ring").trim()).toBe(
        "var(--cui-primary-focus-ring)",
      );
      expect(style.getPropertyValue("--_cb-focus-border").trim()).toBe("var(--cui-primary)");
      wrapper.unmount();
    });

    it("follows the color prop", () => {
      const wrapper = mount(CuiCombobox, { props: { options: OPTIONS, color: "success" } });
      const style = control(wrapper).style;

      expect(style.getPropertyValue("--_cb-focus-ring").trim()).toBe(
        "var(--cui-success-focus-ring)",
      );
      expect(style.getPropertyValue("--_cb-focus-border").trim()).toBe("var(--cui-success)");
      wrapper.unmount();
    });

    it("uses the error role when error is set", () => {
      const wrapper = mount(CuiCombobox, { props: { options: OPTIONS, error: true } });
      const style = control(wrapper).style;

      expect(style.getPropertyValue("--_cb-focus-ring").trim()).toBe("var(--cui-error-focus-ring)");
      expect(style.getPropertyValue("--_cb-focus-border").trim()).toBe("var(--cui-error)");
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
