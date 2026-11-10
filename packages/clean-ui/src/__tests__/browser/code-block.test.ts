import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { userEvent } from "@vitest/browser/context";
import main from "../../styles/main.css?inline";
import { frames, installTokens, settleScroll, mountHosts } from "../../../../../config/test/browser-helpers";
import CuiCodeBlock from "../../components/CuiCodeBlock.vue";

/**
 * #163 — a code block's `<pre>` is reachable and scrollable by keyboard while it overflows
 * (WCAG 2.1.1), is no tab stop while it fits, and the typography layer does not repaint it
 * (`.cui-typography pre, code` rules reach inside a component unless it carries a `cui-*` class).
 */
describe("CuiCodeBlock in a real browser (#163)", () => {
  let removeTokens: () => void;
  beforeAll(() => {
    removeTokens = installTokens(main);
  });
  afterAll(() => removeTokens());

  const dom = mountHosts();
  afterEach(() => dom.cleanup());

  const wide = `const line = "${"x".repeat(400)}";`;
  const tall = Array.from({ length: 60 }, (_, i) => `const v${i} = ${i};`).join("\n");

  function block(props: Record<string, unknown>, prose = false) {
    const host = dom.host();
    host.style.width = "320px";
    if (prose) host.className = "cui-typography";
    const w = dom.track(mount(CuiCodeBlock, { props, attachTo: host }));
    return (w.element as HTMLElement).querySelector<HTMLElement>("pre")!;
  }

  it("a wide block is a tab stop and scrolls by keyboard", async () => {
    const pre = block({ code: wide, copyable: false });
    await frames(3);
    expect(pre.getAttribute("tabindex")).toBe("0");
    expect(pre.getAttribute("aria-label")).toBe("Scrollable code");

    await userEvent.tab();
    expect(document.activeElement).toBe(pre);

    await userEvent.keyboard("{ArrowRight}");
    await frames(3);
    expect(pre.scrollLeft).toBeGreaterThan(0);
    const first = pre.scrollLeft;
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    await frames(3);
    expect(pre.scrollLeft).toBeGreaterThan(first);
  });

  it("a tall block with maxHeight scrolls down by keyboard", async () => {
    const pre = block({ code: tall, maxHeight: "120px", lineNumbers: true, copyable: false });
    await frames(3);
    await userEvent.tab();
    expect(document.activeElement).toBe(pre);
    await userEvent.keyboard("{ArrowDown}");
    await frames(3);
    expect(pre.scrollTop).toBeGreaterThan(0);
    await userEvent.keyboard("{End}");
    await settleScroll(pre);
    expect(pre.scrollTop + pre.clientHeight).toBeGreaterThanOrEqual(pre.scrollHeight - 1);
  });

  it("a short block is not a tab stop", async () => {
    const pre = block({ code: "npm i", copyable: false });
    await frames(3);
    expect(pre.getAttribute("tabindex")).toBeNull();
    expect(pre.getAttribute("role")).toBeNull();
    await userEvent.tab();
    expect(document.activeElement).not.toBe(pre);
  });

  it("is not repainted by the prose pre / code rules", async () => {
    const inProse = block({ code: tall, copyable: false }, true);
    const outside = block({ code: tall, copyable: false }, false);
    await frames(3);
    // Font and colour inherit from the scope itself, so they are compared on the lines, which set their own.
    const line = (el: HTMLElement) => getComputedStyle(el.querySelector("code > span")!);
    for (const prop of ["fontSize", "fontFamily", "color", "lineHeight"] as const) {
      expect(line(inProse)[prop], `line ${prop}`).toBe(line(outside)[prop]);
    }
    for (const sel of ["pre", "code"] as const) {
      const a = getComputedStyle(inProse.parentElement!.querySelector(sel)!);
      const b = getComputedStyle(outside.parentElement!.querySelector(sel)!);
      for (const prop of ["backgroundColor", "paddingTop", "paddingLeft", "marginBottom", "borderTopWidth", "borderTopLeftRadius"] as const) {
        expect(a[prop], `${sel} ${prop}`).toBe(b[prop]);
      }
    }
  });

  it("copies as the newline-separated source, whatever the browser does between blocks", () => {
    const src = "const a = 1;\nconst b = 2;\nconst c = 3;";
    const pre = block({ code: src, lineNumbers: true, copyable: false });
    const code = pre.querySelector("code")!;
    const range = document.createRange();
    range.selectNodeContents(code);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);
    expect(sel.toString()).toBe(src);
    // The newlines add no blank lines: three lines tall, not five.
    const line = code.firstElementChild as HTMLElement;
    expect(code.getBoundingClientRect().height).toBeCloseTo(line.getBoundingClientRect().height * 3, 0);
    sel.removeAllRanges();
  });

  it("keeps each line number level with its line", () => {
    const pre = block({ code: "a\nb\nc", lineNumbers: true, copyable: false });
    const nums = pre.querySelectorAll<HTMLElement>(".cui-code-block__gutter > span");
    const lines = pre.querySelectorAll<HTMLElement>("code > span");
    for (let i = 0; i < 3; i++) {
      expect(nums[i].getBoundingClientRect().top, `row ${i}`).toBeCloseTo(lines[i].getBoundingClientRect().top, 0);
    }
  });
});
