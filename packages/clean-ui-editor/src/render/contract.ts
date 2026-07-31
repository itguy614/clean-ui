/**
 * FR37/task 6.1.1: the adapter contract, kept separate from the render
 * subpath's actual implementation (`supplied-adapter.ts`) so the core entry
 * (`src/index.ts`) can export just this — types and a marking helper, no
 * renderer, no sanitiser — without importing anything FR36 forbids. Phase
 * 1.5's split preview is documented to consume this exact same contract, so
 * a future core feature can build against it without reaching into `/render`.
 *
 * `TrustedHtml` is branded with a symbol that never leaves this module,
 * so a plain `string` does not satisfy it — only `markAsTrustedHtml` can
 * produce one, making the type itself the place a caller asserts "I checked
 * this HTML is safe to inject."
 */
declare const trustedHtmlBrand: unique symbol;

export type TrustedHtml = string & { readonly [trustedHtmlBrand]: true };

/**
 * The one way to produce a `TrustedHtml` value. Named for what it does, not
 * what it checks — this performs no validation itself; calling it is the
 * caller's assertion that the string is safe to inject as-is.
 */
export function markAsTrustedHtml(html: string): TrustedHtml {
  return html as TrustedHtml;
}

/**
 * Synchronous in v1 (FR37): widening to `Promise<TrustedHtml>` later is
 * additive, narrowing would be a breaking change. A worked example using a
 * third-party renderer:
 *
 * ```ts
 * import { markAsTrustedHtml, type MarkdownRenderAdapter } from "@itguy614/clean-ui-editor/render";
 * import { Marked } from "marked";
 * import DOMPurify from "dompurify";
 *
 * const marked = new Marked();
 * const thirdPartyAdapter: MarkdownRenderAdapter = (markdown) =>
 *   markAsTrustedHtml(DOMPurify.sanitize(marked.parse(markdown, { async: false })));
 * ```
 */
export type MarkdownRenderAdapter = (markdown: string) => TrustedHtml;
