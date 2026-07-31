import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import { EditorSelection } from "@codemirror/state";
import CuiMarkdownEditor from "../../components/CuiMarkdownEditor.vue";

function getView(wrapper: VueWrapper) {
  return (wrapper.vm as unknown as { getView: () => import("@codemirror/view").EditorView }).getView()!;
}

function bulletLines(view: import("@codemirror/view").EditorView) {
  return [...view.contentDOM.querySelectorAll(".cui-md-bullet")].map((el) => ({
    text: el.textContent,
    left: (el as HTMLElement).style.left,
  }));
}

describe("list bullet plugin", () => {
  let wrapper: VueWrapper | undefined;

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
  });

  it("renders a bullet glyph for each bulleted item once its marker is hidden", async () => {
    const doc = "- one\n- two\n\nfar away paragraph";
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: doc, mode: "wysiwyg" }, attachTo: document.body });
    await nextTick();
    const view = getView(wrapper);
    view.focus();
    view.dispatch({ selection: EditorSelection.cursor(doc.length) });

    expect(bulletLines(view)).toEqual([
      { text: "•", left: "0.4em" },
      { text: "•", left: "0.4em" },
    ]);
    // The line gets a class reserving indentation space for the bullet.
    const lines = [...view.contentDOM.querySelectorAll(".cui-md-list-line-1")];
    expect(lines).toHaveLength(2);
  });

  it("removes the bullet for the item the cursor is inside, matching marker reveal", async () => {
    const doc = "- one\n- two";
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: doc, mode: "wysiwyg" }, attachTo: document.body });
    await nextTick();
    const view = getView(wrapper);
    view.focus();

    view.dispatch({ selection: EditorSelection.cursor(3) }); // inside "- one"
    expect(bulletLines(view)).toEqual([{ text: "•", left: "0.4em" }]); // only "two"'s bullet shows
  });

  it("positions a nested item's bullet within its own deeper indent band", async () => {
    const doc = "- outer\n  - inner\n\nfar away paragraph";
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: doc, mode: "wysiwyg" }, attachTo: document.body });
    await nextTick();
    const view = getView(wrapper);
    view.focus();
    view.dispatch({ selection: EditorSelection.cursor(doc.length) });

    expect(bulletLines(view)).toEqual([
      { text: "•", left: "0.4em" },
      { text: "•", left: "1.65em" },
    ]);
    expect(view.contentDOM.querySelectorAll(".cui-md-list-line-1")).toHaveLength(1);
    expect(view.contentDOM.querySelectorAll(".cui-md-list-line-2")).toHaveLength(1);
  });

  it("does not remove the real marker text from the document — the bullet is a decorative addition, not a replacement", async () => {
    const doc = "- one\n\nfar away paragraph";
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: doc, mode: "wysiwyg" }, attachTo: document.body });
    await nextTick();
    const view = getView(wrapper);
    view.focus();
    view.dispatch({ selection: EditorSelection.cursor(doc.length) });

    expect(view.state.doc.toString()).toBe(doc);
    // The hidden "-" is still a real, present DOM text node, alongside the
    // decorative bullet widget.
    expect(view.contentDOM.querySelector(".cui-md-marker-hidden")?.textContent).toBe("- ");
  });

  it("renders no bullets in source mode", async () => {
    const doc = "- one\n- two";
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: doc, mode: "source" }, attachTo: document.body });
    await nextTick();
    const view = getView(wrapper);

    expect(bulletLines(view)).toEqual([]);
  });

  it("renders no bullets for an ordered list — only BulletList gets the decorative glyph", async () => {
    const doc = "1. one\n2. two\n\nfar away paragraph";
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: doc, mode: "wysiwyg" }, attachTo: document.body });
    await nextTick();
    const view = getView(wrapper);
    view.focus();
    view.dispatch({ selection: EditorSelection.cursor(doc.length) });

    expect(bulletLines(view)).toEqual([]);
  });
});
