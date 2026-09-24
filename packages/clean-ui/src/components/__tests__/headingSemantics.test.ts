import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import CuiCardHeader from "../CuiCardHeader.vue";
import CuiModalHeader from "../CuiModalHeader.vue";

/**
 * #129 — a title that looks like a heading should be one. `CuiCardHeader` rendered a
 * `<div>`, so a card title was unreachable by heading navigation and absent from the
 * document outline. `CuiModalHeader` and `CuiConfirmDialog` already hardcoded `<h2>`,
 * which had the opposite problem: the level was not the consumer's to choose.
 */
describe("header titles are headings at a level the consumer controls", () => {
  const title = (w: ReturnType<typeof mount>, sel: string) => w.find(sel).element.tagName;

  describe.each([
    ["CuiCardHeader", CuiCardHeader, ".cui-card-header__title", "H3"],
    ["CuiModalHeader", CuiModalHeader, ".cui-modal-header__title", "H2"],
  ])("%s", (_name, component, selector, defaultTag) => {
    it(`defaults to ${defaultTag}`, () => {
      expect(title(mount(component as never, { props: { title: "T" } }), selector)).toBe(defaultTag);
    });

    it("takes the level it is given", () => {
      // The component cannot know where it sits, so the level has to be the caller's.
      expect(title(mount(component as never, { props: { title: "T", titleAs: "h4" } }), selector)).toBe("H4");
    });

    it("can opt out to a div for a decorative title", () => {
      expect(title(mount(component as never, { props: { title: "T", titleAs: "div" } }), selector)).toBe("DIV");
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
});
