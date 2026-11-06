import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import CuiCodeBlock from "../CuiCodeBlock.vue";

/**
 * #163 — the code is `<pre><code>`, so it is code to assistive tech; the line-number gutter is
 * decoration (`aria-hidden`), so a reader doesn't say "one const two x"; and the `<pre>` is a
 * named, focusable region only while it overflows. jsdom has no layout: geometry is set by hand.
 */
let w: VueWrapper | undefined;
afterEach(() => {
  w?.unmount();
  w = undefined;
});

const CODE = "const x = 1;\nconst y = 2;";
const pre = () => w!.find("pre").element as HTMLElement;

function overflow(el: HTMLElement, scrollWidth: number, clientWidth: number) {
  Object.defineProperty(el, "scrollWidth", { value: scrollWidth, configurable: true });
  Object.defineProperty(el, "clientWidth", { value: clientWidth, configurable: true });
  el.dispatchEvent(new Event("scroll"));
}

describe("CuiCodeBlock structure (#163)", () => {
  it("renders the code as pre > code, one block per line", () => {
    w = mount(CuiCodeBlock, { props: { code: CODE }, attachTo: document.body });
    const code = w.find("pre > code");
    expect(code.exists()).toBe(true);
    expect(code.classes()).toContain("cui-code-block__code");
    expect(w.find("pre").classes()).toContain("cui-code-block__pre");
    expect(code.element.children).toHaveLength(2);
    expect(code.text()).toBe(CODE);
  });

  it("hides the line-number gutter from assistive tech and keeps it out of the code text", () => {
    w = mount(CuiCodeBlock, { props: { code: CODE, lineNumbers: true }, attachTo: document.body });
    const gutter = w.find(".cui-code-block__gutter");
    expect(gutter.attributes("aria-hidden")).toBe("true");
    expect(gutter.attributes("style")).toContain("user-select: none");
    expect(gutter.text()).toContain("1");
    // The gutter is not inside <code>: the numbers are never part of the code's text.
    expect(w.find("code").element.contains(gutter.element)).toBe(false);
    expect(w.find("code").text()).not.toMatch(/^\s*1/);
  });

  it("is a named, focusable region only while it overflows", async () => {
    w = mount(CuiCodeBlock, { props: { code: CODE }, attachTo: document.body });
    overflow(pre(), 100, 100);
    await nextTick();
    expect(pre().getAttribute("tabindex")).toBeNull();
    expect(pre().getAttribute("role")).toBeNull();
    expect(pre().getAttribute("aria-label")).toBeNull();

    overflow(pre(), 400, 100);
    await nextTick();
    expect(pre().getAttribute("tabindex")).toBe("0");
    expect(pre().getAttribute("role")).toBe("region");
    expect(pre().getAttribute("aria-label")).toBe("Scrollable code");
  });

  it("takes its region name from the ariaLabel prop", async () => {
    w = mount(CuiCodeBlock, { props: { code: CODE, ariaLabel: "Install command" }, attachTo: document.body });
    overflow(pre(), 400, 100);
    await nextTick();
    expect(pre().getAttribute("aria-label")).toBe("Install command");
  });
});
