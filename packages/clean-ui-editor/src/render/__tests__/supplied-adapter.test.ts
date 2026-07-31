import { describe, it, expect } from "vitest";
import { createMarkdownRenderAdapter } from "../supplied-adapter";

describe("createMarkdownRenderAdapter", () => {
  it("escapes raw HTML by default with no configuration at all", () => {
    const adapter = createMarkdownRenderAdapter();
    expect(adapter("<script>alert(1)</script>")).toContain("&lt;script&gt;");
  });

  it("refuses allowRawHtml without a sanitize function — construction throws, not a silent fallback", () => {
    expect(() => createMarkdownRenderAdapter({ allowRawHtml: true })).toThrow(/sanitize/i);
  });

  it("passes HTML through the supplied sanitize function when allowRawHtml is true", () => {
    const adapter = createMarkdownRenderAdapter({
      allowRawHtml: true,
      sanitize: (html) => html.replace(/<script[^>]*>.*?<\/script>/gi, ""),
    });
    expect(adapter("<script>alert(1)</script><p>safe</p>")).not.toContain("<script>");
  });

  it("the returned value satisfies the TrustedHtml contract (a plain string at runtime)", () => {
    const adapter = createMarkdownRenderAdapter();
    const html = adapter("# Title");
    expect(typeof html).toBe("string");
    expect(html).toBe("<h1>Title</h1>\n");
  });
});
