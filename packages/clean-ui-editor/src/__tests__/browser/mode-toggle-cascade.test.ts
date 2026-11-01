import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { userEvent } from "@vitest/browser/context";
import { CuiButton } from "@itguy614/clean-ui";
import CuiMarkdownEditor from "../../components/CuiMarkdownEditor.vue";
import { injectStyle, mountHosts } from "../../../../../config/test/browser-helpers";

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
  let teardown: () => void;
  beforeAll(() => {
    teardown = injectStyle(".cui-button { transition: none !important; }");
  });
  afterAll(() => teardown());

  const fixtures = mountHosts();
  afterEach(() => fixtures.cleanup());

  function modeToggle(): HTMLElement {
    const wrapper = fixtures.track(
      mount(CuiMarkdownEditor, { props: { modelValue: "Some text" }, attachTo: fixtures.host(HOST) }),
    );
    return wrapper.get('[data-testid="cui-markdown-editor-mode-toggle"]').element as HTMLElement;
  }

  it("paints the editor's background and border at rest", () => {
    const s = getComputedStyle(modeToggle());
    expect(s.backgroundColor).toBe(SURFACE);
    expect(s.borderTopColor).toBe(BORDER);
    expect(s.borderTopWidth).toBe("1px");
    expect(s.borderTopStyle).toBe("solid");
    expect(s.position).toBe("absolute");
  });

  it("keeps them on hover, where CuiButton's ghost variant would tint it", async () => {
    const toggle = modeToggle();
    await userEvent.hover(toggle);

    // A live declaration: it reads the hovered state.
    const s = getComputedStyle(toggle);
    expect(toggle.matches(":hover")).toBe(true);
    expect(s.backgroundColor).toBe(SURFACE);
    expect(s.borderTopColor).toBe(BORDER);
  });

  it("differs from what CuiButton alone paints, so the assertions above can fail", async () => {
    // Without this, a regression that made CuiButton's ghost paint happen to equal the
    // editor's would pass silently. A bare ghost button under the same tokens paints
    // neither value, at rest or on hover.
    const host = fixtures.host(HOST);
    const button = fixtures.track(mount(CuiButton, { props: { variant: "ghost" }, slots: { default: () => "Go" }, attachTo: host }))
      .element as HTMLElement;

    // Live, so the last line reads the hovered state.
    const s = getComputedStyle(button);
    expect(s.backgroundColor).not.toBe(SURFACE);
    expect(s.borderTopColor).not.toBe(BORDER);
    await userEvent.hover(button);
    expect(s.backgroundColor).not.toBe(SURFACE);
  });
});
