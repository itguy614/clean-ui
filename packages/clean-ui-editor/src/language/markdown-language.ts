import { NodeProp } from "@lezer/common";
import { GFM, parser as baseParser } from "@lezer/markdown";
import {
  Language,
  defineLanguageFacet,
  languageDataProp,
  foldNodeProp,
  indentNodeProp,
} from "@codemirror/language";

/**
 * The markdown language, built directly from `@lezer/markdown` + `GFM` —
 * deliberately NOT `@codemirror/lang-markdown`'s `markdown()`/`markdownLanguage`,
 * whose static dependency on `@codemirror/lang-html` (for embedded-HTML
 * support this editor doesn't use) costs 70 kB gzip (NFR1a). This is the
 * same construction `@codemirror/lang-markdown` itself uses internally to
 * build its own `commonmarkLanguage` — reimplemented here starting from the
 * GFM-configured parser instead, so the HTML import is never reached at all.
 */

const data = defineLanguageFacet({ commentTokens: { block: { open: "<!--", close: "-->" } } });

const headingProp = new NodeProp<number>();

function headingLevel(type: { name: string }): number | undefined {
  const match = /^(?:ATX|Setext)Heading(\d)$/.exec(type.name);
  return match ? Number(match[1]) : undefined;
}

function isList(type: { name: string }): boolean {
  return type.name === "OrderedList" || type.name === "BulletList";
}

const configuredParser = baseParser.configure([
  GFM,
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
