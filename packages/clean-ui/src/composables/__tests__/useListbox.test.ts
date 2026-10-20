import { describe, it, expect, vi } from "vitest";
import { ref } from "vue";
import { useListbox, type UseListboxOptions } from "../useListbox";

const key = (k: string, mods: Partial<KeyboardEventInit> = {}) => new KeyboardEvent("keydown", { key: k, cancelable: true, ...mods });
const labels = ["Apple", "Banana", "Cherry", "Date"];

function setup(over: Partial<UseListboxOptions> = {}) {
  const activeIndex = ref(-1);
  const open = ref(true);
  const select = vi.fn();
  const lb = useListbox({
    id: "x",
    mode: "select-only",
    count: () => labels.length,
    label: (i) => labels[i],
    activeIndex,
    isOpen: () => open.value,
    open: () => (open.value = true),
    select,
    close: () => (open.value = false),
    hasLabel: () => true,
    ...over,
  });
  return { lb, activeIndex, open, select };
}

// The select-only half is CuiSelect's, in #216; it is covered here so it ships tested.
describe("useListbox select-only", () => {
  it("Home and End reach the first and last option", () => {
    const { lb, activeIndex } = setup();
    activeIndex.value = 1;
    expect(lb.onKeydown(key("End"))).toBe(true);
    expect(activeIndex.value).toBe(3);
    lb.onKeydown(key("Home"));
    expect(activeIndex.value).toBe(0);
  });

  it("type-aheads to an option, opening a closed list", () => {
    const { lb, activeIndex, open } = setup();
    open.value = false;
    expect(lb.onKeydown(key("c"))).toBe(true);
    expect(open.value).toBe(true);
    expect(activeIndex.value).toBe(2);
  });

  it("Space and Enter select the highlighted option; Escape closes", () => {
    const { lb, activeIndex, open, select } = setup();
    activeIndex.value = 1;
    lb.onKeydown(key(" "));
    lb.onKeydown(key("Enter"));
    expect(select).toHaveBeenCalledTimes(2);
    expect(select).toHaveBeenCalledWith(1);
    const esc = key("Escape");
    expect(lb.onKeydown(esc)).toBe(true);
    expect(esc.defaultPrevented).toBe(true);
    expect(open.value).toBe(false);
  });

  it("Alt+ArrowDown opens without moving the highlight", () => {
    const { lb, activeIndex, open } = setup();
    open.value = false;
    lb.onKeydown(key("ArrowDown", { altKey: true }));
    expect(open.value).toBe(true);
    expect(activeIndex.value).toBe(-1);
  });

  it("names the controlled listbox and active option only while open", () => {
    const { lb, activeIndex, open } = setup();
    activeIndex.value = 2;
    expect(lb.inputAttrs.value).toMatchObject({ role: "combobox", "aria-expanded": "true", "aria-controls": "x-listbox", "aria-activedescendant": "x-option-2", "aria-labelledby": "x-label" });
    expect(lb.inputAttrs.value["aria-autocomplete"]).toBeUndefined();
    open.value = false;
    expect(lb.inputAttrs.value).toMatchObject({ "aria-expanded": "false", "aria-controls": undefined, "aria-activedescendant": undefined });
  });
});
