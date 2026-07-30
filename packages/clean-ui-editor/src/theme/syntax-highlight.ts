import { HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";

/**
 * `cuiMarkdownLanguage` (src/language/markdown-language.ts) configures its
 * parser directly from `@lezer/markdown`'s base `parser` + `GFM`, both of
 * which already carry a `styleTags` mapping baked into their node sets at
 * module load (e.g. `HeaderMark`/`EmphasisMark`/`CodeMark`/`LinkMark` all
 * tag as `tags.processingInstruction`, `StrongEmphasis` as `tags.strong`,
 * GFM's `Strikethrough` as `tags.strikethrough`) — so this only needs to
 * supply colours per tag, not re-derive the node-to-tag mapping.
 */
export const cuiMarkdownHighlightStyle = HighlightStyle.define([
  { tag: [tags.heading1, tags.heading2, tags.heading3, tags.heading4, tags.heading5, tags.heading6], color: "var(--cui-primary)", fontWeight: "700" },
  { tag: tags.strong, color: "var(--cui-text-emphasis)", fontWeight: "700" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.strikethrough, color: "var(--cui-text-tertiary)", textDecoration: "line-through" },
  { tag: [tags.link, tags.url], color: "var(--cui-text-link)" },
  { tag: tags.monospace, color: "var(--cui-text-code)", fontFamily: "var(--cui-font-mono)" },
  { tag: tags.quote, color: "var(--cui-text-secondary)", fontStyle: "italic" },
  // Marker characters (**, *, `, ~~, #, [ ] ( ), >, -/1.) — subtle even when
  // revealed, so they read as secondary to the content they delimit.
  { tag: tags.processingInstruction, color: "var(--cui-text-tertiary)" },
]);
