import { describe, it, expect, vi, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import { syntaxTree } from "@codemirror/language";
import CuiMarkdownEditor from "../CuiMarkdownEditor.vue";

function getView(wrapper: VueWrapper) {
  return (wrapper.vm as unknown as { getView: () => import("@codemirror/view").EditorView }).getView();
}

describe("CuiMarkdownEditor", () => {
  let wrapper: VueWrapper | undefined;

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
  });

  it("mounts, shows the initial document, and is destroyed cleanly on unmount", async () => {
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "# Hello" } });
    await nextTick();

    const view = getView(wrapper);
    expect(view).not.toBeNull();
    expect(view!.state.doc.toString()).toBe("# Hello");

    expect(() => wrapper!.unmount()).not.toThrow();
    expect(getView(wrapper)).toBeNull();
  });

  it("accepts input by dispatching a transaction", async () => {
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "" } });
    await nextTick();
    const view = getView(wrapper)!;

    view.dispatch({ changes: { from: 0, insert: "hello world" } });
    expect(view.state.doc.toString()).toBe("hello world");
  });

  it("parses each GFM construct without error", async () => {
    const gfmDoc = [
      "# Heading",
      "",
      "**bold** *italic* ~~strike~~ `code`",
      "",
      "- [ ] task one",
      "- [x] task two",
      "",
      "| A | B |",
      "| - | - |",
      "| 1 | 2 |",
      "",
      "Visit https://example.com automatically.",
    ].join("\n");

    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: gfmDoc } });
    await nextTick();
    const view = getView(wrapper)!;

    expect(view.state.doc.toString()).toBe(gfmDoc);

    const seen = new Set<string>();
    syntaxTree(view.state).iterate({ enter: (node) => void seen.add(node.name) });
    for (const gfmNodeName of ["Strikethrough", "TaskMarker", "Table", "URL", "ATXHeading1"]) {
      expect(seen, `expected the GFM parser to recognize a ${gfmNodeName} node`).toContain(gfmNodeName);
    }
  });

  describe("value contract", () => {
    it("never rewrites content the user did not edit, including unknown syntax, an HTML block and frontmatter", async () => {
      const doc = [
        "---",
        "title: Test",
        "---",
        "",
        "<div class=\"raw\">html block</div>",
        "",
        "::: custom-container",
        "unknown syntax the parser doesn't recognize",
        ":::",
      ].join("\n");

      wrapper = mount(CuiMarkdownEditor, { props: { modelValue: doc } });
      await nextTick();
      const view = getView(wrapper)!;

      expect(view.state.doc.toString()).toBe(doc);
    });

    it("an incoming modelValue equal to the current document is a no-op", async () => {
      wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "same" } });
      await nextTick();
      const view = getView(wrapper)!;
      const dispatchSpy = vi.spyOn(view, "dispatch");

      await wrapper.setProps({ modelValue: "same" });
      await nextTick();

      expect(dispatchSpy).not.toHaveBeenCalled();
    });

    it("typing continuously while the host echoes a throttled value never moves the cursor or drops characters", async () => {
      wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "ab", throttle: 50 } });
      await nextTick();
      const view = getView(wrapper)!;

      // Simulate the user typing "c" then "d" in quick succession, faster
      // than the 50ms throttle window.
      view.dispatch({ changes: { from: 2, insert: "c" } });
      view.dispatch({ changes: { from: 3, insert: "d" } });
      expect(view.state.doc.toString()).toBe("abcd");

      // The host echoes back the throttled value it was told about after the
      // FIRST keystroke ("abc") — stale relative to what's now in the buffer.
      await wrapper.setProps({ modelValue: "abc" });
      await nextTick();

      // Must not roll the document back to the stale echo, dropping "d".
      expect(view.state.doc.toString()).toBe("abcd");
    });

    it("replaces the document when an external value genuinely differs", async () => {
      wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "original" } });
      await nextTick();
      const view = getView(wrapper)!;

      await wrapper.setProps({ modelValue: "replaced entirely" });
      await nextTick();

      expect(view.state.doc.toString()).toBe("replaced entirely");
    });

    it("emits update:modelValue when the user edits the document", async () => {
      wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "" } });
      await nextTick();
      const view = getView(wrapper)!;

      view.dispatch({ changes: { from: 0, insert: "typed" } });
      await nextTick();

      const emitted = wrapper.emitted("update:modelValue");
      expect(emitted?.at(-1)).toEqual(["typed"]);
    });
  });

  describe("mode switching", () => {
    it("preserves document, cursor, selection and undo history across a mode switch", async () => {
      wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "line one", mode: "wysiwyg" } });
      await nextTick();
      const view = getView(wrapper)!;

      view.dispatch({ changes: { from: 8, insert: " edited" }, selection: { anchor: 15 } });
      const docAfterEdit = view.state.doc.toString();
      const selectionAfterEdit = view.state.selection.main.anchor;

      await wrapper.setProps({ mode: "source" });
      await nextTick();

      expect(view.state.doc.toString()).toBe(docAfterEdit);
      expect(view.state.selection.main.anchor).toBe(selectionAfterEdit);

      // Undo must still see the pre-switch edit as a single undoable step —
      // i.e. undo history was not reset or disturbed by the mode switch.
      const undone = (await import("@codemirror/commands")).undo(view);
      expect(undone).toBe(true);
      expect(view.state.doc.toString()).toBe("line one");
    });

    it("shows raw markdown with nothing hidden in source mode", async () => {
      wrapper = mount(CuiMarkdownEditor, {
        props: { modelValue: "**bold** and _em_", mode: "source" },
      });
      await nextTick();
      const view = getView(wrapper)!;

      expect(view.state.doc.toString()).toBe("**bold** and _em_");
    });

    it("announces the mode change to assistive technology", async () => {
      wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "x", mode: "wysiwyg" } });
      await nextTick();
      const view = getView(wrapper)!;
      const dispatchSpy = vi.spyOn(view, "dispatch");

      await wrapper.setProps({ mode: "source" });
      await nextTick();

      const call = dispatchSpy.mock.calls.find((args) => {
        const spec = args[0] as { effects?: unknown[] };
        return Array.isArray(spec.effects) && spec.effects.length > 0;
      });
      expect(call).toBeDefined();
    });
  });

  it("renders a mode-toggle button group by default, suppressible via showModeToggle", async () => {
    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "" } });
    await nextTick();
    expect(wrapper.find('[data-testid="cui-markdown-editor-mode-wysiwyg"]').exists()).toBe(true);
    wrapper.unmount();

    wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "", showModeToggle: false } });
    await nextTick();
    expect(wrapper.find('[data-testid="cui-markdown-editor-mode-wysiwyg"]').exists()).toBe(false);
  });

  describe("cspNonce", () => {
    afterEach(() => {
      document.head.querySelectorAll("style").forEach((el) => el.remove());
    });

    it("applies the supplied nonce to every style CodeMirror injects", async () => {
      wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "x", cspNonce: "test-nonce-123" } });
      await nextTick();

      const styleTags = [...document.head.querySelectorAll("style")];
      expect(styleTags.length).toBeGreaterThan(0);
      expect(styleTags.every((el) => el.nonce === "test-nonce-123" || el.getAttribute("nonce") === "test-nonce-123")).toBe(true);
    });

    it("falls back to a csp-nonce meta tag when no prop is supplied", async () => {
      const meta = document.createElement("meta");
      meta.name = "csp-nonce";
      meta.content = "meta-nonce-456";
      document.head.appendChild(meta);

      wrapper = mount(CuiMarkdownEditor, { props: { modelValue: "x" } });
      await nextTick();

      const styleTags = [...document.head.querySelectorAll("style")];
      expect(styleTags.some((el) => el.nonce === "meta-nonce-456" || el.getAttribute("nonce") === "meta-nonce-456")).toBe(true);

      meta.remove();
    });
  });
});
