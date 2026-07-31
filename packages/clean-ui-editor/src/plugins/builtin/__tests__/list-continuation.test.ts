import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import CuiMarkdownEditor from "../../../components/CuiMarkdownEditor.vue";
import { gfmParser } from "../../../language/markdown-language";

function exposed(wrapper: VueWrapper) {
  return wrapper.vm as unknown as { getView: () => import("@codemirror/view").EditorView };
}

function docText(wrapper: VueWrapper): string {
  return exposed(wrapper).getView().state.doc.toString();
}

describe("list typing ergonomics (FR16, via @codemirror/lang-markdown's continuation commands)", () => {
  let wrapper: VueWrapper | undefined;

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
  });

  it("Enter at the end of a bulleted item continues the list with a new marker", async () => {
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "- one" } });
    await nextTick();
    const view = exposed(wrapper).getView();
    view.dispatch({ selection: { anchor: view.state.doc.length } });

    view.contentDOM.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));

    expect(docText(wrapper)).toBe("- one\n- ");
  });

  it("Enter on an empty bulleted item exits the list with a real blank-line paragraph break", async () => {
    // A 3+ item list — a 2-item tight list has its own special-cased first
    // Enter (it goes "loose" instead of exiting immediately, per CommonMark's
    // tight/loose list semantics), which isn't what this test is about.
    //
    // Regression test: `@codemirror/lang-markdown`'s own
    // `insertNewlineContinueMarkup` deletes the empty item's marker to exit
    // the list but doesn't insert the blank line CommonMark needs — without
    // `exitListWithBlankLine`'s follow-up, this left exactly one newline
    // behind, so text typed next silently became a *lazy continuation* of
    // "two" (the list's last item), not a sibling paragraph. Confirmed by
    // re-parsing the buggy one-newline output with the same grammar the
    // editor uses: it read back as a single list, not a list plus a
    // paragraph.
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "- one\n- two\n- " } });
    await nextTick();
    const view = exposed(wrapper).getView();
    view.dispatch({ selection: { anchor: view.state.doc.length } });

    view.contentDOM.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));

    expect(docText(wrapper)).toBe("- one\n- two\n\n");
  });

  it("text typed after exiting a list parses as a genuine sibling paragraph, not a lazy continuation of the last item", async () => {
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "- one\n- two\n- " } });
    await nextTick();
    const view = exposed(wrapper).getView();
    view.dispatch({ selection: { anchor: view.state.doc.length } });

    view.contentDOM.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    view.dispatch({ changes: { from: view.state.doc.length, insert: "after" } });

    const doc = docText(wrapper);
    const tree = gfmParser.parse(doc);
    const topLevelNames: string[] = [];
    let child = tree.topNode.firstChild;
    while (child) {
      topLevelNames.push(child.name);
      child = child.nextSibling;
    }
    // A BulletList followed by its own, separate Paragraph — not a single
    // BulletList with "after" absorbed into the last item's content.
    expect(topLevelNames).toEqual(["BulletList", "Paragraph"]);
  });

  it("Enter continues a numbered list, renumbering the next item", async () => {
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "1. one" } });
    await nextTick();
    const view = exposed(wrapper).getView();
    view.dispatch({ selection: { anchor: view.state.doc.length } });

    view.contentDOM.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));

    expect(docText(wrapper)).toBe("1. one\n2. ");
  });

  it("Tab indents a nested list item; Shift-Tab outdents it back", async () => {
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "- one\n- two" } });
    await nextTick();
    const view = exposed(wrapper).getView();
    const secondLineStart = "- one\n".length;
    view.dispatch({ selection: { anchor: secondLineStart } });

    view.contentDOM.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
    expect(docText(wrapper)).toBe("- one\n  - two");

    view.contentDOM.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true }));
    expect(docText(wrapper)).toBe("- one\n- two");
  });

  it("Enter continues a task item unchecked", async () => {
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "- [x] done" } });
    await nextTick();
    const view = exposed(wrapper).getView();
    view.dispatch({ selection: { anchor: view.state.doc.length } });

    view.contentDOM.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));

    expect(docText(wrapper)).toBe("- [x] done\n- [ ] ");
  });
});
