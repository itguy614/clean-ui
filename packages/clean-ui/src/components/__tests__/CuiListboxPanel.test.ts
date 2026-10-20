import { describe, it, expect, vi, afterEach } from "vitest";
import { mount, enableAutoUnmount } from "@vue/test-utils";
import { h, nextTick } from "vue";
import CuiListboxPanel from "../CuiListboxPanel.vue";
import CuiListboxOption from "../CuiListboxOption.vue";

enableAutoUnmount(afterEach);
afterEach(() => vi.restoreAllMocks());

function mountPanel() {
  const anchor = document.createElement("div");
  document.body.append(anchor);
  const rect = vi.fn(() => ({ top: 100, bottom: 130, left: 10, right: 210, width: 200, height: 30, x: 10, y: 100, toJSON: () => ({}) }) as DOMRect);
  anchor.getBoundingClientRect = rect;
  mount(CuiListboxPanel, {
    attachTo: document.body,
    props: { open: true, anchor, tokenPrefix: "combobox", maxHeight: 300, fontSize: "14px", itemPadding: "4px" },
    slots: { default: () => h(CuiListboxOption, { index: 0 }, () => "One") },
  });
  return rect;
}

describe("CuiListboxPanel", () => {
  it("anchors under the field at its width, and maps the component's tokens", async () => {
    mountPanel();
    await nextTick();
    const panel = document.querySelector<HTMLElement>(".cui-listbox-panel")!;
    expect(panel.style.top).toBe("134px");
    expect(panel.style.width).toBe("200px");
    expect(panel.style.getPropertyValue("--_listbox-panel-bg")).toBe("var(--cui-combobox-panel-bg, var(--cui-surface-base))");
    expect(panel.style.getPropertyValue("--_listbox-item-padding")).toBe("var(--cui-combobox-item-padding, 4px)");
  });

  // Review of #137: the capture-phase listener re-measured — and re-rendered the rows — on
  // every scroll of the list itself, including scrollIntoView from the arrow keys.
  it("repositions on a page scroll, at most once a frame, and not for a scroll inside it", async () => {
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => (setTimeout(() => cb(0)), 1));
    const rect = mountPanel();
    await nextTick();
    await new Promise((r) => setTimeout(r));
    const before = rect.mock.calls.length;

    document.querySelector(".cui-listbox-panel")!.dispatchEvent(new Event("scroll"));
    await new Promise((r) => setTimeout(r));
    expect(rect.mock.calls.length).toBe(before);

    window.dispatchEvent(new Event("scroll"));
    window.dispatchEvent(new Event("scroll"));
    await new Promise((r) => setTimeout(r));
    expect(rect.mock.calls.length).toBe(before + 1);
  });

  it("an option emits select unless disabled, and hover on mouseenter", async () => {
    const onSelect = vi.fn();
    const w = mount(CuiListboxOption, { props: { index: 2, disabled: true, onSelect } });
    await w.trigger("click");
    expect(onSelect).not.toHaveBeenCalled();
    await w.setProps({ disabled: false });
    await w.trigger("click");
    expect(onSelect).toHaveBeenCalledOnce();
    expect(w.attributes("data-index")).toBe("2");
    await w.trigger("mouseenter");
    expect(w.emitted("hover")).toHaveLength(1);
  });
});
