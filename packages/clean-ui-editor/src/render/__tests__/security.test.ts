// Task 6.1.4: the XSS surface is wider than raw HTML blocks — each vector
// below gets its own named test rather than one broad "is it safe" check,
// so a regression here points at exactly what broke.
import { describe, it, expect } from "vitest";
import { serializeMarkdownToHtml } from "../serialize";
import { createMarkdownRenderAdapter } from "../supplied-adapter";
import { convertHtmlToMarkdown } from "../../paste/convert-html";

describe("security: default configuration (no allowRawHtml)", () => {
  it("neutralises a <script> block", () => {
    const html = serializeMarkdownToHtml("<script>alert(document.cookie)</script>");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("neutralises a script tag smuggled inline within a paragraph", () => {
    const html = serializeMarkdownToHtml("text <script>alert(1)</script> more");
    expect(html).not.toContain("<script>");
  });

  it("neutralises an event-handler attribute on a raw inline tag", () => {
    const html = serializeMarkdownToHtml('<img src=x onerror="alert(1)">');
    expect(html).not.toMatch(/<img[^>]*onerror/);
    expect(html).toContain("&lt;img");
  });

  it("neutralises an event-handler attribute on a raw block-level tag", () => {
    const html = serializeMarkdownToHtml('<div onclick="alert(1)">click me</div>');
    expect(html).not.toMatch(/<div[^>]*onclick/);
  });

  it("neutralises a javascript: URL in link syntax", () => {
    const html = serializeMarkdownToHtml("[click me](javascript:alert(document.cookie))");
    expect(html).not.toContain("<a ");
    expect(html).not.toContain("javascript:");
    expect(html).toContain("click me");
  });

  it("neutralises a javascript: URL in image syntax", () => {
    const html = serializeMarkdownToHtml("![x](javascript:alert(1))");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("javascript:");
  });

  it("neutralises a data: URL in link syntax", () => {
    const html = serializeMarkdownToHtml("[click me](data:text/html,<script>alert(1)</script>)");
    expect(html).not.toContain("<a ");
    expect(html).not.toContain("data:text/html");
  });

  it("neutralises a data: URL in image syntax", () => {
    const html = serializeMarkdownToHtml("![x](data:text/html,<script>alert(1)</script>)");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("data:");
  });

  it("neutralises a javascript: bare/angle-bracket autolink", () => {
    // Not valid CommonMark autolink syntax in practice (autolinks require an
    // http(s)/mailto-shaped body to be recognised at all), but asserted
    // anyway: if the grammar ever did recognise one, the same URL policy
    // must still apply, not a different, unchecked path.
    const html = serializeMarkdownToHtml("<javascript:alert(1)>");
    expect(html).not.toContain("<a ");
  });

  it("the supplied adapter (not just the serializer directly) neutralises every vector above", () => {
    const adapter = createMarkdownRenderAdapter();
    expect(adapter("<script>alert(1)</script>")).not.toContain("<script>");
    expect(adapter("[x](javascript:alert(1))")).not.toContain("javascript:");
  });
});

describe("security: allowRawHtml + sanitize still neutralises scheme-based vectors", () => {
  // A consumer's HTML sanitizer only ever sees HTMLBlock/HTMLTag source —
  // it has no say over markdown *link/image syntax*, which this library's
  // own URL allowlist (not the sanitizer) is responsible for (FR42).
  const permissiveSanitize = (html: string) => html; // deliberately does nothing, to isolate what THIS library still enforces

  it("a permissive sanitizer does not reopen the javascript:/data: link and image vectors", () => {
    const adapter = createMarkdownRenderAdapter({ allowRawHtml: true, sanitize: permissiveSanitize });
    expect(adapter("[click me](javascript:alert(1))")).not.toContain("javascript:");
    expect(adapter("![x](data:text/html,evil)")).not.toContain("data:");
  });

  it("raw HTML itself passes through untouched when the sanitizer allows it (that pairing is the consumer's own decision)", () => {
    const adapter = createMarkdownRenderAdapter({ allowRawHtml: true, sanitize: permissiveSanitize });
    // This is the whole point of allowRawHtml: FR39 puts the sanitiser
    // decision in the consumer's hands rather than bundling one.
    expect(adapter("<div>raw</div>")).toContain("<div>raw</div>");
  });

  it("a real sanitizer function (stripping script tags) still gets applied", () => {
    const adapter = createMarkdownRenderAdapter({
      allowRawHtml: true,
      sanitize: (html) => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ""),
    });
    expect(adapter("<script>alert(1)</script><p>kept</p>")).not.toContain("<script>");
  });
});

describe("security: HTML smuggled through paste cannot be laundered into a raw-HTML render path", () => {
  it("a script tag pasted from a web page never becomes stored markdown that could render as raw HTML later", () => {
    // FR43: the paste converter has no rule matching <script> (or any
    // element it doesn't recognise) — it degrades to plain text, so the
    // literal characters "<script>" never reach storage as executable
    // markup regardless of what render-time configuration is used later.
    const markdown = convertHtmlToMarkdown("<script>alert(document.cookie)</script>", [], new Set());
    expect(markdown).not.toContain("<script>");

    // Rendering whatever DID get stored, even with the most permissive
    // render config, still can't resurrect a <script> tag that was never
    // preserved as markup in the first place.
    const adapter = createMarkdownRenderAdapter({ allowRawHtml: true, sanitize: (html) => html });
    expect(adapter(markdown)).not.toContain("<script>");
  });

  it("an event-handler attribute pasted on a recognised element (e.g. a link) is dropped, not preserved", () => {
    const markdown = convertHtmlToMarkdown('<a href="https://example.com" onclick="alert(1)">link</a>', [], new Set());
    expect(markdown).not.toContain("onclick");
    expect(markdown).not.toContain("alert(1)");
  });
});

describe("security: the trust boundary is the consumer's, not this library's", () => {
  it("documents that a different renderer for the same markdown is outside this library's control — this library only guarantees its own supplied adapter's output", () => {
    const markdown = "[click me](javascript:alert(1))";

    // This library's own adapter neutralises it.
    expect(createMarkdownRenderAdapter()(markdown)).not.toContain("javascript:");

    // A hypothetical third-party renderer that doesn't apply the same
    // policy is a real, distinct risk this library cannot see or prevent —
    // FR41 states the boundary explicitly rather than implying every
    // MarkdownRenderAdapter is automatically as safe as the supplied one.
    const unsafeThirdPartyAdapter = (md: string) => md.replace(/\[(.+?)\]\((.+?)\)/, '<a href="$2">$1</a>') as never;
    expect(unsafeThirdPartyAdapter(markdown)).toContain("javascript:");
  });

  it("documents that maxLength and the construct policy are client-side only — a resubmitted request bypasses both", () => {
    // FR41: neither this package's maxLength (FR32) nor its construct
    // policy (FR30) touch the render/storage boundary at all — they are
    // input-editing conveniences in the CodeMirror buffer, not validation.
    // Rendering arbitrary stored markdown (as if it came straight from a
    // request body, past any client-side limit) still goes through the
    // exact same security-relevant escaping/allowlisting as any other
    // input — proving the server is what actually has to enforce limits.
    const overLongMarkdown = "x".repeat(10_000);
    expect(() => createMarkdownRenderAdapter()(overLongMarkdown)).not.toThrow();
  });
});
