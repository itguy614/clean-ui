import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import { undo } from "@codemirror/commands";
import CuiMarkdownEditor from "../../../../components/CuiMarkdownEditor.vue";
import { linkPlugin } from "../../link";
import { imagePlugin } from "../../image";

interface Exposed {
  getView: () => import("@codemirror/view").EditorView;
  runCommand: (id: string) => boolean;
}

function exposed(wrapper: VueWrapper): Exposed {
  return wrapper.vm as unknown as Exposed;
}

function flush() {
  return Promise.resolve().then(() => Promise.resolve());
}

// The id prop CuiInput receives lands on its root wrapper div (plain attrs
// fallthrough), not the native <input> it renders internally — so every
// lookup here needs the descendant combinator to reach the real input.
function nativeInput(id: string): HTMLInputElement | null {
  return document.querySelector(`#${id} input`);
}

function setInputValue(id: string, value: string) {
  const input = nativeInput(id);
  if (!input) throw new Error(`no native input under #${id}`);
  input.value = value;
  input.dispatchEvent(new Event("input"));
}

function clickButtonWithText(text: string) {
  const button = [...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === text);
  if (!button) throw new Error(`no button with text "${text}"`);
  button.click();
}

describe("link and image dialogs (collect() seam)", () => {
  let wrapper: VueWrapper | undefined;

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    // mountStandaloneDialog appends outside the component tree — unmounting
    // the wrapper doesn't clean it up, so tests must (a failed test may
    // leave one behind, but that's isolated per test file run).
    document.body.innerHTML = "";
  });

  it("running the link command opens a dialog, and submitting inserts a labelled link as one undo step", async () => {
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "", plugins: [linkPlugin] } });
    await nextTick();
    const view = exposed(wrapper).getView();

    const handled = exposed(wrapper).runCommand("link");
    expect(handled).toBe(true);
    await nextTick();

    expect(document.querySelector("#cui-link-dialog-url")).not.toBeNull();
    // The command returned synchronously without editing yet (FR18).
    expect(view.state.doc.toString()).toBe("");

    setInputValue("cui-link-dialog-url", "https://example.com");
    setInputValue("cui-link-dialog-label", "Example");
    clickButtonWithText("Insert");
    await flush();

    expect(view.state.doc.toString()).toBe("[Example](https://example.com)");
    undo(view);
    expect(view.state.doc.toString()).toBe("");
  });

  it("a URL-looking selection pre-fills the URL field; any other selection becomes the label", async () => {
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "https://example.com and some words", plugins: [linkPlugin] } });
    await nextTick();
    const view = exposed(wrapper).getView();

    view.dispatch({ selection: { anchor: 0, head: "https://example.com".length } });
    exposed(wrapper).runCommand("link");
    await nextTick();
    expect(nativeInput("cui-link-dialog-url")!.value).toBe("https://example.com");
    expect(nativeInput("cui-link-dialog-label")!.value).toBe("");
    clickButtonWithText("Cancel");
    await flush();

    view.dispatch({ selection: { anchor: "https://example.com and ".length, head: "https://example.com and some".length } });
    exposed(wrapper).runCommand("link");
    await nextTick();
    expect(nativeInput("cui-link-dialog-url")!.value).toBe("");
    expect(nativeInput("cui-link-dialog-label")!.value).toBe("some");
  });

  it("cancelling leaves the document untouched", async () => {
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "unchanged", plugins: [linkPlugin] } });
    await nextTick();
    const view = exposed(wrapper).getView();

    exposed(wrapper).runCommand("link");
    await nextTick();
    setInputValue("cui-link-dialog-url", "https://example.com");
    clickButtonWithText("Cancel");
    await flush();

    expect(view.state.doc.toString()).toBe("unchanged");
    expect(document.querySelector("#cui-link-dialog-url")).toBeNull(); // dialog unmounted
  });

  it("a javascript: URL is refused with an inline error and nothing is inserted", async () => {
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "", plugins: [linkPlugin] } });
    await nextTick();
    const view = exposed(wrapper).getView();

    exposed(wrapper).runCommand("link");
    await nextTick();
    setInputValue("cui-link-dialog-url", "javascript:alert(1)");
    clickButtonWithText("Insert");
    await nextTick();

    // Dialog stays open (rejected client-side) — nothing was inserted.
    expect(document.querySelector("#cui-link-dialog-url")).not.toBeNull();
    expect(view.state.doc.toString()).toBe("");
    expect(document.body.textContent).toContain("scheme isn't allowed");
  });

  it("mode switching is disabled while the dialog is open, and re-enabled after it closes", async () => {
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "", plugins: [linkPlugin] } });
    await nextTick();

    expect(wrapper.find('[data-testid="cui-markdown-editor-mode-source"]').attributes("disabled")).toBeUndefined();

    exposed(wrapper).runCommand("link");
    await nextTick();
    expect(wrapper.find('[data-testid="cui-markdown-editor-mode-source"]').attributes("disabled")).toBeDefined();

    clickButtonWithText("Cancel");
    await flush();
    await nextTick();
    expect(wrapper.find('[data-testid="cui-markdown-editor-mode-source"]').attributes("disabled")).toBeUndefined();
  });

  it("running the image command inserts an image by URL only, one undo step", async () => {
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "", plugins: [imagePlugin] } });
    await nextTick();
    const view = exposed(wrapper).getView();

    exposed(wrapper).runCommand("image");
    await nextTick();
    setInputValue("cui-image-dialog-url", "https://example.com/pic.png");
    setInputValue("cui-image-dialog-alt", "A picture");
    clickButtonWithText("Insert");
    await flush();

    expect(view.state.doc.toString()).toBe("![A picture](https://example.com/pic.png)");
    undo(view);
    expect(view.state.doc.toString()).toBe("");
  });
});
