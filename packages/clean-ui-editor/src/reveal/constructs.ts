/**
 * Every marker child node's name ends in "Mark" (HeaderMark, EmphasisMark,
 * StrikethroughMark, CodeMark, LinkMark) — verified empirically against
 * `@lezer/markdown`'s actual parse tree (not guessed from docs) — so a
 * single generic rule identifies a construct's markers regardless of which
 * construct it is. Which construct *node names* the reveal layer acts on at
 * all is the active plugin registry's `decorations` policy (FR27/FR29), not
 * a hardcoded list here — see `construct-policy.ts`.
 */
export function isMarkerNodeName(name: string): boolean {
  return name.endsWith("Mark");
}
