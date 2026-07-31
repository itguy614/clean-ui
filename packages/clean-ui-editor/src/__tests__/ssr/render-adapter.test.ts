import { describe, it, expect } from "vitest";
import { createMarkdownRenderAdapter } from "../../render/supplied-adapter";
import { serializeMarkdownToHtml } from "../../render/serialize";

// Task 6.1.3: this project runs under Vitest's "node" environment (see
// vitest.config.ts) — no jsdom, no `document`/`window` at all. If the
// adapter secretly depended on the DOM (e.g. via a browser-only HTML
// parser), constructing or calling it here would throw a ReferenceError.
describe("the supplied render adapter runs with no DOM (NFR4-style, task 6.1.3)", () => {
  it("constructs and renders markdown to HTML with no document/window global", () => {
    expect(typeof document).toBe("undefined");
    expect(typeof window).toBe("undefined");

    const adapter = createMarkdownRenderAdapter();
    const html = adapter("# Hello\n\nA **bold** paragraph.");

    expect(html).toContain("<h1>Hello</h1>");
    expect(html).toContain("<strong>bold</strong>");
  });

  it("serializeMarkdownToHtml itself needs no DOM either", () => {
    expect(serializeMarkdownToHtml("- one\n- two")).toContain("<ul>");
  });
});
