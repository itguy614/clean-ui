import { describe, it, expect } from "vitest";
import { escapeLinkLabel, linkDestination, markdownLink } from "../link-markdown";
import { serializeMarkdownToHtml } from "../../../render/serialize";

// #408: what the link and image dialogs insert. Each case also goes through the editor's
// own serializer, which must read back the label and URL that went in.
describe("markdownLink", () => {
  it.each([
    ["a]b", "[a\\]b]"],
    ["a[b", "[a\\[b]"],
    ["a\\b", "[a\\\\b]"],
    ["*kept*", "[*kept*]"],
  ])("escapes the label %j", (label, expected) => {
    expect(markdownLink(label, "u")).toBe(`${expected}(u)`);
  });

  it("folds a label's line breaks into one space, so a blank line can't end the link", () => {
    expect(escapeLinkLabel("one\n\n  two\r\nthree")).toBe("one two three");
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

    it("reads `<` and `>` back percent-encoded", () => {
      const html = serializeMarkdownToHtml(markdownLink("x", "https://x.com/?q=<a>", image));
      expect(html).toContain('"https://x.com/?q=%3Ca%3E"');
    });
  });
});
