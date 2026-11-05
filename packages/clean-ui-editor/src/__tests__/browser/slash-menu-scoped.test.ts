import { describe, it, expect, afterEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { autocompletion, completionStatus, startCompletion } from "@codemirror/autocomplete";
import CuiMarkdownEditor from "../../components/CuiMarkdownEditor.vue";
import { mountHosts } from "../../../../../config/test/browser-helpers";

/**
 * #227: the slash menu's palette used to be global `!important` rules on
 * `.cm-tooltip-autocomplete`, restyling any other CodeMirror on the page. It now rides the
 * editor's per-instance theme. Real browser: the tooltip is rendered outside the editor
 * and only a real cascade shows which tooltips a rule reaches.
 */
describe("the slash menu is styled per editor instance (real browser)", () => {
  const fixtures = mountHosts();
  afterEach(() => fixtures.cleanup());

  /** A bare CodeMirror with its own autocomplete tooltip open, and no clean-ui theme. */
  async function plainEditor() {
    const view = new EditorView({
      parent: fixtures.host(),
      state: EditorState.create({
        doc: "/",
        selection: { anchor: 1 },
        extensions: [autocompletion({ override: [() => ({ from: 1, options: [{ label: "alpha", type: "keyword" }] })] })],
      }),
    });
    view.focus();
    startCompletion(view);
    await vi.waitFor(() => expect(completionStatus(view.state)).toBe("active"));
    return view;
  }

  it("styles the editor's own menu and none of another CodeMirror's", async () => {
    const wrapper = fixtures.track(mount(CuiMarkdownEditor, { props: { modelValue: "" }, attachTo: fixtures.host() }));
    const ours = EditorView.findFromDOM(wrapper.get(".cm-content").element as HTMLElement)!;
    ours.focus();
    ours.dispatch({ changes: { from: 0, insert: "/" }, selection: { anchor: 1 }, userEvent: "input.type" });
    await vi.waitFor(() => expect(completionStatus(ours.state)).toBe("active"));

    // Measured one at a time: focusing the second editor closes the first one's menu.
    const mine = document.querySelector<HTMLElement>(".cm-tooltip-autocomplete.cui-markdown-editor-slash-menu")!;
    expect(mine).toBeTruthy();
    expect(getComputedStyle(mine.querySelector("ul > li")!).paddingTop).toBe("8px");
    expect(getComputedStyle(mine.querySelector("ul")!).fontFamily).not.toMatch(/^monospace/);
    expect(getComputedStyle(mine).overflow).toBe("hidden");
    // The rules that used to need `!important`: the active row, the matched text, the icon.
    const row = mine.querySelector<HTMLElement>("li[aria-selected]")!;
    expect(row).toBeTruthy();
    expect(getComputedStyle(row).backgroundColor).not.toBe("rgb(17, 119, 204)"); // CodeMirror's `#17c`
    expect(getComputedStyle(row).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    const matched = mine.querySelector(".cm-completionMatchedText");
    if (matched) expect(getComputedStyle(matched).fontWeight).toBe("600");
    expect(mine.querySelector(".cm-completionIcon")).toSatisfy(
      (icon: Element | null) => !icon || getComputedStyle(icon).display === "none",
    );
    // The class is a stable hook for consumers (the tooltip sits inside the editor today, so
    // preflight reaches it either way).
    expect(getComputedStyle(mine).boxSizing).toBe("border-box");

    const other = await plainEditor();
    const theirs = document.querySelector<HTMLElement>(".cm-tooltip-autocomplete:not(.cui-markdown-editor-slash-menu)")!;
    expect(theirs).toBeTruthy();
    expect(getComputedStyle(theirs.querySelector("ul > li")!).paddingTop).not.toBe("8px");
    expect(getComputedStyle(theirs.querySelector("ul")!).fontFamily).toMatch(/monospace/);
    expect(getComputedStyle(theirs).overflow).not.toBe("hidden");
    const icon = theirs.querySelector(".cm-completionIcon");
    if (icon) expect(getComputedStyle(icon).display).not.toBe("none");
    other.destroy();
  });
});
