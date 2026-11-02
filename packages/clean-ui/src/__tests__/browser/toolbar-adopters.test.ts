import { describe, it, expect, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { userEvent } from "@vitest/browser/context";
import { nextTick } from "vue";
import CuiDataGrid from "../../components/CuiDataGrid.vue";
import CuiTransferList from "../../components/CuiTransferList.vue";
import { frames, mountHosts } from "../../../../../config/test/browser-helpers";

/**
 * #421 — the data grid's bulk-action bar and the transfer list's move buttons are CuiToolbars:
 * each row is one stop in the Tab order, with the arrow keys moving inside it.
 *
 * Real browser: the Tab order is the browser's own, from real key input, which jsdom does
 * not implement.
 */

/** A button after the component, so Tab has somewhere to go once it leaves. */
function after(el: HTMLElement): HTMLButtonElement {
  const b = document.createElement("button");
  b.textContent = "after";
  el.append(b);
  return b;
}

describe("CuiTransferList move toolbar (real browser)", () => {
  const { host, track, cleanup } = mountHosts();
  afterEach(cleanup);

  const items = [
    { value: "a", label: "Alpha" },
    { value: "b", label: "Bravo" },
    { value: "d", label: "Delta" },
  ];

  async function mountList() {
    const el = host({ width: "640px" });
    const wrapper = track(
      mount(CuiTransferList, {
        props: { items, modelValue: ["d"], filterable: false, "onUpdate:modelValue": (v: unknown) => wrapper.setProps({ modelValue: v as string[] }) },
        attachTo: el,
      }),
    );
    await frames(1);
    const option = (label: string) =>
      [...wrapper.element.querySelectorAll<HTMLElement>('[role="option"]')].find((o) => o.textContent?.trim() === label)!;
    const buttons = () => [...wrapper.element.querySelectorAll<HTMLButtonElement>('[role="toolbar"] .cui-button')];
    return { wrapper, option, buttons };
  }

  it("is one Tab stop between the lists, even with nothing marked", async () => {
    const { option, buttons } = await mountList();
    option("Alpha").focus();
    await userEvent.tab();
    // "Move selected" has nothing to move, yet it holds the toolbar's stop.
    expect(document.activeElement).toBe(buttons()[0]);
    expect(buttons()[0].getAttribute("aria-disabled")).toBe("true");
    await userEvent.tab();
    expect(document.activeElement).toBe(option("Delta"));
    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(buttons()[0]);
    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(option("Alpha"));
  });

  it("moves between the buttons with Up and Down, through disabled ones", async () => {
    const { buttons } = await mountList();
    buttons()[0].focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(buttons()[1]);
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(buttons()[2]); // aria-disabled: nothing marked on the right
    await userEvent.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(buttons()[1]);
  });

  it("keeps focus on a move button that its own move disables", async () => {
    const { wrapper, option, buttons } = await mountList();
    option("Alpha").focus();
    await userEvent.keyboard(" ");
    await userEvent.tab();
    expect(document.activeElement).toBe(buttons()[0]);
    await userEvent.keyboard("{Enter}");
    await nextTick();
    expect(wrapper.props("modelValue")).toEqual(["d", "a"]);
    // Nothing is marked any more, so the button is disabled — and still focused.
    expect(buttons()[0].getAttribute("aria-disabled")).toBe("true");
    expect(document.activeElement).toBe(buttons()[0]);
  });
});

describe("CuiDataGridBulkBar toolbar (real browser)", () => {
  const { host, track, cleanup } = mountHosts();
  afterEach(cleanup);

  async function mountGrid() {
    const el = host({ width: "800px" });
    const wrapper = track(
      mount(CuiDataGrid, {
        props: {
          columns: [{ key: "name", label: "Name" }],
          data: [
            { id: 1, name: "Alice" },
            { id: 2, name: "Bob" },
          ],
          hideToolbar: true,
          bulkActions: [
            { key: "archive", label: "Archive" },
            { key: "export", label: "Export" },
            { key: "delete", label: "Delete", variant: "destructive" },
          ],
        },
        attachTo: el,
      }),
    );
    const next = after(el);
    await userEvent.click(wrapper.element.querySelector<HTMLElement>('[aria-label="Select all rows"]')!);
    await frames(2);
    const buttons = [...wrapper.element.querySelectorAll<HTMLElement>(".cui-data-grid-bulk-bar .cui-button")];
    return { buttons, next };
  }

  it("is one Tab stop: Tab leaves the bar from its first action", async () => {
    const { buttons, next } = await mountGrid();
    expect(buttons.map((b) => b.textContent?.trim())).toEqual(["Archive", "Export", "Delete", "Clear"]);
    buttons[0].focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(next);
    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(buttons[0]);
  });

  it("moves between the actions and Clear with the arrow keys, and Tab returns to the last one", async () => {
    const { buttons, next } = await mountGrid();
    buttons[0].focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(buttons[1]);
    await userEvent.keyboard("{End}");
    expect(document.activeElement).toBe(buttons[3]);
    await userEvent.tab();
    expect(document.activeElement).toBe(next);
    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(buttons[3]);
  });

  it("hands focus to the select-all checkbox when Clear hides the bar", async () => {
    const { buttons } = await mountGrid();
    buttons[0].focus();
    await userEvent.keyboard("{End}");
    await userEvent.keyboard("{Enter}");
    await frames(1);
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Select all rows");
  });
});
