import { describe, it, expect, vi } from "vitest";
import { scrollIntoViewWithin } from "../scroll";

/** A scroller and a child with given rects; jsdom lays nothing out. */
function setup(target: { left: number; right: number; top?: number; bottom?: number }, padding = "0px") {
  const scroller = document.createElement("div");
  const el = document.createElement("div");
  scroller.append(el);
  document.body.append(scroller);
  // jsdom doesn't expand the shorthand: set the longhands.
  scroller.style.scrollPaddingLeft = scroller.style.scrollPaddingRight = padding;
  const rect = (r: { left: number; right: number; top: number; bottom: number }) => () => ({ ...r, x: r.left, y: r.top, width: r.right - r.left, height: r.bottom - r.top, toJSON: () => r }) as DOMRect;
  scroller.getBoundingClientRect = rect({ left: 0, right: 200, top: 0, bottom: 40 });
  Object.defineProperty(scroller, "clientWidth", { value: 200 });
  Object.defineProperty(scroller, "clientHeight", { value: 40 });
  el.getBoundingClientRect = rect({ top: 0, bottom: 40, ...target });
  const scrollBy = vi.fn();
  scroller.scrollBy = scrollBy as never;
  return { scroller, el, scrollBy };
}

describe("scrollIntoViewWithin", () => {
  it("leaves an element already inside alone", () => {
    const { scroller, el, scrollBy } = setup({ left: 20, right: 80 });
    scrollIntoViewWithin(scroller, el);
    expect(scrollBy).not.toHaveBeenCalled();
  });

  it("scrolls the least distance to an element past either edge", () => {
    const after = setup({ left: 220, right: 280 });
    scrollIntoViewWithin(after.scroller, after.el);
    expect(after.scrollBy).toHaveBeenCalledWith({ left: 80, top: 0 });
    const before = setup({ left: -50, right: 10 });
    scrollIntoViewWithin(before.scroller, before.el);
    expect(before.scrollBy).toHaveBeenCalledWith({ left: -50, top: 0 });
  });

  it("keeps it clear of the scroller's scroll-padding", () => {
    const { scroller, el, scrollBy } = setup({ left: 150, right: 190 }, "24px");
    scrollIntoViewWithin(scroller, el);
    expect(scrollBy).toHaveBeenCalledWith({ left: 14, top: 0 });
  });

  it("works the vertical axis the same way", () => {
    const { scroller, el, scrollBy } = setup({ left: 20, right: 80, top: 50, bottom: 70 });
    scrollIntoViewWithin(scroller, el);
    expect(scrollBy).toHaveBeenCalledWith({ left: 0, top: 30 });
  });

  it("aligns the start of an element wider than the scroller", () => {
    const { scroller, el, scrollBy } = setup({ left: 100, right: 400 });
    scrollIntoViewWithin(scroller, el);
    expect(scrollBy).toHaveBeenCalledWith({ left: 100, top: 0 });
  });
});
