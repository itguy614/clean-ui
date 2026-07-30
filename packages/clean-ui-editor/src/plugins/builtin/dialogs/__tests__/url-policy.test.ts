import { describe, it, expect } from "vitest";
import { isAllowedUrl } from "../url-policy";

describe("isAllowedUrl", () => {
  it.each(["http://example.com", "https://example.com/page", "mailto:person@example.com"])(
    "allows %s",
    (url) => {
      expect(isAllowedUrl(url)).toBe(true);
    },
  );

  it.each(["/docs/page", "page.md", "../relative/path", "#anchor", "?query=1"])(
    "allows the relative/schemeless URL %s",
    (url) => {
      expect(isAllowedUrl(url)).toBe(true);
    },
  );

  it.each(["javascript:alert(1)", "JavaScript:alert(1)", "data:text/html,<script>alert(1)</script>", "vbscript:msgbox(1)"])(
    "rejects %s",
    (url) => {
      expect(isAllowedUrl(url)).toBe(false);
    },
  );
});
