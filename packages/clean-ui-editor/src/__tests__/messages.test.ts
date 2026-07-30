import { describe, it, expect } from "vitest";
import {
  defaultMarkdownEditorMessages,
  mergeMarkdownEditorMessages,
  resolveCommandLabel,
  pickLinkDialogMessages,
  pickImageDialogMessages,
} from "../messages";

describe("mergeMarkdownEditorMessages", () => {
  it("returns the English defaults with no override", () => {
    expect(mergeMarkdownEditorMessages(undefined)).toBe(defaultMarkdownEditorMessages);
  });

  it("overlays only the supplied fields, leaving everything else at its default", () => {
    const merged = mergeMarkdownEditorMessages({ toolbarBold: "Gras" });
    expect(merged.toolbarBold).toBe("Gras");
    expect(merged.toolbarItalic).toBe(defaultMarkdownEditorMessages.toolbarItalic);
    expect(merged.modeToggleFormatted).toBe(defaultMarkdownEditorMessages.modeToggleFormatted);
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

describe("pickLinkDialogMessages / pickImageDialogMessages", () => {
  it("extracts the flat linkDialog* fields into the dialog's own shape", () => {
    const picked = pickLinkDialogMessages(defaultMarkdownEditorMessages);
    expect(picked).toEqual({
      title: "Insert link",
      urlLabel: "URL",
      urlPlaceholder: "https://example.com",
      textLabel: "Text",
      textPlaceholder: "Link text",
      cancel: "Cancel",
      insert: "Insert",
      urlRequired: "A URL is required.",
      urlSchemeNotAllowed: "This URL scheme isn't allowed.",
    });
  });

  it("extracts the flat imageDialog* fields into the dialog's own shape", () => {
    const picked = pickImageDialogMessages(defaultMarkdownEditorMessages);
    expect(picked).toEqual({
      title: "Insert image",
      urlLabel: "Image URL",
      urlPlaceholder: "https://example.com/image.png",
      altLabel: "Alt text",
      altPlaceholder: "Describes the image",
      cancel: "Cancel",
      insert: "Insert",
      urlRequired: "A URL is required.",
      urlSchemeNotAllowed: "This URL scheme isn't allowed.",
    });
  });
});
