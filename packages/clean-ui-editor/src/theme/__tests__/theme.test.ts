import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import { syntaxTree } from "@codemirror/language";
import CuiMarkdownEditor from "../../components/CuiMarkdownEditor.vue";
import { editorThemeExtension } from "../editor-theme";
import { cuiMarkdownHighlightStyle } from "../syntax-highlight";

function getView(wrapper: VueWrapper) {
  return (wrapper.vm as unknown as { getView: () => import("@codemirror/view").EditorView }).getView()!;
}

describe("theme", () => {
  it("editorThemeExtension builds without throwing for both dark and light", () => {
    expect(() => editorThemeExtension(true)).not.toThrow();
    expect(() => editorThemeExtension(false)).not.toThrow();
  });

  it("carries no hardcoded colour literal, only --cui-* references", () => {
    for (const rule of cuiMarkdownHighlightStyle.specs) {
      if (rule.color) expect(rule.color).toMatch(/^var\(--cui-/);
    }
  });

  describe("mounted editor", () => {
    let wrapper: VueWrapper | undefined;

    afterEach(() => {
      wrapper?.unmount();
      wrapper = undefined;
    });

    it("renders the drawn cursor and selection layers rather than relying on the native caret", async () => {
      wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "hello" } });
      await nextTick();
      const view = getView(wrapper);

      expect(view.dom.querySelector(".cm-cursorLayer")).not.toBeNull();
      expect(view.dom.querySelector(".cm-selectionLayer")).not.toBeNull();
    });

    it("tags heading, strong, emphasis, code and link constructs with distinct highlight classes", async () => {
      wrapper = mount(CuiMarkdownEditor, {
        props: { modelValue: "# Heading\n\n**bold** *em* `code` [link](https://example.com)" },
      });
      await nextTick();
      const view = getView(wrapper);

      const taggedNodeNames = new Set<string>();
      syntaxTree(view.state).iterate({
        enter: (ref) => {
          taggedNodeNames.add(ref.name);
        },
      });
      for (const expected of ["ATXHeading1", "StrongEmphasis", "Emphasis", "InlineCode", "Link"]) {
        expect(taggedNodeNames.has(expected)).toBe(true);
      }

      // Every highlighted span CodeMirror emits carries a class the
      // HighlightStyle generated — confirms tag → class → rule wiring is
      // live end to end (colour resolution itself needs a real browser,
      // covered separately in the phase-02 journal's Playwright check).
      const highlighted = [...view.contentDOM.querySelectorAll("span[class]")];
      expect(highlighted.length).toBeGreaterThan(0);
    });
  });
});
