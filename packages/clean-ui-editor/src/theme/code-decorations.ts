import { RangeSetBuilder } from "@codemirror/state";
import { Decoration, EditorView, ViewPlugin, type DecorationSet, type ViewUpdate } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";

/**
 * Background styling for code, distinct from `cuiMarkdownHighlightStyle`'s
 * `tags.monospace` entry (font/color only, and shared by both InlineCode
 * and FencedCode's CodeText — the grammar's own `styleTags` maps both to
 * the same tag, so it can't tell them apart). A background needs different
 * shapes for the two: `InlineCode` gets a "pill" mark decoration around the
 * whole construct (markers included — harmless, since a hidden marker
 * contributes no width); `FencedCode` needs a background spanning every
 * line of the block, which a mark decoration can't do (it only paints text
 * ranges) — hence a `Decoration.line()` per line instead. Unconditional,
 * like the highlight style's own monospace/color treatment — construct
 * exclusion (FR27) affects marker-reveal and toolbar/keymap/paste
 * availability, not this package's baseline visual styling for a
 * recognised syntax node.
 */
const inlineCodeDecoration = Decoration.mark({ class: "cui-md-inline-code" });
const codeBlockLineDecoration = Decoration.line({ class: "cui-md-code-block-line" });
const codeBlockFirstLineDecoration = Decoration.line({ class: "cui-md-code-block-line cui-md-code-block-line--first" });
const codeBlockLastLineDecoration = Decoration.line({ class: "cui-md-code-block-line cui-md-code-block-line--last" });

function computeCodeDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();

  for (const { from, to } of view.visibleRanges) {
    syntaxTree(view.state).iterate({
      from,
      to,
      enter: (ref) => {
        if (ref.name === "InlineCode") {
          builder.add(ref.from, ref.to, inlineCodeDecoration);
          return;
        }
        if (ref.name !== "FencedCode") return;

        // A fenced code block is always at least two lines (opening and
        // closing fence on their own lines), so startLine < endLine holds
        // in practice — first/last never collide.
        const startLine = view.state.doc.lineAt(ref.from).number;
        const endLine = view.state.doc.lineAt(ref.to).number;
        for (let n = startLine; n <= endLine; n++) {
          const line = view.state.doc.line(n);
          const decoration =
            n === startLine ? codeBlockFirstLineDecoration : n === endLine ? codeBlockLastLineDecoration : codeBlockLineDecoration;
          builder.add(line.from, line.from, decoration);
        }
      },
    });
  }

  return builder.finish();
}

export const codeBackgroundPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = computeCodeDecorations(view);
    }
    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = computeCodeDecorations(update.view);
      }
    }
  },
  { decorations: (value) => value.decorations },
);
