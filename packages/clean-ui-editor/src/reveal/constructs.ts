/**
 * Every marker child node's name ends in "Mark" (HeaderMark, EmphasisMark,
 * StrikethroughMark, CodeMark, LinkMark, ListMark, QuoteMark) — verified
 * empirically against `@lezer/markdown`'s actual parse tree (not guessed
 * from docs) — so a single generic rule identifies a construct's markers
 * regardless of which construct it is. Which construct *node names* the
 * reveal layer acts on at all is the active plugin registry's `decorations`
 * policy (FR27/FR29), not a hardcoded list here — see `construct-policy.ts`.
 *
 * `TaskMarker` (the GFM task-list checkbox, e.g. `[ ]`/`[x]`) is the one
 * naming exception — `@lezer/markdown`'s own GFM extension names it
 * "TaskMarker", not "...Mark", breaking the suffix rule for exactly this one
 * node. Confirmed by dumping the real parse tree rather than assumed;
 * without this, a task list's checkbox syntax never hid in WYSIWYG mode.
 */
export function isMarkerNodeName(name: string): boolean {
  return name.endsWith("Mark") || name === "TaskMarker";
}

/**
 * `HeaderMark`, `ListMark`, `TaskMarker` and `QuoteMark` are always followed
 * by exactly one mandatory separating space before the construct's actual
 * content — CommonMark requires it ("# heading", "- item", "1. item",
 * "> quote", "[ ] task"), so it's structural punctuation, not
 * user-meaningful text. Left un-hidden, collapsing only the marker itself
 * leaves that space at full (sometimes heading-sized) width, reading as a
 * stray gap before the content rather than a clean, flush WYSIWYG line.
 * Confirmed against the real parse tree: for each of these four node types,
 * the gap between the marker's `to` and its following content's `from` is
 * always exactly one character. Symmetric inline markers (EmphasisMark,
 * CodeMark, LinkMark, ...) sit directly against their content with no such
 * requirement, so they're deliberately excluded.
 */
export function hasMandatoryTrailingSpace(name: string): boolean {
  return name === "HeaderMark" || name === "ListMark" || name === "TaskMarker" || name === "QuoteMark";
}

/**
 * A `Link`/`Image` construct's destination — `[text](URL)` — is its own
 * node, distinct from `LinkMark` (the `[`, `]`, `(`, `)` punctuation around
 * it), so the generic `isMarkerNodeName` suffix rule never matches it: only
 * the brackets/parens were hiding, leaving the raw URL fully exposed and
 * butted right up against the link text with no separator (e.g.
 * "documenthttps://example.com") once its markers collapsed to zero width.
 * Confirmed against the real parse tree: `URL` sits as a direct child of
 * `Link`/`Image`, sibling to the `LinkMark`s, in exactly the position a
 * reader would expect the whole "(url)" segment to hide alongside them.
 */
export function isHiddenLinkDestination(name: string): boolean {
  return name === "URL";
}
