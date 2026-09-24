import { describe, it, expect, afterEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import CuiCardHeader from "../CuiCardHeader.vue";
import CuiModalHeader from "../CuiModalHeader.vue";
import CuiConfirmDialog from "../CuiConfirmDialog.vue";
import CuiEmptyState from "../CuiEmptyState.vue";

/**
 * #129 — a title that looks like a heading should be one. `CuiCardHeader` rendered a
 * `<div>`, so a card title was unreachable by heading navigation and absent from the
 * document outline. `CuiModalHeader` and `CuiConfirmDialog` already hardcoded `<h2>`,
 * which had the opposite problem: the level was not the consumer's to choose.
 */
describe("header titles are headings at a level the consumer controls", () => {
  // CuiConfirmDialog, CuiModal and CuiSlideover teleport into <body>, so their titles
  // are queried there rather than through the wrapper.
  afterEach(() => {
    document.body.innerHTML = "";
  });

  const tagOf = (sel: string) => document.body.querySelector(sel)?.tagName ?? "";

  describe.each([
    ["CuiCardHeader", CuiCardHeader, ".cui-card-header__title", "H3", {}],
    ["CuiModalHeader", CuiModalHeader, ".cui-modal-header__title", "H2", {}],
    ["CuiConfirmDialog", CuiConfirmDialog, ".cui-confirm-dialog__title", "H2", { visible: true }],
    ["CuiEmptyState", CuiEmptyState, ".cui-empty-state__title", "H3", {}],
  ])("%s", (_name, component, selector, defaultTag, extraProps) => {
    /** Mount with a title and read the tag it rendered as. */
    async function titleTag(props: Record<string, unknown> = {}) {
      const w = mount(component as never, {
        props: { title: "T", ...extraProps, ...props },
        attachTo: document.body,
      });
      await flushPromises();
      return (w.element as HTMLElement).querySelector?.(selector)?.tagName ?? tagOf(selector);
    }

    it(`defaults to ${defaultTag}`, async () => {
      expect(await titleTag()).toBe(defaultTag);
    });

    it("takes the level it is given", async () => {
      // The component cannot know where it sits, so the level has to be the caller's.
      expect(await titleTag({ titleAs: "h4" })).toBe("H4");
    });

    it("can opt out to a div for a decorative title", async () => {
      expect(await titleTag({ titleAs: "div" })).toBe("DIV");
    });
  });

  it("leaves the subtitle a div — it is not a section heading", () => {
    const w = mount(CuiCardHeader, { props: { title: "T", subtitle: "S" } });
    expect(w.find(".cui-card-header__subtitle").element.tagName).toBe("DIV");
  });

  it("still lets the default slot replace the pair entirely", () => {
    const w = mount(CuiCardHeader, { props: { title: "T" }, slots: { default: "<span id='mine'>x</span>" } });
    expect(w.find("#mine").exists()).toBe(true);
    expect(w.find(".cui-card-header__title").exists()).toBe(false);
  });

  it.each([
    ["CuiModal", () => import("../CuiModal.vue")],
    ["CuiSlideover", () => import("../CuiSlideover.vue")],
  ])("%s forwards titleAs into the header it renders in simple mode", async (_n, load) => {
    // Simple mode renders CuiModalHeader internally, so without forwarding the level
    // is unreachable for anyone using the `title` convenience prop.
    const component = (await load()).default;
    mount(component as never, { props: { visible: true, title: "T", titleAs: "h5" } });
    await flushPromises();
    expect(tagOf(".cui-modal-header__title")).toBe("H5");
  });
});
