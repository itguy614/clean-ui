import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h, nextTick, ref } from "vue";
import { useScrollSpy, scrollSpyRootMargin, type ScrollSpyTarget, type UseScrollSpyOptions } from "../useScrollSpy";

/** A hand-driven IntersectionObserver: tests decide what is in the band. */
class MockObserver {
  static instances: MockObserver[] = [];
  observed: Element[] = [];
  disconnected = false;
  constructor(
    public callback: IntersectionObserverCallback,
    public options: IntersectionObserverInit,
  ) {
    MockObserver.instances.push(this);
  }
  observe(el: Element) {
    this.observed.push(el);
  }
  unobserve() {}
  disconnect() {
    this.disconnected = true;
  }
  takeRecords() {
    return [];
  }
  /** Report `ids` in the band, `aboveIds` scrolled past it, the rest below it. */
  report(state: Record<string, "in" | "above" | "below" | "hidden">) {
    const records = Object.entries(state).map(([id, where]) => {
      const target = document.getElementById(id)!;
      const bottom = { above: -10, in: 50, below: 900, hidden: 0 }[where];
      const height = where === "hidden" ? 0 : 20;
      return {
        target,
        isIntersecting: where === "in",
        boundingClientRect: { top: bottom - height, bottom, width: height ? 100 : 0, height } as DOMRectReadOnly,
        rootBounds: { top: 0 } as DOMRectReadOnly,
      } as unknown as IntersectionObserverEntry;
    });
    this.callback(records, this as unknown as IntersectionObserver);
  }
}
const latest = () => MockObserver.instances[MockObserver.instances.length - 1];

let page: HTMLElement;
beforeEach(() => {
  MockObserver.instances = [];
  vi.stubGlobal("IntersectionObserver", MockObserver);
  page = document.createElement("div");
  page.innerHTML = ["a", "b", "c", "d"].map((id) => `<h2 id="${id}">${id}</h2>`).join("");
  document.body.append(page);
});
afterEach(() => {
  vi.unstubAllGlobals();
  page.remove();
});

function spy(targets: () => readonly ScrollSpyTarget[], options?: UseScrollSpyOptions) {
  let api!: ReturnType<typeof useScrollSpy>;
  const wrapper = mount(
    defineComponent(() => {
      api = useScrollSpy(targets, options);
      return () => h("div");
    }),
  );
  return { wrapper, api };
}

describe("useScrollSpy", () => {
  it("observes the targets after mount, in document order", async () => {
    // Listed out of order: "topmost" is about the page, not the list.
    const { api } = spy(() => ["c", "a", document.getElementById("b")!]);
    await nextTick();
    expect(latest().observed.map((el) => el.id)).toEqual(["a", "b", "c"]);
    expect(api.activeId.value).toBeNull();
  });

  it("makes the topmost target in the band current when several are", async () => {
    const { api } = spy(() => ["c", "b", "a"]);
    await nextTick();
    latest().report({ a: "above", b: "in", c: "in" });
    expect(api.activeId.value).toBe("b");
    latest().report({ b: "above" });
    expect(api.activeId.value).toBe("c");
  });

  it("keeps the last target to pass above the band when none is in it", async () => {
    const { api } = spy(() => ["a", "b", "c"]);
    await nextTick();
    latest().report({ a: "above", b: "above", c: "below" });
    expect(api.activeId.value).toBe("b");
    // Scrolling back up past b leaves a as the last one above.
    latest().report({ b: "below" });
    expect(api.activeId.value).toBe("a");
  });

  it("lets setActive win over the observer until the scroll settles", async () => {
    const { api } = spy(() => ["a", "b", "c", "d"]);
    await nextTick();
    latest().report({ a: "in" });
    api.setActive("d");
    await nextTick();
    expect(api.activeId.value).toBe("d");
    // The smooth scroll passes b and c on its way; the click still stands.
    latest().report({ a: "above", b: "in" });
    latest().report({ b: "above", c: "in" });
    expect(api.activeId.value).toBe("d");
    // Settled: the next change is the observer's again.
    document.dispatchEvent(new Event("scrollend"));
    latest().report({ c: "above", d: "in" });
    latest().report({ d: "below" });
    expect(api.activeId.value).toBe("c");
  });

  it("hands control back, at once, when the user scrolls themselves", async () => {
    const { api } = spy(() => ["a", "b", "c"]);
    await nextTick();
    api.setActive("c");
    await nextTick();
    // The click's scroll is cut short with b in the band.
    latest().report({ a: "above", b: "in" });
    expect(api.activeId.value).toBe("c");
    window.dispatchEvent(new Event("wheel"));
    expect(api.activeId.value).toBe("b");
  });

  it("keeps the hold through keys that don't scroll, not through ones that do", async () => {
    const { api } = spy(() => ["a", "b"]);
    await nextTick();
    api.setActive("b");
    await nextTick();
    latest().report({ a: "in" });
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
    await nextTick();
    expect(api.activeId.value).toBe("b");
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }));
    expect(api.activeId.value).toBe("a");
  });

  it("does not count a hidden target as scrolled past", async () => {
    const { api } = spy(() => ["a", "b"]);
    await nextTick();
    latest().report({ a: "hidden", b: "below" });
    expect(api.activeId.value).toBeNull();
  });

  it("drops the hold when the clicked section stops being a target", async () => {
    const targets = ref(["a", "b"]);
    const { api } = spy(() => targets.value);
    await nextTick();
    api.setActive("b");
    await nextTick();
    page.insertAdjacentHTML("beforeend", '<h2 id="x">x</h2>');
    targets.value = ["c", "x"];
    await nextTick();
    latest().report({ c: "in" });
    expect(api.activeId.value).toBe("c");
  });

  it("releases on the document's scrollend when the root is the root element", async () => {
    const { api } = spy(() => ["a", "b"], { root: document.documentElement });
    await nextTick();
    api.setActive("b");
    await nextTick();
    document.dispatchEvent(new Event("scrollend"));
    latest().report({ a: "in" });
    expect(api.activeId.value).toBe("a");
  });

  it("ignores a scrollend from another scroller", async () => {
    const root = document.createElement("div");
    document.body.append(root);
    const { api } = spy(() => ["a", "b"], { root });
    await nextTick();
    api.setActive("b");
    await nextTick();
    document.dispatchEvent(new Event("scrollend"));
    latest().report({ a: "in" });
    expect(api.activeId.value).toBe("b");
    root.dispatchEvent(new Event("scrollend"));
    latest().report({ a: "in" });
    expect(api.activeId.value).toBe("a");
    root.remove();
  });

  it("rebuilds the observer when the targets change", async () => {
    const targets = ref<string[]>(["a"]);
    spy(() => targets.value);
    await nextTick();
    const first = latest();
    targets.value.push("b");
    await nextTick();
    expect(first.disconnected).toBe(true);
    expect(latest().observed.map((el) => el.id)).toEqual(["a", "b"]);
  });

  it("keeps its observer when the list is rebuilt with the same targets", async () => {
    const entries = ref([{ id: "a" }, { id: "b" }]);
    spy(() => entries.value.map((e) => e.id));
    await nextTick();
    const first = latest();
    entries.value = [{ id: "a" }, { id: "b" }];
    await nextTick();
    expect(latest()).toBe(first);
    expect(first.disconnected).toBe(false);
  });

  it("refresh() picks up ids that appeared later", async () => {
    const { api } = spy(() => ["a", "late"]);
    await nextTick();
    expect(latest().observed.map((el) => el.id)).toEqual(["a"]);
    page.insertAdjacentHTML("beforeend", '<h2 id="late">late</h2>');
    api.refresh();
    await nextTick();
    expect(latest().observed.map((el) => el.id)).toEqual(["a", "late"]);
  });

  it("passes offset and root to the observer", async () => {
    const root = document.createElement("div");
    spy(() => ["a"], { root, offset: 64, rootMargin: "0px 0px -80% 0px" });
    await nextTick();
    expect(latest().options).toMatchObject({ root, rootMargin: "-64px 0px -80% 0px" });
  });

  it("disconnects and drops its listeners on unmount", async () => {
    const remove = vi.spyOn(window, "removeEventListener");
    const { wrapper, api } = spy(() => ["a"]);
    await nextTick();
    api.setActive("a");
    await nextTick();
    wrapper.unmount();
    expect(latest().disconnected).toBe(true);
    expect(remove).toHaveBeenCalledWith("wheel", expect.any(Function), { capture: true });
    remove.mockRestore();
  });
});

describe("useScrollSpy initial (#423)", () => {
  it("reports initial before the observer has said anything", () => {
    const { api } = spy(() => ["a", "b"], { initial: "a" });
    // Synchronously after setup: no observer exists yet.
    expect(api.activeId.value).toBe("a");
  });

  it("gives way to the observer, and comes back when nothing has reached the band", async () => {
    const { api } = spy(() => ["a", "b", "c"], { initial: "a" });
    await nextTick();
    latest().report({ a: "above", b: "in" });
    expect(api.activeId.value).toBe("b");
    // Scrolled back above the first section.
    latest().report({ a: "below", b: "below" });
    expect(api.activeId.value).toBe("a");
  });

  it("follows a getter", async () => {
    const first = ref<string | undefined>(undefined);
    const { api } = spy(() => ["a", "b"], { initial: () => first.value });
    expect(api.activeId.value).toBeNull();
    first.value = "b";
    await nextTick();
    expect(api.activeId.value).toBe("b");
  });
});

describe("useScrollSpy scrollTo (#423)", () => {
  function rect(top: number) {
    return { top, bottom: top + 20, left: 0, right: 100, width: 100, height: 20, x: 0, y: top, toJSON() {} } as DOMRect;
  }
  /** jsdom has no layout: give an element a scroll range. */
  function scrollable(el: HTMLElement, scrollHeight = 5000, clientHeight = 400) {
    Object.defineProperty(el, "scrollHeight", { configurable: true, value: scrollHeight });
    Object.defineProperty(el, "clientHeight", { configurable: true, value: clientHeight });
  }
  let windowScroll: ReturnType<typeof vi.spyOn<Window, "scrollTo">>;
  beforeEach(() => {
    windowScroll = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    scrollable(document.documentElement);
    document.getElementById("b")!.getBoundingClientRect = () => rect(500);
  });
  afterEach(() => {
    windowScroll.mockRestore();
    delete (document.documentElement as Partial<HTMLElement>).scrollHeight;
    delete (document.documentElement as Partial<HTMLElement>).clientHeight;
  });

  it("scrolls the root so the section sits offset pixels below its top, and marks it at once", async () => {
    const root = document.createElement("div");
    document.body.append(root);
    scrollable(root);
    root.scrollTop = 100;
    root.getBoundingClientRect = () => rect(40);
    document.getElementById("c")!.getBoundingClientRect = () => rect(340);
    const scrollTo = vi.fn();
    root.scrollTo = scrollTo as typeof root.scrollTo;
    const { api } = spy(() => ["a", "b", "c"], { root, offset: 48 });
    await nextTick();
    latest().report({ a: "in" });

    api.scrollTo("c");
    expect(api.activeId.value).toBe("c");
    // 100 already scrolled, + 300 from the root's top to c, - the 48px header.
    expect(scrollTo).toHaveBeenCalledWith({ top: 352, behavior: "smooth" });
    // Held while the scroll passes b on its way.
    latest().report({ a: "above", b: "in" });
    expect(api.activeId.value).toBe("c");
    root.remove();
  });

  it("scrolls the window when the viewport is the scroller", async () => {
    const { api } = spy(() => ["a", "b"], { offset: 56 });
    await nextTick();
    expect(api.scrollTo("b")).toBe(true);
    expect(windowScroll).toHaveBeenCalledWith({ top: 444, behavior: "smooth" });
    expect(api.activeId.value).toBe("b");
  });

  it("lands below the section's own scroll-margin-top when that clears more than offset", async () => {
    document.getElementById("b")!.style.scrollMarginTop = "72px";
    const { api } = spy(() => ["a", "b"], { offset: 56 });
    await nextTick();
    api.scrollTo("b");
    expect(windowScroll).toHaveBeenCalledWith({ top: 428, behavior: "smooth" });
  });

  it("jumps instead of gliding under reduced motion, whatever the page's scroll-behavior", async () => {
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("reduce"), media: q }));
    const { api } = spy(() => ["a", "b"]);
    await nextTick();
    api.scrollTo("b");
    expect(windowScroll).toHaveBeenCalledWith(expect.objectContaining({ behavior: "instant" }));
  });

  it("marks a section it needn't scroll to without holding the spy", async () => {
    // Already at the landing spot: no scroll, so no scrollend would ever release a hold.
    document.getElementById("b")!.getBoundingClientRect = () => rect(0);
    const { api } = spy(() => ["a", "b", "c"]);
    await nextTick();
    expect(api.scrollTo("b")).toBe(true);
    expect(windowScroll).not.toHaveBeenCalled();
    expect(api.activeId.value).toBe("b");
    // A later scroll the spy sees (a focus move, find-in-page) is tracked.
    latest().report({ b: "above", c: "in" });
    expect(api.activeId.value).toBe("c");
  });

  it("does nothing, and says so, for an id that isn't on the page", async () => {
    const { api } = spy(() => ["a", "b"], { initial: "a" });
    await nextTick();
    expect(api.scrollTo("missing")).toBe(false);
    expect(windowScroll).not.toHaveBeenCalled();
    expect(api.activeId.value).toBe("a");
  });

  it("does not scroll the page while a root ref is still unresolved", async () => {
    const root = ref<HTMLElement | null>(null);
    const { api } = spy(() => ["a", "b"], { root });
    await nextTick();
    expect(api.scrollTo("b")).toBe(false);
    expect(windowScroll).not.toHaveBeenCalled();
    expect(api.activeId.value).toBeNull();
  });
});

describe("scrollSpyRootMargin", () => {
  it("takes the offset off the top inset", () => {
    expect(scrollSpyRootMargin(undefined, 0)).toBe("0px 0px -50% 0px");
    expect(scrollSpyRootMargin("10px", 30)).toBe("-20px 10px 10px 10px");
    expect(scrollSpyRootMargin("-10px 0px", 30)).toBe("-40px 0px -10px 0px");
    // A percentage cannot be mixed with pixels: the offset replaces it.
    expect(scrollSpyRootMargin("-5% 0px -50% 0px", 56)).toBe("-56px 0px -50% 0px");
  });
});
