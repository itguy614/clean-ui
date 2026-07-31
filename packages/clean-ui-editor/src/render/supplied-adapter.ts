import { markAsTrustedHtml, type MarkdownRenderAdapter } from "./contract";
import { serializeMarkdownToHtml } from "./serialize";

export interface CreateMarkdownRenderAdapterOptions {
  /**
   * Passes `HTMLBlock`/`HTMLTag` source through `sanitize` instead of
   * escaping it. Refused (throws) when set without `sanitize` — FR39
   * deliberately does not fall back to "escape anyway" here, since that
   * would silently hide a consumer's misconfiguration rather than surface
   * it at the one point (adapter construction) where it's actionable.
   */
  allowRawHtml?: boolean;
  /**
   * Required whenever `allowRawHtml` is true. This library bundles no
   * sanitiser (FR39) — supply your own (e.g. DOMPurify) so raw HTML becomes
   * this library's responsibility only insofar as escaping it by default;
   * choosing to allow it is the consumer's own security decision.
   */
  sanitize?: (html: string) => string;
}

/**
 * FR38: a ready-made adapter for applications with no renderer of their
 * own. Escapes raw HTML by construction (no sanitiser needed) unless
 * `allowRawHtml` is explicitly paired with a `sanitize` function. DOM-free —
 * runs identically under SSR/node (task 6.1.3's own test asserts this).
 */
export function createMarkdownRenderAdapter(options: CreateMarkdownRenderAdapterOptions = {}): MarkdownRenderAdapter {
  if (options.allowRawHtml && !options.sanitize) {
    throw new Error(
      "createMarkdownRenderAdapter: allowRawHtml requires a sanitize function — this library does not bundle one. " +
        "Either omit allowRawHtml (raw HTML is escaped by default) or supply sanitize.",
    );
  }
  return (markdown) =>
    markAsTrustedHtml(serializeMarkdownToHtml(markdown, { allowRawHtml: options.allowRawHtml, sanitize: options.sanitize }));
}
