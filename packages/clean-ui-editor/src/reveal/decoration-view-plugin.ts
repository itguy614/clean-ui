import type { StateEffectType } from "@codemirror/state";
import { ViewPlugin, type DecorationSet, type EditorView, type ViewUpdate } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";

export interface DecorationTriggers {
  /** Effects whose presence in any transaction forces a rebuild — state the
   * decorations read that `ViewUpdate`'s own flags can't see (granularity,
   * the active construct set, a focus change). `any` because `map` makes
   * `StateEffectType<T>` invariant: no narrower element type accepts them all. */
  effects?: readonly StateEffectType<any>[];
  /** Also rebuild when the selection moves. Off for decorations that don't
   * depend on where the cursor is. */
  selection?: boolean;
  /** Skip every update while an IME composition is in progress — touching
   * the DOM mid-composition can displace the candidate window or abort it. */
  pauseDuringComposition?: boolean;
}

/** True when this update carries a different syntax tree, including one a
 * background parse extended with nothing else changing (#256). */
function syntaxTreeChanged(update: ViewUpdate): boolean {
  return syntaxTree(update.startState) !== syntaxTree(update.state);
}

/**
 * A `ViewPlugin` that holds one `DecorationSet` built by `compute`, rebuilt
 * whenever the document, the viewport, or the syntax tree changes, plus the
 * caller's own triggers. The trigger list is a parameter, not a constant:
 * `codeBackgroundPlugin` depends on none of the reveal effects, and
 * `revealPlugin` and `listBulletPlugin` must share theirs exactly, or a
 * list's bullet widget lags behind its marker's hide/reveal.
 *
 * The syntax-tree check is CodeMirror's pattern for tree-driven decorations
 * (#256): the parser works within a time budget and finishes a long
 * document in the background, delivering the larger tree in an update with
 * none of the other flags set. Without it, constructs past the first parse
 * chunk stay undecorated until the next keystroke or scroll.
 */
export function decorationViewPlugin(
  compute: (view: EditorView) => DecorationSet,
  { effects = [], selection = false, pauseDuringComposition = false }: DecorationTriggers = {},
) {
  const hasTriggerEffect = (update: ViewUpdate) =>
    update.transactions.some((tr) => tr.effects.some((effect) => effects.some((type) => effect.is(type))));

  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = compute(view);
      }
      update(update: ViewUpdate) {
        if (pauseDuringComposition && update.view.compositionStarted) return;
        if (
          update.docChanged ||
          update.viewportChanged ||
          (selection && update.selectionSet) ||
          syntaxTreeChanged(update) ||
          hasTriggerEffect(update)
        ) {
          this.decorations = compute(update.view);
        }
      }
    },
    { decorations: (value) => value.decorations },
  );
}
