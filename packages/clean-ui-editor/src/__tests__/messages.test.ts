import { describe, it, expect } from "vitest";
import {
  defaultMarkdownEditorMessages,
  mergeMarkdownEditorMessages,
  resolveCommandLabel,
  pickUrlDialogMessages,
} from "../messages";

describe("mergeMarkdownEditorMessages", () => {
  it("returns the English defaults with no override", () => {
    expect(mergeMarkdownEditorMessages(undefined)).toBe(defaultMarkdownEditorMessages);
  });

  it("overlays only the supplied fields, leaving everything else at its default", () => {
    const merged = mergeMarkdownEditorMessages({ toolbarBold: "Gras" });
    expect(merged.toolbarBold).toBe("Gras");
    expect(merged.toolbarItalic).toBe(defaultMarkdownEditorMessages.toolbarItalic);
    expect(merged.modeToggleSwitchToSource).toBe(defaultMarkdownEditorMessages.modeToggleSwitchToSource);
  });

  it("overrides a function-valued field wholesale", () => {
    const custom = (overage: number, limit: number) => `${overage}/${limit}`;
    const merged = mergeMarkdownEditorMessages({ maxLengthExceeded: custom });
    expect(merged.maxLengthExceeded(3, 10)).toBe("3/10");
  });
});

describe("resolveCommandLabel", () => {
  it("resolves a built-in command id to its toolbar<Id> catalog entry", () => {
    expect(resolveCommandLabel(defaultMarkdownEditorMessages, "bold", "fallback")).toBe("Bold");
    expect(resolveCommandLabel(defaultMarkdownEditorMessages, "heading1", "fallback")).toBe("Heading 1");
    expect(resolveCommandLabel(defaultMarkdownEditorMessages, "bulletedList", "fallback")).toBe("Bulleted list");
  });

  it("uses the override when the catalog was customized", () => {
    const custom = mergeMarkdownEditorMessages({ toolbarBold: "Gras" });
    expect(resolveCommandLabel(custom, "bold", "fallback")).toBe("Gras");
  });

  it("falls back to the plugin's own label for a third-party command id", () => {
    expect(resolveCommandLabel(defaultMarkdownEditorMessages, "myCustomThing", "My Custom Thing")).toBe("My Custom Thing");
  });
});

describe("pickUrlDialogMessages", () => {
  it.each([
    ["link", { title: "Insert link", urlLabel: "URL", urlPlaceholder: "https://example.com", textLabel: "Text", textPlaceholder: "Link text" }],
    ["image", { title: "Insert image", urlLabel: "Image URL", urlPlaceholder: "https://example.com/image.png", textLabel: "Alt text", textPlaceholder: "Describes the image" }],
  ] as const)("picks the %s dialog's strings from the flat catalog", (kind, distinct) => {
    expect(pickUrlDialogMessages(defaultMarkdownEditorMessages, kind)).toEqual({
      ...distinct,
      cancel: "Cancel",
      insert: "Insert",
      urlRequired: "A URL is required.",
      urlSchemeNotAllowed: "This URL scheme isn't allowed.",
    });
  });

  it("reads the kind's own keys for the distinct strings and the shared urlDialog* keys for the rest", () => {
    // Every dialog key here holds its own name, so a picker reading the wrong key shows.
    const own = Object.fromEntries(
      Object.keys(defaultMarkdownEditorMessages)
        .filter((k) => /^(link|image|url)Dialog/.test(k))
        .map((k) => [k, k]),
    );
    const catalog = mergeMarkdownEditorMessages(own);
    const shared = {
      cancel: "urlDialogCancel",
      insert: "urlDialogInsert",
      urlRequired: "urlDialogUrlRequired",
      urlSchemeNotAllowed: "urlDialogUrlSchemeNotAllowed",
    };
    expect(pickUrlDialogMessages(catalog, "link")).toEqual({
      title: "linkDialogTitle",
      urlLabel: "linkDialogUrlLabel",
      urlPlaceholder: "linkDialogUrlPlaceholder",
      textLabel: "linkDialogTextLabel",
      textPlaceholder: "linkDialogTextPlaceholder",
      ...shared,
    });
    expect(pickUrlDialogMessages(catalog, "image")).toEqual({
      title: "imageDialogTitle",
      urlLabel: "imageDialogUrlLabel",
      urlPlaceholder: "imageDialogUrlPlaceholder",
      textLabel: "imageDialogAltLabel",
      textPlaceholder: "imageDialogAltPlaceholder",
      ...shared,
    });
  });

  it("no longer carries a per-kind copy of the shared strings", () => {
    const keys = Object.keys(defaultMarkdownEditorMessages);
    for (const kind of ["link", "image"]) {
      for (const name of ["Cancel", "Insert", "UrlRequired", "UrlSchemeNotAllowed"]) expect(keys).not.toContain(`${kind}Dialog${name}`);
    }
  });
});

