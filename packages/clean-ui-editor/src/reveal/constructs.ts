/**
 * The constructs whose markers this reveal layer hides/reveals (FR7, FR11's
 * list: emphasis, strong, inline code, heading, link, strikethrough).
 * Verified empirically against `@lezer/markdown`'s actual parse tree (not
 * guessed from docs) — every marker child node's name ends in "Mark"
 * (HeaderMark, EmphasisMark, StrikethroughMark, CodeMark, LinkMark), so a
 * single generic rule covers all of them without a per-construct mapping of
 * which children are markers.
 */
export const SUPPORTED_CONSTRUCT_NODES: ReadonlySet<string> = new Set([
  "Emphasis",
  "StrongEmphasis",
  "InlineCode",
  "Strikethrough",
  "Link",
  "ATXHeading1",
  "ATXHeading2",
  "ATXHeading3",
  "ATXHeading4",
  "ATXHeading5",
  "ATXHeading6",
]);

export function isMarkerNodeName(name: string): boolean {
  return name.endsWith("Mark");
}
