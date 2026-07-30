import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import CuiMarkdownEditor from "../CuiMarkdownEditor.vue";

function exposed(wrapper: VueWrapper) {
  return wrapper.vm as unknown as { getView: () => import("@codemirror/view").EditorView };
}

// jsdom doesn't implement DataTransfer — `handlePaste` only ever reads
// `.getData(type)` and `.files`, so a plain object matching that shape is
// enough to exercise it without needing the full browser API surface.
function makeClipboardData(entries: { html?: string; text?: string; files?: File[] }) {
  const data: Record<string, string> = {};
  if (entries.html) data["text/html"] = entries.html;
  if (entries.text) data["text/plain"] = entries.text;
  return {
    getData: (type: string) => data[type] ?? "",
    files: entries.files ?? [],
  };
}

function dispatchPaste(view: import("@codemirror/view").EditorView, clipboardData: ReturnType<typeof makeClipboardData>) {
  const event = new Event("paste", { bubbles: true, cancelable: true }) as ClipboardEvent;
  Object.defineProperty(event, "clipboardData", { value: clipboardData });
  view.contentDOM.dispatchEvent(event);
}

describe("paste handling", () => {
  let wrapper: VueWrapper | undefined;

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
  });

  it("pasting HTML converts it to markdown through the active plugins", async () => {
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "" } });
    await nextTick();
    const view = exposed(wrapper).getView();
    view.dispatch({ selection: { anchor: 0 } });

    dispatchPaste(view, makeClipboardData({ html: "<p>a <strong>bold</strong> word</p>" }));
    await nextTick();

    expect(view.state.doc.toString()).toContain("**bold**");
  });

  it("pasting an image file inserts nothing and emits pasteRejected", async () => {
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "before" } });
    await nextTick();
    const view = exposed(wrapper).getView();
    view.dispatch({ selection: { anchor: 0 } });

    const imageFile = new File(["fake-image-bytes"], "photo.png", { type: "image/png" });
    dispatchPaste(view, makeClipboardData({ files: [imageFile] }));
    await nextTick();

    expect(view.state.doc.toString()).toBe("before");
    expect(wrapper.emitted("pasteRejected")).toHaveLength(1);
    const [message] = wrapper.emitted("pasteRejected")![0] as [string];
    expect(message.length).toBeGreaterThan(0);
  });

  it("a paste with only text/plain (no text/html) falls through to default plain-text handling", async () => {
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "" } });
    await nextTick();
    const view = exposed(wrapper).getView();
    view.dispatch({ selection: { anchor: 0 } });

    // No `text/html` entry — e.g. a real "paste as plain text" (Shift/Cmd
    // modifier) action, which strips HTML from the clipboard before this
    // handler ever sees it.
    dispatchPaste(view, makeClipboardData({ text: "**not markdown, just text**" }));
    await nextTick();

    // Our handler declines (returns false) for this case, and CodeMirror's
    // own default paste handling inserts the plain text verbatim —
    // unconverted, markers and all, exactly as a "paste as plain text"
    // action should behave.
    expect(view.state.doc.toString()).toBe("**not markdown, just text**");
  });
});
