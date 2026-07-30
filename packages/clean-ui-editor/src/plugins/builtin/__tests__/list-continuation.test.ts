import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import CuiMarkdownEditor from "../../../components/CuiMarkdownEditor.vue";

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

  it("Enter on an empty bulleted item exits the list", async () => {
    // A 3+ item list — a 2-item tight list has its own special-cased first
    // Enter (it goes "loose" instead of exiting immediately, per CommonMark's
    // tight/loose list semantics), which isn't what this test is about.
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "- one\n- two\n- " } });
    await nextTick();
    const view = exposed(wrapper).getView();
    view.dispatch({ selection: { anchor: view.state.doc.length } });

    view.contentDOM.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));

    expect(docText(wrapper)).toBe("- one\n- two\n");
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
