import { RangeSetBuilder } from "@codemirror/state";
import { Decoration, EditorView, ViewPlugin, type DecorationSet, type ViewUpdate } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { granularityField, setGranularityEffect } from "./granularity";
import { activeConstructsField, setActiveConstructsEffect } from "./construct-policy";
import { isMarkerNodeName } from "./constructs";

/**
 * Visually hides via zero-size styling — never `Decoration.replace()`, which
 * removes characters from the DOM and so from the accessibility tree (FR9).
 * See src/styles/editor.css for `.cui-md-marker-hidden`.
 */
const hiddenMarkerDecoration = Decoration.mark({ class: "cui-md-marker-hidden" });

function isRevealed(nodeFrom: number, nodeTo: number, view: EditorView): boolean {
  const { from: selFrom, to: selTo, head } = view.state.selection.main;
  if (view.state.field(granularityField) === "line") {
    const line = view.state.doc.lineAt(head);
    return nodeFrom <= line.to && nodeTo >= line.from;
  }
  return selFrom <= nodeTo && selTo >= nodeFrom;
}

function computeDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const activeConstructs = view.state.field(activeConstructsField);

  for (const { from, to } of view.visibleRanges) {
    syntaxTree(view.state).iterate({
      from,
      to,
      enter: (ref) => {
        if (!activeConstructs.has(ref.name)) return;
        if (isRevealed(ref.from, ref.to, view)) return;

        let child = ref.node.firstChild;
        while (child) {
          if (isMarkerNodeName(child.name)) {
            builder.add(child.from, child.to, hiddenMarkerDecoration);
          }
          child = child.nextSibling;
        }
      },
    });
  }

  return builder.finish();
}

/**
 * FR7/FR10/FR10a: hides supported constructs' markers unless the
 * selection/caret is inside (or, at line granularity, on the same line),
 * recomputing on document, selection, viewport and granularity changes — a
 * granularity change alone sets none of the `ViewUpdate` flags, which is
 * exactly the bug the prototype spike caught. Suspended entirely while an
 * IME composition is in progress (FR10): touching the DOM mid-composition
 * can displace the candidate window or abort it outright.
 */
export const revealPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = computeDecorations(view);
    }
    update(update: ViewUpdate) {
      if (update.view.compositionStarted) return;

      const granularityChanged = update.transactions.some((tr) => tr.effects.some((effect) => effect.is(setGranularityEffect)));
      const constructsChanged = update.transactions.some((tr) => tr.effects.some((effect) => effect.is(setActiveConstructsEffect)));
      if (update.docChanged || update.viewportChanged || update.selectionSet || granularityChanged || constructsChanged) {
        this.decorations = computeDecorations(update.view);
      }
    }
  },
  { decorations: (value) => value.decorations },
);
