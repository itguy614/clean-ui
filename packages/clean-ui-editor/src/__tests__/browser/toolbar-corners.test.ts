import { describe, it, expect, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import CuiMarkdownEditor from "../../components/CuiMarkdownEditor.vue";
import { frames, mountHosts } from "../../../../../config/test/browser-helpers";

/**
 * #125, the editor's half — when the toolbar overflows, its scroller's edge fade sat flush
 * in the control's rounded top-right corner and squared it off, leaving a notch in the
 * border. The fades inherit their scroller's radius (clean-ui's
 * scroll-shadow-corners.test.ts covers that half), but the control owns the radius and does
 * not clip, so there is nothing to inherit unless the toolbar carries the control's top
 * corners down to its scroller. That hand-off is the editor's own, and is measured here.
 *
 * Real browser: `border-radius: inherit` resolving through a laid-out, overflowing scroller
 * is exactly what jsdom does not compute.
 */
describe("the editor toolbar carries the control's corners to its scroller (real browser)", () => {
  const fixtures = mountHosts();
  afterEach(() => fixtures.cleanup());

  /** An editor narrow enough that the default toolbar overflows, with a known radius. */
  async function editor(radius: string) {
    const host = fixtures.host({ cssText: `width: 240px; --cui-button-radius: ${radius};` });
    const wrapper = fixtures.track(mount(CuiMarkdownEditor, { props: { modelValue: "" }, attachTo: host }));
    // The scroll area measures its overflow after mount.
    await frames(2);
    const q = (sel: string) => wrapper.get(sel).element as HTMLElement;
    return {
      control: q(".cui-markdown-editor__control"),
      scroller: q(".cui-markdown-editor-toolbar .cui-scroll-area__scroller"),
    };
  }

  const corners = (el: HTMLElement) => {
    const c = getComputedStyle(el);
    return [c.borderTopLeftRadius, c.borderTopRightRadius, c.borderBottomRightRadius, c.borderBottomLeftRadius];
  };

  it("rounds the overflowing scroller's top corners, inset by the control's border", async () => {
    const { control, scroller } = await editor("10px");

    // The precondition #125 needed: without overflow there is no fade to notch anything.
    expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
    expect(getComputedStyle(control).borderTopRightRadius).toBe("10px");
    expect(getComputedStyle(control).borderTopWidth).toBe("1px");
    // Only the top pair: the toolbar sits at the top of the control, so rounding the bottom
    // corners would notch the fade where it meets the text area.
    expect(corners(scroller)).toEqual(["9px", "9px", "0px", "0px"]);
  });

  it("follows the control's radius token rather than a fixed value", async () => {
    const { scroller } = await editor("4px");
    expect(corners(scroller)).toEqual(["3px", "3px", "0px", "0px"]);
  });
});
