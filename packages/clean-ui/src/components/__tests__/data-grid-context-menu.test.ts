import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import CuiDataGrid from "../CuiDataGrid.vue";
import CuiContextMenu from "../CuiContextMenu.vue";
import CuiDropdownItem from "../CuiDropdownItem.vue";
import { h } from "vue";

/**
 * #208 — CuiDataGrid wrapped every row in its own CuiContextMenu, so a 500-row grid mounted
 * 500 of them. Now one menu serves the grid, and the row is worked out from the event.
 */

const columns = [
  { key: "name", label: "Name" },
  { key: "role", label: "Role" },
];

const rows = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    name: `Person ${i + 1}`,
    role: "Dev",
    // Every other row has actions; the rest get the browser's own menu.
    _actions: i % 2 === 0 ? [{ key: "edit", label: `Edit ${i + 1}` }, { key: "delete", label: "Delete" }] : [],
  }));

let wrapper: VueWrapper | undefined;

afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
  document.body.innerHTML = "";
});

function mountGrid(n: number) {
  wrapper = mount(CuiDataGrid, {
    attachTo: document.body,
    props: { columns, data: rows(n), hideToolbar: true, perPageOptions: [n] },
  });
  return wrapper;
}

const row = (id: number) => document.querySelector<HTMLElement>(`tr[data-row-id="${id}"]`)!;
const panel = () => document.querySelector<HTMLElement>(".cui-context-menu__panel");

function rightClick(el: Element) {
  const e = new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 20, clientY: 30 });
  el.dispatchEvent(e);
  return e;
}

describe("CuiDataGrid context menu (#208)", () => {
  it("mounts one CuiContextMenu for a 100-row grid", () => {
    mountGrid(100);
    expect(document.querySelectorAll("tr[data-row-id]")).toHaveLength(100);
    expect(wrapper!.findAllComponents(CuiContextMenu)).toHaveLength(1);
  });

  it("right-click on a row opens that row's actions, and choosing one emits row-action for it", async () => {
    mountGrid(10);
    const e = rightClick(row(3).querySelector("td")!);
    await nextTick();
    expect(e.defaultPrevented).toBe(true);
    expect(panel()!.textContent).toContain("Edit 3");

    panel()!.querySelector<HTMLElement>('[role="menuitem"]')!.click();
    const emitted = wrapper!.emitted("row-action")!;
    expect(emitted).toHaveLength(1);
    expect((emitted[0][0] as { action: { key: string }; row: { id: number } }).row.id).toBe(3);
  });

  it("a second right-click on another row shows that row's actions instead", async () => {
    mountGrid(10);
    rightClick(row(1));
    await nextTick();
    rightClick(row(5));
    await nextTick();
    expect(panel()!.textContent).toContain("Edit 5");
    expect(panel()!.textContent).not.toContain("Edit 1");
  });

  it("leaves a row without actions, and the header, to the browser's own menu", async () => {
    mountGrid(10);
    expect(rightClick(row(2)).defaultPrevented).toBe(false);
    expect(rightClick(document.querySelector("thead th")!).defaultPrevented).toBe(false);
    await nextTick();
    expect(panel()).toBeNull();
  });

  it("Shift+F10 from inside a row opens its menu", async () => {
    mountGrid(10);
    const target = row(7).querySelector<HTMLElement>("button")!; // the row-actions trigger
    target.focus();
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "F10", shiftKey: true, bubbles: true, cancelable: true }));
    await nextTick();
    expect(panel()!.textContent).toContain("Edit 7");
  });
});

describe("CuiContextMenu resolveTarget", () => {
  function mountList() {
    wrapper = mount(CuiContextMenu, {
      attachTo: document.body,
      props: { resolveTarget: (el: Element) => el.closest("li")?.dataset.id },
      slots: {
        default: () => h("ul", [h("li", { "data-id": "a" }, "A"), h("li", { "data-id": "b" }, "B"), h("p", "gap")]),
        menu: ({ target }: { target: unknown }) => h(CuiDropdownItem, () => `for ${String(target)}`),
      },
    });
  }

  it("opens for a spot it resolves, and hands the answer to the menu slot", async () => {
    mountList();
    const e = rightClick(document.querySelector('[data-id="b"]')!);
    await nextTick();
    expect(e.defaultPrevented).toBe(true);
    expect(panel()!.textContent).toContain("for b");
  });

  it("leaves a spot it doesn't resolve to the browser, by mouse and by keyboard", async () => {
    mountList();
    const gap = document.querySelector("p")!;
    expect(rightClick(gap).defaultPrevented).toBe(false);
    const key = new KeyboardEvent("keydown", { key: "F10", shiftKey: true, bubbles: true, cancelable: true });
    gap.dispatchEvent(key);
    expect(key.defaultPrevented).toBe(false);
    await nextTick();
    expect(panel()).toBeNull();
  });

  it("closes when another target inside the wrapper is pressed", async () => {
    mountList();
    rightClick(document.querySelector('[data-id="a"]')!);
    await nextTick();
    await new Promise((r) => setTimeout(r, 5)); // click-outside arms a task after opening
    document.querySelector('[data-id="b"]')!.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    await nextTick();
    expect(panel()!.classList.contains("cui-context-menu__panel--closing")).toBe(true);
  });
});
