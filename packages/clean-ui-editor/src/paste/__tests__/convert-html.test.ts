import { describe, it, expect } from "vitest";
import { convertHtmlToMarkdown } from "../convert-html";
import { buildRegistry } from "../../plugins/registry";
import { DEFAULT_PLUGINS } from "../../plugins/default-plugins";
import { definePlugin } from "../../plugins/define-plugin";
import { boldPlugin } from "../../plugins/builtin/bold";

function convert(html: string, plugins = DEFAULT_PLUGINS) {
  const result = buildRegistry(plugins);
  if (!result.ok) throw new Error(result.error);
  return convertHtmlToMarkdown(html, result.registry.paste, result.registry.constructs);
}

describe("convertHtmlToMarkdown", () => {
  it("preserves headings, emphasis, links and lists from a rendered page", () => {
    const html = `
      <h1>Title</h1>
      <p>Some <strong>bold</strong> and <em>italic</em> text with a <a href="https://example.com">link</a>.</p>
      <ul><li>one</li><li>two</li></ul>
      <ol><li>first</li><li>second</li></ol>
    `;
    const markdown = convert(html);

    expect(markdown).toContain("# Title");
    expect(markdown).toContain("**bold**");
    expect(markdown).toContain("*italic*");
    expect(markdown).toContain("[link](https://example.com)");
    expect(markdown).toContain("- one");
    expect(markdown).toContain("- two");
    expect(markdown).toContain("1. first");
    expect(markdown).toContain("2. second");
  });

  it("preserves a table with exactly one header separator, not one per row", () => {
    // Single-line, no inter-tag whitespace — real browser-copied clipboard
    // HTML isn't pretty-printed either, and whitespace-only text nodes
    // between table rows would otherwise leak into the output as literal
    // text (a hand-formatted, indented fixture would hit exactly that,
    // which is a test-fixture artifact, not a real paste scenario — the
    // real-browser check in this phase's journal confirms actual clipboard
    // HTML doesn't have this problem).
    const html =
      "<table><thead><tr><th>Name</th><th>Age</th></tr></thead>" +
      "<tbody><tr><td>Ada</td><td>36</td></tr><tr><td>Grace</td><td>85</td></tr></tbody></table>";
    const markdown = convert(html);

    // An exact match, not just toContain — a spurious extra separator after
    // a later body row (the actual bug this test caught) would still pass a
    // set of individual toContain checks, since none of them assert on
    // what's ABSENT.
    expect(markdown).toBe("| Name | Age |\n| --- | --- |\n| Ada | 36 |\n| Grace | 85 |");
  });

  it("preserves a task list with checked and unchecked items", () => {
    const html = `<ul>
      <li><input type="checkbox" checked> done</li>
      <li><input type="checkbox"> pending</li>
    </ul>`;
    const markdown = convert(html);

    expect(markdown).toContain("- [x] done");
    expect(markdown).toContain("- [ ] pending");
  });

  it("with italic excluded, pasted emphasis arrives as plain text", () => {
    const withoutItalic = DEFAULT_PLUGINS.filter((p) => p.id !== "cui-italic");
    const markdown = convert("<p>an <em>emphasised</em> word</p>", withoutItalic);

    expect(markdown).not.toContain("*emphasised*");
    expect(markdown).toContain("emphasised");
  });

  it("with bold excluded, pasted strong text arrives as plain text while a nested active link survives", () => {
    const withoutBold = DEFAULT_PLUGINS.filter((p) => p.id !== "cui-bold");
    const markdown = convert('<p><strong>bold with a <a href="https://example.com">link</a> inside</strong></p>', withoutBold);

    expect(markdown).not.toMatch(/\*\*/);
    expect(markdown).toContain("[link](https://example.com)");
  });

  it("a script tag never reaches the stored markdown, not even as text", () => {
    const markdown = convert('<p>hello</p><script>alert("pwned")</script>');

    expect(markdown).not.toContain("alert");
    expect(markdown).not.toContain("<script>");
    expect(markdown).toContain("hello");
  });

  it("an unknown/unrecognized element yields its text, never raw HTML", () => {
    const markdown = convert("<custom-widget>widget text</custom-widget>");

    expect(markdown).not.toContain("<custom-widget>");
    expect(markdown).toContain("widget text");
  });

  it("with the image plugin not loaded, its <img> markup disappears entirely rather than leaving dangling syntax", () => {
    // Excluding a plugin removes its paste rule along with everything
    // else (FR27) — there is no rule left to even recognise "this was an
    // <img>," so this is the "or plain text" (here: nothing, since an
    // image has no text of its own) end of FR28, not a "nearest available
    // representation" case. That case needs the *rule* to still exist
    // (below), which only happens for a construct another loaded plugin
    // still declares.
    const withoutImage = DEFAULT_PLUGINS.filter((p) => p.id !== "cui-image");
    const markdown = convert('<p>before</p><img src="https://example.com/pic.png" alt="a picture"><p>after</p>', withoutImage);

    expect(markdown).not.toContain("![");
    expect(markdown).not.toContain("a picture");
    expect(markdown).toContain("before");
    expect(markdown).toContain("after");
  });

  it("with the whole heading-1 plugin not loaded, an <h1> falls all the way to plain text", () => {
    const withoutH1 = DEFAULT_PLUGINS.filter((p) => p.id !== "cui-heading-1");
    const markdown = convert("<h1>Title</h1>", withoutH1);

    expect(markdown).toBe("Title");
  });

  it("degradeTo chains to another construct's own rule when that rule is still present and active", () => {
    // Unlike the whole-plugin-excluded cases above, here BOTH plugins stay
    // loaded — "special" is simply not authorised, so its own rule exists
    // (proving the chain is followed) but resolves to inactive, and control
    // passes to "fallback"'s rule, which IS active.
    const special = definePlugin({
      id: "special",
      commands: {},
      // Deliberately NOT in `constructs` — this plugin's own construct is
      // never active, forcing every use of its rule through the chain.
      paste: [{ selector: "b", produces: "SpecialBold", degradeTo: "FallbackBold", toMarkdown: () => "SHOULD NOT BE USED" }],
    });
    const fallback = definePlugin({
      id: "fallback",
      commands: {},
      constructs: ["FallbackBold"],
      paste: [{ selector: "strong", produces: "FallbackBold", degradeTo: "plainText", toMarkdown: (_el, c) => `**${c}**` }],
    });

    const markdown = convert("<b>text</b>", [special, fallback]);

    expect(markdown).toBe("**text**");
  });

  it("preserves a fenced code block verbatim, without escaping its contents", () => {
    const markdown = convert("<pre><code>const x = *not* emphasis;</code></pre>");

    expect(markdown).toContain("```\nconst x = *not* emphasis;\n```");
  });

  it("escapes literal markdown-significant characters in plain prose so they aren't mistaken for syntax", () => {
    const markdown = convert("<p>2 * 3 = 6, and [not a link]</p>");

    expect(markdown).toContain("2 \\* 3 = 6");
    expect(markdown).toContain("\\[not a link\\]");
  });

  it("a third-party plugin's own paste rule works with no other declaration", () => {
    const thirdParty = definePlugin({
      id: "third-party-mark",
      commands: {},
      constructs: ["Mark"],
      paste: [{ selector: "mark", produces: "Mark", degradeTo: "plainText", toMarkdown: (_el, c) => `==${c}==` }],
    });
    const markdown = convert("<p>a <mark>highlighted</mark> word</p>", [boldPlugin, thirdParty]);

    expect(markdown).toContain("==highlighted==");
  });
});
