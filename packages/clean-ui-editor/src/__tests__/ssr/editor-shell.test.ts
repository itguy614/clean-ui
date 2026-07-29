import { describe, it, expect } from "vitest";
import { h } from "vue";
import { renderToString } from "@vue/server-renderer";
import CuiMarkdownEditor from "../../components/CuiMarkdownEditor.vue";

// This project runs under Vitest's "node" environment (see vitest.config.ts)
// — no jsdom, no `document`/`window` at all. Server rendering must never
// construct a CodeMirror EditorView (which requires a real DOM); onMounted
// never runs during server rendering, so if the component only creates its
// view there, this proves NFR4 by construction rather than by inspection.
describe("CuiMarkdownEditor server rendering", () => {
  it("renders a shell with no DOM access", async () => {
    const html = await renderToString(h(CuiMarkdownEditor, { modelValue: "# Hello" }));

    expect(html).toContain("cui-markdown-editor");
    expect(html).toContain('data-testid="cui-markdown-editor-shell"');
    // The real CodeMirror content div is only populated client-side —
    // nothing server-rendered should claim to be the mounted editor.
    expect(html).not.toContain('data-testid="cui-markdown-editor"');
  });
});
