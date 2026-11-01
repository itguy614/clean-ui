import { describe, it, expect } from "vitest";
import { linkDestination, markdownLink, markdownLinkFromLabel } from "../link-markdown";
import { serializeMarkdownToHtml } from "../../../render/serialize";

// #408: what the link and image dialogs insert. Each case also goes through the editor's
// own serializer, which must read back the label and URL that went in.
describe("markdownLink", () => {
  it.each([
    ["a]b", "[a\\]b]"],
    ["a[b", "[a\\[b]"],
    ["a\\b", "[a\\\\b]"],
    ["*kept*", "[*kept*]"],
    ["`code` kept", "[`code` kept]"],
    ["a`b", "[a\\`b]"],
    ["``a`b`` `c", "[``a`b`` \\`c]"],
  ])("escapes the link text %j", (label, expected) => {
    expect(markdownLink(label, "u")).toBe(`${expected}(u)`);
  });

  it("escapes every inline marker in an image's alt text, which is plain text", () => {
    expect(markdownLink("2*3*4 `x` [y]", "u", true)).toBe("![2\\*3\\*4 \\`x\\` \\[y\\]](u)");
  });

  it.each([false, true])("folds the label's line breaks into one space (image: %s)", (image) => {
    expect(markdownLink("one\n\n  two\r\nthree", "u", image)).toBe(`${image ? "!" : ""}[one two three](u)`);
  });

  it("folds the line breaks of a label that is already markdown (a pasted anchor's)", () => {
    expect(markdownLinkFromLabel("**foo**\n\nbar", "https://x")).toBe("[**foo** bar](https://x)");
  });

  it("an unpaired backtick can't take the destination into a code span", () => {
    expect(serializeMarkdownToHtml(markdownLink("`", "http://a`b"))).toBe('<p><a href="http://a%60b">`</a></p>\n');
  });

  it.each([
    ["https://x.com/a b", "<https://x.com/a b>"],
    ["https://x.com/a(b", "<https://x.com/a(b>"],
    ["https://x.com/a)b", "<https://x.com/a)b>"],
    ["https://x.com/a)(b", "<https://x.com/a)(b>"],
    ["https://en.wikipedia.org/wiki/Foo_(bar)", "https://en.wikipedia.org/wiki/Foo_(bar)"],
    ["https://x.com/?q=<a>", "https://x.com/?q=%3Ca%3E"],
    ["https://x.com/a\\b", "https://x.com/a\\\\b"],
    ["https://x.com/a\\)", "<https://x.com/a\\\\)>"],
  ])("makes the destination %j safe", (url, expected) => {
    expect(linkDestination(url)).toBe(expected);
  });

  it("drops a URL's line breaks and tabs, as a browser does", () => {
    expect(linkDestination("https://x.com/\n\ta\r\nb")).toBe("https://x.com/ab");
  });

  describe.each([false, true])("read back by the serializer (image: %s)", (image) => {
    it.each([
      ["a]b [c] \\d", "https://x.com/a b"],
      ["Foo", "https://en.wikipedia.org/wiki/Foo_(bar)"],
      ["x", "https://x.com/a(b"],
      ["x", "https://x.com/a)b"],
      ["x", "https://x.com/a\\b"],
      ["x", "https://x.com/a\\)"],
    ])("%j → %j", (label, url) => {
      const html = serializeMarkdownToHtml(markdownLink(label, url, image));
      expect(html).toBe(
        image ? `<p><img src="${url}" alt="${label}"></p>\n` : `<p><a href="${url}">${label}</a></p>\n`,
      );
    });

    it("reads `<`, `>` and `` ` `` back percent-encoded", () => {
      const html = serializeMarkdownToHtml(markdownLink("x", "https://x.com/?q=<a>`", image));
      expect(html).toContain('"https://x.com/?q=%3Ca%3E%60"');
    });
  });

  it("reads an image's alt text back as it was typed", () => {
    expect(serializeMarkdownToHtml(markdownLink("2*3*4 `x` _y_", "a.png", true))).toBe(
      '<p><img src="a.png" alt="2*3*4 `x` _y_"></p>\n',
    );
  });
});
