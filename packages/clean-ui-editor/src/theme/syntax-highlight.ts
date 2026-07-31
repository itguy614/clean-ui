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
  // Individual entries (not one shared [] of all six heading tags) so each
  // level gets clean-ui's own heading scale — the same --cui-font-size-h1
  // through h6 tokens apps/docs's real <h1>-<h6> elements use — rather than
  // every heading level looking visually identical but for bold+color.
  { tag: tags.heading1, color: "var(--cui-primary)", fontWeight: "700", fontSize: "var(--cui-font-size-h1)" },
  { tag: tags.heading2, color: "var(--cui-primary)", fontWeight: "700", fontSize: "var(--cui-font-size-h2)" },
  { tag: tags.heading3, color: "var(--cui-primary)", fontWeight: "700", fontSize: "var(--cui-font-size-h3)" },
  { tag: tags.heading4, color: "var(--cui-primary)", fontWeight: "700", fontSize: "var(--cui-font-size-h4)" },
  { tag: tags.heading5, color: "var(--cui-primary)", fontWeight: "700", fontSize: "var(--cui-font-size-h5)" },
  { tag: tags.heading6, color: "var(--cui-primary)", fontWeight: "700", fontSize: "var(--cui-font-size-h6)" },
  { tag: tags.strong, color: "var(--cui-text-emphasis)", fontWeight: "700" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.strikethrough, color: "var(--cui-text-tertiary)", textDecoration: "line-through" },
  { tag: [tags.link, tags.url], color: "var(--cui-text-link)" },
  // `class` (not just inline style props) gives editor.css a stable,
  // guaranteed-present hook — CodeMirror's own auto-generated class for
  // every other entry above is an unstable, build-specific hash not safe to
  // reference from hand-written CSS. Needed so code can be pinned to
  // monospace regardless of which font-family the current mode applies to
  // everything else (see editor.css's mode-dependent font-family rules).
  { tag: tags.monospace, class: "cui-md-code", color: "var(--cui-text-code)", fontFamily: "var(--cui-font-mono)" },
  { tag: tags.quote, color: "var(--cui-text-secondary)", fontStyle: "italic" },
  // Marker characters (**, *, `, ~~, #, [ ] ( ), >, -/1.) — subtle even when
  // revealed, so they read as secondary to the content they delimit.
  { tag: tags.processingInstruction, color: "var(--cui-text-tertiary)" },
]);
