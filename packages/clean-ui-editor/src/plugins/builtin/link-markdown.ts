/**
 * Builds `[label](destination)` / `![alt](destination)` from plain text and a URL, so
 * neither can break out of the construct (#408).
 *
 * Line breaks: a link label may span lines in CommonMark, but a blank line ends the
 * paragraph and the link with it, so the label's are folded into a single space. A URL
 * can't hold one at all, and the WHATWG URL parser strips tabs and line breaks from
 * whatever it's given, so the destination's are dropped: the result is the URL a browser
 * would have followed.
 */

/** A run of whitespace holding a line break: one space. */
export function foldLineBreaks(text: string): string {
  return text.replace(/\s*[\r\n]\s*/g, " ");
}

/** `[`, `]` and `\` are what can end or bend a label; everything else stays markdown. */
export function escapeLinkLabel(text: string): string {
  return foldLineBreaks(text).replace(/[\\[\]]/g, "\\$&");
}

function hasUnbalancedParens(url: string): boolean {
  let depth = 0;
  for (const ch of url) {
    if (ch === "(") depth++;
    else if (ch === ")" && --depth < 0) return true;
  }
  return depth !== 0;
}

/**
 * The destination as CommonMark reads back the same URL.
 *
 * - `\` is doubled, which is always a literal backslash; the parentheses are then never
 *   escaped, so counting them is enough.
 * - `<` and `>` are percent-encoded, as a browser would. Not backslash-escaped: the
 *   editor's own parser (lezer) ends a `<…>` destination at the first `>` regardless.
 * - A space, a control character or an unbalanced parenthesis needs the `<…>` form.
 */
export function linkDestination(url: string): string {
  const clean = url
    .replace(/[\t\r\n]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/</g, "%3C")
    .replace(/>/g, "%3E");
  return /[\x00-\x20\x7f]/.test(clean) || hasUnbalancedParens(clean) ? `<${clean}>` : clean;
}

/** The construct, from a label that is already markdown (a pasted anchor's converted children). */
export function markdownLinkFromLabel(labelMarkdown: string, url: string, image = false): string {
  return `${image ? "!" : ""}[${labelMarkdown}](${linkDestination(url)})`;
}

/** The construct, from a plain-text label. */
export function markdownLink(label: string, url: string, image = false): string {
  return markdownLinkFromLabel(escapeLinkLabel(label), url, image);
}
