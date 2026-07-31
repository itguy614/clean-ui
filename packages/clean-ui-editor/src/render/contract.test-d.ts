import { test, expectTypeOf } from "vitest";
import { markAsTrustedHtml, type MarkdownRenderAdapter, type TrustedHtml } from "./contract";

test("a plain string does not satisfy MarkdownRenderAdapter's return type", () => {
  // @ts-expect-error a bare string is not TrustedHtml — trust must be marked explicitly
  const plainStringAdapter: MarkdownRenderAdapter = (markdown: string) => markdown;
  void plainStringAdapter;
});

test("markAsTrustedHtml is the only way to produce a TrustedHtml value", () => {
  const trusted: TrustedHtml = markAsTrustedHtml("<p>hi</p>");
  expectTypeOf(trusted).toEqualTypeOf<TrustedHtml>();

  // @ts-expect-error a raw string literal isn't assignable without the helper
  const wrong: TrustedHtml = "<p>hi</p>";
  void wrong;
});

test("a correctly-marked adapter type-checks", () => {
  const adapter: MarkdownRenderAdapter = (markdown) => markAsTrustedHtml(`<p>${markdown}</p>`);
  expectTypeOf(adapter).toEqualTypeOf<MarkdownRenderAdapter>();
});
