import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import CuiMarkdownEditor from "../../components/CuiMarkdownEditor.vue";
import { frames, injectStyle, mountHosts } from "../../../../../config/test/browser-helpers";

/**
 * #228 — the editor's themeable contract, measured. Its border and focus ring were private
 * `--_cme-*` properties read directly, so a consumer could not retheme them at all. Now each
 * is read as `var(--cui-markdown-editor-<slot>, var(--_markdown-editor-<slot>))` in a
 * zero-specificity rule, and these are the two routes that promises: a token set on a
 * container *above* the editor (inherited, not just set on the element itself), and a plain
 * consumer rule with no `!important`.
 *
 * Real browser: the cascade and resolved `var()`s are exactly what jsdom does not model.
 */
describe("the editor's themeable tokens (real browser)", () => {
  const BORDER = "rgb(1, 2, 3)";
  const FOCUS_BORDER = "rgb(4, 5, 6)";
  const FOCUS_RING = "rgb(7, 8, 9)";
  const ERROR = "rgb(200, 0, 0)";
  const TOKENS = `--cui-markdown-editor-border: ${BORDER}; --cui-markdown-editor-focus-border: ${FOCUS_BORDER}; --cui-markdown-editor-focus-ring: ${FOCUS_RING};`;

  // The control transitions its border and shadow, so a reading straight after focus would
  // be the start of the interpolation rather than where it settles.
  let teardown: () => void;
  beforeAll(() => {
    teardown = injectStyle(".cui-markdown-editor__control { transition: none !important; }");
  });
  afterAll(() => teardown());

  const fixtures = mountHosts();
  afterEach(() => fixtures.cleanup());

  /** An editor two levels below a host carrying `cssText`, so the tokens have to inherit to reach it. */
  async function editor(cssText: string, props: Record<string, unknown> = {}) {
    const host = fixtures.host({ cssText: `width: 480px; ${cssText}` });
    const inner = document.createElement("section");
    host.append(inner);
    const wrapper = fixtures.track(mount(CuiMarkdownEditor, { props: { modelValue: "Some text", ...props }, attachTo: inner }));
    await frames(2);
    const q = (sel: string) => wrapper.get(sel).element as HTMLElement;
    return { control: q(".cui-markdown-editor__control"), content: q(".cm-content"), q };
  }

  async function focus(content: HTMLElement) {
    content.focus();
    await frames(1);
  }

  it("draws the border from a token set on an ancestor", async () => {
    const { control } = await editor(TOKENS);
    const s = getComputedStyle(control);
    expect(s.borderTopColor).toBe(BORDER);
    expect(s.borderTopWidth).toBe("1px");
  });

  it("draws the focus border and ring from tokens set on an ancestor", async () => {
    const { control, content } = await editor(TOKENS);
    await focus(content);

    expect(control.matches(":focus-within")).toBe(true);
    const s = getComputedStyle(control);
    expect(s.borderTopColor).toBe(FOCUS_BORDER);
    expect(s.boxShadow).toBe(`${FOCUS_RING} 0px 0px 0px 2px`);
  });

  it("falls back to its own values when nothing is set, so the assertions above can fail", async () => {
    const { control, content } = await editor("");
    const s = getComputedStyle(control);
    expect(s.borderTopColor).not.toBe(BORDER);
    expect(s.borderTopColor).not.toBe("rgba(0, 0, 0, 0)");

    await focus(content);
    expect(s.borderTopColor).not.toBe(FOCUS_BORDER);
    expect(s.boxShadow).not.toContain(FOCUS_RING);
    expect(s.boxShadow).not.toBe("none");
  });

  it("lets a plain consumer rule win, with no !important", async () => {
    // The rules are inside `:where()`, so they are (0,0,0) and this (0,1,0) rule beats them
    // however the sheets are ordered. Loaded first, ahead of editor.css, so it cannot win on
    // source order: a one-class editor rule would tie with it and take the tie.
    const consumer = document.createElement("style");
    consumer.textContent = ".cui-markdown-editor__control { border-color: rgb(10, 11, 12); }";
    document.head.prepend(consumer);
    try {
      const { control } = await editor(TOKENS);
      expect(getComputedStyle(control).borderTopColor).toBe("rgb(10, 11, 12)");
    } finally {
      consumer.remove();
    }
  });

  it("keeps the error colour when a container rethemes the border", async () => {
    // A container restyling its editors must not hide which one is invalid.
    const { control, content } = await editor(`${TOKENS} --cui-error: ${ERROR};`, { error: true });
    const s = getComputedStyle(control);
    expect(s.borderTopColor).toBe(ERROR);

    await focus(content);
    expect(s.borderTopColor).toBe(ERROR);
    expect(s.boxShadow).not.toContain(FOCUS_RING);
  });

  it("rounds the control from --cui-radius-md, like the toolbar inside it", async () => {
    // The control fell back to a bare 0.375rem while the toolbar went through
    // --cui-radius-md, so setting only that token rounded the two differently — a notch
    // in the corner where they meet (#125's shape).
    const { control, q } = await editor("width: 240px; --cui-radius-md: 10px;");
    const scroller = q(".cui-markdown-editor-toolbar .cui-scroll-area__scroller");
    expect(getComputedStyle(control).borderTopRightRadius).toBe("10px");
    expect(getComputedStyle(scroller).borderTopRightRadius).toBe("9px");
  });
});
