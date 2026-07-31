import { NodeProp } from "@lezer/common";
import { GFM, parser as baseParser } from "@lezer/markdown";
import { Language, languageDataProp, foldNodeProp, indentNodeProp } from "@codemirror/language";
import { markdownLanguage } from "@codemirror/lang-markdown";

/**
 * The markdown language, built directly from `@lezer/markdown` + `GFM` —
 * deliberately NOT `@codemirror/lang-markdown`'s `markdown()` factory, whose
 * static dependency on `@codemirror/lang-html` (for embedded-HTML support
 * this editor doesn't use) costs 70 kB gzip (NFR1a). This is the same
 * construction `@codemirror/lang-markdown` itself uses internally to build
 * its own `commonmarkLanguage` — reimplemented here starting from the
 * GFM-configured parser instead, so the HTML import is never reached at all.
 *
 * `data` reuses `markdownLanguage.data` (imported directly, not through
 * `markdown()`, so this alone doesn't reach the HTML dependency either —
 * `markdownLanguage`'s own construction is plain `@lezer/markdown` + GFM,
 * exactly like this file's) rather than defining a new facet, because
 * `@codemirror/lang-markdown`'s exported `insertNewlineContinueMarkup` /
 * `deleteMarkupBackward` (task 4.2.1) gate on `markdownLanguage.isActiveAt()`,
 * which compares the parsed document's language-data facet by *identity*
 * against that one specific facet object. A separately-`defineLanguageFacet`d
 * facet — however identical in content — always fails that check, silently
 * turning both commands into no-ops. Confirmed by writing the list-typing
 * tests first and watching them fail before this fix.
 */
const data = markdownLanguage.data;

const headingProp = new NodeProp<number>();

function headingLevel(type: { name: string }): number | undefined {
  const match = /^(?:ATX|Setext)Heading(\d)$/.exec(type.name);
  return match ? Number(match[1]) : undefined;
}

function isList(type: { name: string }): boolean {
  return type.name === "OrderedList" || type.name === "BulletList";
}

/**
 * The GFM-configured parser with no CodeMirror-specific props — a plain
 * `@lezer/markdown` `MarkdownParser`, reused as-is by the render subpath
 * (`src/render/`) so a document parses identically whether it's being
 * edited or rendered to HTML, with no second markdown-parser dependency and
 * no `@codemirror/*` import (NFR1a's tree-shaking discipline extends to that
 * subpath, which must also stay DOM-free — see task 6.1.3).
 */
export const gfmParser = baseParser.configure([GFM]);

const configuredParser = gfmParser.configure([
  {
    props: [
      foldNodeProp.add((type) =>
        !type.is("Block") || type.is("Document") || headingLevel(type) != null || isList(type)
          ? undefined
          : (tree, state) => ({ from: state.doc.lineAt(tree.from).to, to: tree.to }),
      ),
      headingProp.add(headingLevel),
      indentNodeProp.add({ Document: () => null }),
      languageDataProp.add({ Document: data }),
    ],
  },
]);

/** GFM markdown as a CodeMirror `Language`, with no embedded-HTML support. */
export const cuiMarkdownLanguage = new Language(data, configuredParser, [], "markdown");
