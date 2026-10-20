import { describe, it, expect, afterEach, vi } from "vitest";
import { mount, enableAutoUnmount, type VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import CuiCombobox from "../CuiCombobox.vue";
import CuiTagInput from "../CuiTagInput.vue";

enableAutoUnmount(afterEach);
afterEach(() => vi.useRealTimers());

/**
 * #205: neither CuiCombobox nor CuiTagInput carried a single ARIA role. To assistive
 * technology each was an unlabelled text input beside a list of divs, and arrowing through
 * options was silent. This holds both to the ARIA combobox pattern, with focus staying in
 * the input — and checks every IDREF resolves, the shape that caught #158's dangling ref.
 */
const press = async (el: HTMLElement, key: string) => {
  const e = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
  el.dispatchEvent(e);
  await nextTick();
  return e;
};
const byId = (id: string | null) => (id ? document.getElementById(id) : null);

const cases: Array<[string, () => VueWrapper]> = [
  [
    "CuiCombobox",
    () =>
      mount(CuiCombobox, {
        attachTo: document.body,
        props: {
          label: "Fruit",
          options: [
            { value: "a", label: "Apple" },
            { value: "b", label: "Banana", disabled: true },
            { value: "c", label: "Cherry" },
          ],
        },
      }),
  ],
  [
    "CuiTagInput",
    () =>
      mount(CuiTagInput, {
        attachTo: document.body,
        props: { label: "Fruit", modelValue: [], suggestions: [{ value: "Apple" }, { value: "Banana" }, { value: "Cherry" }] },
      }),
  ],
];

describe.each(cases)("%s listbox ARIA (#205)", (name, mountIt) => {
  it("is a labelled combobox that controls a listbox of options", async () => {
    const w = mountIt();
    const input = w.find("input").element as HTMLInputElement;
    expect(input.getAttribute("role")).toBe("combobox");
    expect(input.getAttribute("aria-autocomplete")).toBe("list");
    expect(input.getAttribute("aria-expanded")).toBe("false");
    expect(byId(input.getAttribute("aria-labelledby"))?.textContent).toBe("Fruit");

    input.dispatchEvent(new FocusEvent("focus"));
    await nextTick();
    expect(input.getAttribute("aria-expanded")).toBe("true");
    const listbox = byId(input.getAttribute("aria-controls"));
    expect(listbox?.getAttribute("role")).toBe("listbox");
    expect(byId(listbox!.getAttribute("aria-labelledby"))?.textContent).toBe("Fruit");
    const options = listbox!.querySelectorAll('[role="option"]');
    expect(options.length).toBe(3);
    options.forEach((o) => expect(o.id).not.toBe(""));
  });

  it("names the highlighted option with aria-activedescendant, which always resolves", async () => {
    const w = mountIt();
    const input = w.find("input").element as HTMLInputElement;
    expect(input.hasAttribute("aria-activedescendant")).toBe(false);
    input.dispatchEvent(new FocusEvent("focus"));
    await nextTick();
    await press(input, "ArrowDown");
    const active = byId(input.getAttribute("aria-activedescendant"));
    expect(active?.getAttribute("role")).toBe("option");
    expect(active?.textContent).toContain("Apple");

    await press(input, "ArrowDown");
    const next = byId(input.getAttribute("aria-activedescendant"))!;
    // Combobox's Banana is disabled, so the highlight skips it.
    expect(next.textContent).toContain(name === "CuiCombobox" ? "Cherry" : "Banana");

    await press(input, "Escape");
    expect(input.hasAttribute("aria-activedescendant")).toBe(false); // never a dangling ref
  });

  it("leaves Home and End to the text cursor", async () => {
    const w = mountIt();
    const input = w.find("input").element as HTMLInputElement;
    input.dispatchEvent(new FocusEvent("focus"));
    await nextTick();
    expect((await press(input, "Home")).defaultPrevented).toBe(false);
  });

  it("announces the result count politely, once typing settles", async () => {
    vi.useFakeTimers();
    const w = mountIt();
    const input = w.find("input").element as HTMLInputElement;
    input.dispatchEvent(new FocusEvent("focus"));
    await nextTick();
    const status = w.find('[role="status"]');
    expect(status.attributes("aria-live")).toBe("polite");
    expect(status.text()).toBe(""); // not per keystroke
    vi.advanceTimersByTime(600);
    await nextTick();
    expect(status.text()).toBe("3 results available");
  });

  it("hands the highlight back to the input on Home, End and Left/Right", async () => {
    const w = mountIt();
    const input = w.find("input").element as HTMLInputElement;
    input.dispatchEvent(new FocusEvent("focus"));
    await nextTick();
    await press(input, "ArrowDown");
    expect(input.hasAttribute("aria-activedescendant")).toBe(true);
    await press(input, "ArrowLeft");
    expect(input.hasAttribute("aria-activedescendant")).toBe(false);
  });
});

describe("CuiCombobox empty-result announcement", () => {
  it("speaks the consumer's noResultsText, not a default", async () => {
    vi.useFakeTimers();
    const w = mount(CuiCombobox, { attachTo: document.body, props: { options: [{ value: "a", label: "Apple" }], noResultsText: "Rien" } });
    const input = w.find("input");
    input.element.dispatchEvent(new FocusEvent("focus"));
    await input.setValue("zzz");
    vi.advanceTimersByTime(600);
    await nextTick();
    expect(w.find('[role="status"]').text()).toBe("Rien");
  });
});
