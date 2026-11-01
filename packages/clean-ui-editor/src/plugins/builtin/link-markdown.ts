import { escapeMarkdown } from "../../paste/convert-html";
import { browserUrl } from "../../url-policy";

/**
 * Builds `[label](destination)` / `![alt](destination)` so neither part can break out of
 * the construct (#408).
 *
 * A link's label stays markdown: it is often the selection the link was made from, and a
 * bold or code span in it should survive. Only what can end or bend the label is escaped.
 * An image's alt text is plain text, so every inline marker in it is escaped.
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

/**
 * Escapes each backtick run with no closing run of the same length later in the label. A
 * code span binds tighter than a link, so such a run would pair with a backtick past the
 * `](` and swallow the destination; a paired one is a code span inside the label.
 */
function escapeUnpairedBackticks(label: string): string {
  const runs = [...label.matchAll(/`+/g)];
  const unpaired = new Set<number>();
  for (let i = 0; i < runs.length; i++) {
    const close = runs.findIndex((run, j) => j > i && run[0].length === runs[i]![0].length);
    if (close === -1) unpaired.add(runs[i]!.index);
    else i = close;
  }
  return label.replace(/`+/g, (run, index: number) => (unpaired.has(index) ? run.replace(/`/g, "\\`") : run));
}

/**
 * `[`, `]`, `\` and an unpaired backtick are what can end or bend a label. Every `\` is
 * doubled first, so no backtick is already escaped when the runs are paired.
 */
export function escapeLinkLabel(text: string): string {
  return escapeUnpairedBackticks(text.replace(/[\\[\]]/g, "\\$&"));
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
 * - `<`, `>` and `` ` `` are percent-encoded, as a browser would. Not backslash-escaped:
 *   the editor's own parser (lezer) ends a `<…>` destination at the first `>` regardless,
 *   and a backtick would open a code span reaching past the link.
 * - A space, a control character or an unbalanced parenthesis needs the `<…>` form.
 */
export function linkDestination(url: string): string {
  const clean = browserUrl(url)
    .replace(/\\/g, "\\\\")
    .replace(/[<>`]/g, (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`);
  return /[\x00-\x20\x7f]/.test(clean) || hasUnbalancedParens(clean) ? `<${clean}>` : clean;
}

/** The construct, from a label that is already markdown (a pasted anchor's converted
 * children). Its line breaks are still folded. */
export function markdownLinkFromLabel(labelMarkdown: string, url: string, image = false): string {
  return `${image ? "!" : ""}[${foldLineBreaks(labelMarkdown)}](${linkDestination(url)})`;
}

/** A link from its text, or an image from its alt text. */
export function markdownLink(label: string, url: string, image = false): string {
  return markdownLinkFromLabel(image ? escapeMarkdown(label) : escapeLinkLabel(label), url, image);
}
