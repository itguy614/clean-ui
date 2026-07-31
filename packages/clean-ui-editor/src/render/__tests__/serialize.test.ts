import { describe, it, expect } from "vitest";
import { serializeMarkdownToHtml } from "../serialize";

// Assertions target structure and security-relevant escaping, not exact
// inter-tag whitespace (extra newlines between block elements are visually
// inert in HTML) — .toContain()/regex where only structure matters, .toBe()
// where the exact string is itself the thing under test (e.g. escaping).
describe("serializeMarkdownToHtml", () => {
  it("renders ATX and Setext headings, with no leading/trailing marker whitespace leaking into the content", () => {
    expect(serializeMarkdownToHtml("# Heading 1")).toBe("<h1>Heading 1</h1>\n");
    expect(serializeMarkdownToHtml("## Heading 2 ##")).toBe("<h2>Heading 2</h2>\n");
    expect(serializeMarkdownToHtml("Title\n=====")).toBe("<h1>Title</h1>\n");
  });

  it("renders paragraphs and inline emphasis/strikethrough/code", () => {
    expect(serializeMarkdownToHtml("**bold** *italic* ~~strike~~ `code`")).toBe(
      "<p><strong>bold</strong> <em>italic</em> <del>strike</del> <code>code</code></p>\n",
    );
  });

  it("renders a bulleted list and an ordered list, including a non-1 start", () => {
    const bullets = serializeMarkdownToHtml("- one\n- two");
    expect(bullets).toContain("<ul>");
    expect(bullets).toContain("<li><p>one</p>");
    expect(bullets).toContain("<li><p>two</p>");

    expect(serializeMarkdownToHtml("1. one\n2. two")).toContain("<ol>\n");
    expect(serializeMarkdownToHtml("3. three\n4. four")).toContain('<ol start="3">');
  });

  it("renders GFM task list items with disabled checkboxes, one <li> per item (not two)", () => {
    const html = serializeMarkdownToHtml("- [ ] todo\n- [x] done");
    expect(html).toContain('<li><input type="checkbox" disabled> todo</li>');
    expect(html).toContain('<li><input type="checkbox" disabled checked> done</li>');
    expect(html.match(/<li>/g)).toHaveLength(2); // not double-wrapped
  });

  it("renders a nested list without leaking the marker's separator space", () => {
    const html = serializeMarkdownToHtml("- outer\n  - inner");
    expect(html).toContain("<li><p>outer</p>");
    expect(html).toContain("<ul>\n<li><p>inner</p>");
    expect(html).not.toMatch(/> +outer/); // no stray leading space after the bullet
  });

  it("renders a blockquote", () => {
    expect(serializeMarkdownToHtml("> quoted")).toBe("<blockquote>\n<p>quoted</p>\n</blockquote>\n");
  });

  it("renders a fenced code block with its language and an indented code block", () => {
    expect(serializeMarkdownToHtml("```js\nconsole.log(1)\n```")).toBe(
      '<pre><code class="language-js">console.log(1)</code></pre>\n',
    );
    expect(serializeMarkdownToHtml("    plain")).toBe("<pre><code>plain</code></pre>\n");
  });

  it("escapes fenced/indented code body content — it is never markdown- or HTML-interpreted", () => {
    expect(serializeMarkdownToHtml("```\n<script>alert(1)</script>\n```")).toBe(
      "<pre><code>&lt;script&gt;alert(1)&lt;/script&gt;</code></pre>\n",
    );
  });

  it("renders a horizontal rule", () => {
    expect(serializeMarkdownToHtml("---")).toBe("<hr>\n");
  });

  it("renders a link and an image, each exactly once (the URL child is consumed, not also rendered as a bare autolink)", () => {
    const linkHtml = serializeMarkdownToHtml("[text](https://example.com)");
    expect(linkHtml).toBe('<p><a href="https://example.com">text</a></p>\n');
    expect(linkHtml.match(/<a /g)).toHaveLength(1);

    expect(serializeMarkdownToHtml("![alt text](https://example.com/a.png)")).toBe(
      '<p><img src="https://example.com/a.png" alt="alt text"></p>\n',
    );
  });

  it("renders an angle-bracket autolink and a bare GFM-detected autolink identically", () => {
    expect(serializeMarkdownToHtml("<https://example.com>")).toBe(
      '<p><a href="https://example.com">https://example.com</a></p>\n',
    );
    expect(serializeMarkdownToHtml("Visit https://example.com now")).toBe(
      '<p>Visit <a href="https://example.com">https://example.com</a> now</p>\n',
    );
  });

  it("renders a GFM table with a thead/tbody split", () => {
    expect(serializeMarkdownToHtml("| A | B |\n| - | - |\n| 1 | 2 |")).toBe(
      "<table>\n<thead>\n<tr><th>A</th><th>B</th></tr>\n</thead>\n<tbody>\n<tr><td>1</td><td>2</td></tr>\n</tbody>\n</table>\n",
    );
  });

  it("renders a hard break, an escaped character, and an HTML entity", () => {
    expect(serializeMarkdownToHtml("line one  \nline two")).toBe("<p>line one<br>\nline two</p>\n");
    expect(serializeMarkdownToHtml("\\*not emphasis\\*")).toBe("<p>*not emphasis*</p>\n");
    expect(serializeMarkdownToHtml("&amp;")).toBe("<p>&amp;</p>\n"); // passed through, not double-escaped
  });

  it("escapes a raw HTML block by default (FR39)", () => {
    expect(serializeMarkdownToHtml("<div>raw</div>")).toBe("&lt;div&gt;raw&lt;/div&gt;\n");
  });

  it("escapes inline raw HTML tags by default", () => {
    expect(serializeMarkdownToHtml("before <span>x</span> after")).toBe(
      "<p>before &lt;span&gt;x&lt;/span&gt; after</p>\n",
    );
  });

  it("passes raw HTML through only when allowRawHtml is true and a sanitize function is supplied", () => {
    const html = serializeMarkdownToHtml("<div>raw</div>", {
      allowRawHtml: true,
      sanitize: (s) => s.replace("raw", "sanitized"),
    });
    expect(html).toContain("<div>sanitized</div>");
  });

  it("ignores allowRawHtml with no sanitize function and still escapes (the refusal itself is the adapter's job, not this function's)", () => {
    expect(serializeMarkdownToHtml("<div>raw</div>", { allowRawHtml: true })).toBe("&lt;div&gt;raw&lt;/div&gt;\n");
  });
});
