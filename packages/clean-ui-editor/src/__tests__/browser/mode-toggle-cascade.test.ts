import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { userEvent } from "@vitest/browser/context";
import { CuiButton } from "@itguy614/clean-ui";
import CuiMarkdownEditor from "../../components/CuiMarkdownEditor.vue";
import { mountHosts } from "../../../../../config/test/browser-helpers";

/**
 * #186 — the floating mode toggle is a ghost CuiButton that the editor's stylesheet repaints
 * with a real background and border, so it stays legible over the text scrolling beneath
 * it. Those are plain one-class rules in editor.css, and they win only because CuiButton's
 * themeable rules are zero-specificity (#114). A CuiButton change that gives one of them
 * specificity back — a `:hover` left outside its `:where()` — would make the toggle
 * transparent again with nothing failing. This is that cross-package contract, measured.
 *
 * Real browser: the cascade and resolved `var()`s are exactly what jsdom does not model.
 */
describe("the mode toggle keeps the editor's own paint over CuiButton's (real browser)", () => {
  // Distinct values for the two tokens the editor's rule reads, set on an ancestor, so a
  // match can only come from that rule and never from a CuiButton default.
  const SURFACE = "rgb(1, 2, 3)";
  const BORDER = "rgb(4, 5, 6)";
  const HOST = { cssText: `--cui-surface-base: ${SURFACE}; --cui-border: ${BORDER}; width: 480px;` };

  // CuiButton transitions its background, so a reading right after a hover would be the
  // start of the interpolation rather than where it settles.
  let still: HTMLStyleElement;
  beforeAll(() => {
    still = document.createElement("style");
    still.textContent = ".cui-button { transition: none !important; }";
    document.head.append(still);
  });
  afterAll(() => still.remove());

  const fixtures = mountHosts();
  afterEach(() => fixtures.cleanup());

  function modeToggle(): HTMLElement {
    const wrapper = fixtures.track(
      mount(CuiMarkdownEditor, { props: { modelValue: "Some text" }, attachTo: fixtures.host(HOST) }),
    );
    return wrapper.get('[data-testid="cui-markdown-editor-mode-toggle"]').element as HTMLElement;
  }

  const style = (el: Element) => getComputedStyle(el);

  it("paints the editor's background and border at rest", () => {
    const toggle = modeToggle();
    expect(style(toggle).backgroundColor).toBe(SURFACE);
    expect(style(toggle).borderTopColor).toBe(BORDER);
    expect(style(toggle).borderTopWidth).toBe("1px");
    expect(style(toggle).borderTopStyle).toBe("solid");
    expect(style(toggle).position).toBe("absolute");
  });

  it("keeps them on hover, where CuiButton's ghost variant would tint it", async () => {
    const toggle = modeToggle();
    await userEvent.hover(toggle);

    expect(toggle.matches(":hover")).toBe(true);
    expect(style(toggle).backgroundColor).toBe(SURFACE);
    expect(style(toggle).borderTopColor).toBe(BORDER);
  });

  it("differs from what CuiButton alone paints, so the assertions above can fail", async () => {
    // Without this, a regression that made CuiButton's ghost paint happen to equal the
    // editor's would pass silently. A bare ghost button under the same tokens paints
    // neither value, at rest or on hover.
    const host = fixtures.host(HOST);
    const button = fixtures.track(mount(CuiButton, { props: { variant: "ghost" }, slots: { default: () => "Go" }, attachTo: host }))
      .element as HTMLElement;

    expect(style(button).backgroundColor).not.toBe(SURFACE);
    expect(style(button).borderTopColor).not.toBe(BORDER);
    await userEvent.hover(button);
    expect(style(button).backgroundColor).not.toBe(SURFACE);
  });
});
