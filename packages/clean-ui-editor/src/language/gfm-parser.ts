import { GFM, parser as baseParser } from "@lezer/markdown";

/**
 * The GFM-configured parser with no CodeMirror-specific props — a plain
 * `@lezer/markdown` `MarkdownParser`, shared by the editor's language
 * (`markdown-language.ts`, which adds CodeMirror's fold/indent/language-data
 * props on top) and the render subpath (`src/render/`), so a document parses
 * identically whether it's being edited or rendered to HTML, with no second
 * markdown-parser dependency.
 *
 * It lives in its own module, importing nothing but `@lezer/markdown`, because
 * the render subpath must reach no `@codemirror/*` code (and stay DOM-free —
 * task 6.1.3). Exported from `markdown-language.ts` it could not: that
 * module's top-level `new Language(...)` is a side effect Rollup keeps, which
 * retains the whole CodeMirror stack for every importer, pure annotation or
 * not (#225). `scripts/check-render-subpath-isolation.mjs` enforces this
 * against the built output.
 */
export const gfmParser = baseParser.configure([GFM]);
