import { describe, it, expect, vi, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, nextTick } from "vue";
import CuiScrollArea from "../CuiScrollArea.vue";
import CuiModalBody from "../CuiModalBody.vue";
import { useScrollArea } from "../../composables/useScrollArea";

/**
 * #143 — the scroll arrangement (wrapper, scroller, fades, region) is assembled once, in
 * useScrollArea, and CuiScrollArea wraps it. jsdom has no layout, so each test gives the
 * scroller its sizes and scroll position, then fires a scroll to re-measure.
 */

let w: VueWrapper | undefined;
afterEach(() => {
  w?.unmount();
  w = undefined;
  vi.restoreAllMocks();
});

interface Geometry {
  scrollWidth?: number;
  clientWidth?: number;
  scrollLeft?: number;
  scrollHeight?: number;
  clientHeight?: number;
  scrollTop?: number;
}

function setGeometry(el: HTMLElement, g: Geometry) {
  for (const [key, value] of Object.entries(g)) Object.defineProperty(el, key, { value, configurable: true, writable: true });
  el.dispatchEvent(new Event("scroll"));
}

const scroller = () => w!.find(".cui-scroll-area__scroller").element as HTMLElement;

describe("CuiScrollArea", () => {
  it("is a named, focusable region only while it overflows", async () => {
    w = mount(CuiScrollArea, { slots: { default: () => "content" }, attachTo: document.body });
    setGeometry(scroller(), { scrollHeight: 100, clientHeight: 100 });
    await nextTick();
    expect(scroller().getAttribute("tabindex")).toBeNull();
    expect(scroller().getAttribute("role")).toBeNull();

    setGeometry(scroller(), { scrollHeight: 400, clientHeight: 100 });
    await nextTick();
    expect(scroller().getAttribute("role")).toBe("region");
    expect(scroller().getAttribute("tabindex")).toBe("0");
    expect(scroller().getAttribute("aria-label")).toBe("Scrollable content");
  });

  it("takes a name, or a labelling element, and drops the region when told to", async () => {
    w = mount(CuiScrollArea, { props: { ariaLabel: "Release notes" }, attachTo: document.body });
    setGeometry(scroller(), { scrollHeight: 400, clientHeight: 100 });
    await nextTick();
    expect(scroller().getAttribute("aria-label")).toBe("Release notes");
    await w.setProps({ ariaLabelledby: "heading" });
    expect(scroller().getAttribute("aria-labelledby")).toBe("heading");
    expect(scroller().getAttribute("aria-label")).toBeNull();
    await w.setProps({ region: false });
    expect(scroller().getAttribute("role")).toBeNull();
    expect(scroller().getAttribute("tabindex")).toBeNull();
  });

  it("fades only the edges with more past them, with a mask on the scroller", async () => {
    w = mount(CuiScrollArea, { attachTo: document.body });
    setGeometry(scroller(), { scrollHeight: 400, clientHeight: 100, scrollTop: 0 });
    await nextTick();
    const mask = () => scroller().style.maskImage || scroller().style.getPropertyValue("-webkit-mask-image");
    expect(mask()).toContain("#000 0px"); // nothing above: no fade at the top
    expect(mask()).toContain("calc(100% - var(--cui-scroll-area-fade-size, 1.5rem))"); // more below
    setGeometry(scroller(), { scrollTop: 300 });
    await nextTick();
    expect(mask()).toContain("calc(100% - 0px)"); // at the end now
  });

  it("does no masking without fade", async () => {
    w = mount(CuiScrollArea, { props: { fade: false }, attachTo: document.body });
    setGeometry(scroller(), { scrollHeight: 400, clientHeight: 100 });
    await nextTick();
    expect(scroller().style.maskImage).toBe("");
  });

  it("shows an indicator only at an edge with more (auto), hidden and unfocusable", async () => {
    w = mount(CuiScrollArea, { props: { orientation: "horizontal", indicator: "button" }, attachTo: document.body });
    setGeometry(scroller(), { scrollWidth: 900, clientWidth: 300, scrollLeft: 0 });
    await nextTick();
    const edge = (name: string) => w!.find(`.cui-scroll-area__edge--${name}`);
    expect(edge("start").classes()).toContain("cui-scroll-area__edge--hidden");
    expect(edge("end").classes()).not.toContain("cui-scroll-area__edge--hidden");
    expect(edge("end").attributes("aria-hidden")).toBe("true");
    expect(edge("end").find("button").attributes("tabindex")).toBe("-1");
    // A sibling of the scroller, never inside it.
    expect(scroller().contains(edge("end").element)).toBe(false);
  });

  it("scrolls by about three-quarters of the view on a button click", async () => {
    w = mount(CuiScrollArea, { props: { orientation: "horizontal", indicator: "button" }, attachTo: document.body });
    const el = scroller();
    setGeometry(el, { scrollWidth: 900, clientWidth: 300, scrollLeft: 0 });
    await nextTick();
    const scrollBy = vi.fn();
    el.scrollBy = scrollBy as unknown as typeof el.scrollBy;
    await w.find(".cui-scroll-area__edge--end button").trigger("click");
    expect(scrollBy).toHaveBeenCalledWith(expect.objectContaining({ left: 225 }));
  });

  it("renders both indicators with always, disabling the one with nothing to reveal", async () => {
    w = mount(CuiScrollArea, {
      props: { orientation: "horizontal", indicator: "button", indicatorVisibility: "always" },
      attachTo: document.body,
    });
    setGeometry(scroller(), { scrollWidth: 900, clientWidth: 300, scrollLeft: 0 });
    await nextTick();
    expect(w.find(".cui-scroll-area__edge--start").classes()).not.toContain("cui-scroll-area__edge--hidden");
    expect((w.find(".cui-scroll-area__edge--start button").element as HTMLButtonElement).disabled).toBe(true);
    expect((w.find(".cui-scroll-area__edge--end button").element as HTMLButtonElement).disabled).toBe(false);
  });

  it("makes an arrow indicator decorative", async () => {
    w = mount(CuiScrollArea, { props: { orientation: "horizontal", indicator: "arrow" }, attachTo: document.body });
    setGeometry(scroller(), { scrollWidth: 900, clientWidth: 300 });
    await nextTick();
    expect(w.find(".cui-scroll-area__edge--end button").exists()).toBe(false);
    expect(w.find(".cui-scroll-area__indicator--decorative").exists()).toBe(true);
  });

  it("passes edge, hasMore and scroll to the indicator slots", async () => {
    w = mount(CuiScrollArea, {
      props: { orientation: "horizontal", indicator: "button" },
      slots: {
        "indicator-end": ({ edge, hasMore }: { edge: string; hasMore: boolean }) => h("span", { class: "custom" }, `${edge}:${hasMore}`),
      },
      attachTo: document.body,
    });
    setGeometry(scroller(), { scrollWidth: 900, clientWidth: 300 });
    await nextTick();
    expect(w.find(".custom").text()).toBe("end:true");
  });

  it("keeps an item scrolled into view clear of the fade and the indicator", () => {
    w = mount(CuiScrollArea, { props: { orientation: "horizontal", indicator: "arrow" }, attachTo: document.body });
    expect(scroller().style.scrollPaddingRight).toBe(
      "calc(var(--cui-scroll-area-fade-size, 1.5rem) + var(--cui-scroll-area-indicator-size, 2rem))",
    );
  });

  it("re-renders on a scroll only when an edge changes", async () => {
    let renders = 0;
    w = mount(CuiScrollArea, { slots: { default: () => (renders++, "x") }, attachTo: document.body });
    setGeometry(scroller(), { scrollHeight: 400, clientHeight: 100, scrollTop: 50 });
    await nextTick();
    const before = renders;
    setGeometry(scroller(), { scrollTop: 60 });
    setGeometry(scroller(), { scrollTop: 70 });
    await nextTick();
    expect(renders).toBe(before);
  });
});

describe("useScrollArea", () => {
  it("measures a right-to-left scroller from its start, which is the right edge", async () => {
    let area!: ReturnType<typeof useScrollArea>;
    const Host = defineComponent(() => {
      area = useScrollArea({ orientation: "horizontal" });
      return () => h("div", { dir: "rtl" }, [h("div", { ref: area.setScroller, class: "s", ...area.scrollerAttrs.value })]);
    });
    w = mount(Host, { attachTo: document.body });
    const el = w.find(".s").element as HTMLElement;
    el.style.direction = "rtl";
    setGeometry(el, { scrollWidth: 900, clientWidth: 300, scrollLeft: 0 }); // at the start (right)
    await nextTick();
    expect(area.rtl.value).toBe(true);
    expect(area.canScrollStart.value).toBe(false);
    expect(area.canScrollEnd.value).toBe(true);
    expect(area.edges.value).toMatchObject({ right: false, left: true });
    setGeometry(el, { scrollLeft: -600 }); // at the end (left)
    await nextTick();
    expect(area.canScrollStart.value).toBe(true);
    expect(area.canScrollEnd.value).toBe(false);
  });

  it("hands back overlay fades to render beside the scroller", async () => {
    let area!: ReturnType<typeof useScrollArea>;
    const Host = defineComponent(() => {
      area = useScrollArea({ orientation: "both", fade: "overlay" });
      return () => h("div", [h("div", { ref: area.setScroller, class: "s", ...area.scrollerAttrs.value })]);
    });
    w = mount(Host, { attachTo: document.body });
    setGeometry(w.find(".s").element as HTMLElement, { scrollWidth: 900, clientWidth: 300, scrollHeight: 400, clientHeight: 100 });
    await nextTick();
    expect(area.overlayFades.value.map((f) => f.edge).sort()).toEqual(["bottom", "right"]);
  });

  it("fades, and pads, only the edges named in fadeEdges", async () => {
    let area!: ReturnType<typeof useScrollArea>;
    const Host = defineComponent(() => {
      area = useScrollArea({ orientation: "both", fade: "overlay", fadeEdges: ["right", "bottom"] });
      return () => h("div", [h("div", { ref: area.setScroller, class: "s", ...area.scrollerAttrs.value })]);
    });
    w = mount(Host, { attachTo: document.body });
    const el = w.find(".s").element as HTMLElement;
    setGeometry(el, { scrollWidth: 900, clientWidth: 300, scrollLeft: 300, scrollHeight: 400, clientHeight: 100, scrollTop: 100 });
    await nextTick();
    expect(area.edges.value).toMatchObject({ top: true, left: true });
    expect(area.overlayFades.value.map((f) => f.edge).sort()).toEqual(["bottom", "right"]);
    expect(el.style.scrollPaddingTop).toBe("0px"); // nothing between a sticky header and the item
    expect(el.style.scrollPaddingBottom).toBe("var(--cui-scroll-area-fade-size, 1.5rem)");
  });
});

describe("CuiModalBody on CuiScrollArea", () => {
  it("is keyboard-scrollable once it overflows", async () => {
    w = mount(CuiModalBody, { slots: { default: () => "long text" }, attachTo: document.body });
    const el = w.find(".cui-scroll-area__scroller").element as HTMLElement;
    setGeometry(el, { scrollHeight: 900, clientHeight: 200 });
    await nextTick();
    expect(el.getAttribute("tabindex")).toBe("0");
    expect(w.find(".cui-modal-body").exists()).toBe(true);
  });
});
