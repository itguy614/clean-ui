import { RangeSetBuilder, StateEffect } from "@codemirror/state";
import { Decoration, EditorView, ViewPlugin, type DecorationSet, type ViewUpdate } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import type { SyntaxNode } from "@lezer/common";
import { granularityField, setGranularityEffect } from "./granularity";
import { activeConstructsField, setActiveConstructsEffect } from "./construct-policy";
import { isMarkerNodeName, hasMandatoryTrailingSpace, isHiddenLinkDestination } from "./constructs";

/**
 * Visually hides via zero-size styling — never `Decoration.replace()`, which
 * removes characters from the DOM and so from the accessibility tree (FR9).
 * See src/styles/editor.css for `.cui-md-marker-hidden`.
 */
const hiddenMarkerDecoration = Decoration.mark({ class: "cui-md-marker-hidden" });

/**
 * A freshly created `EditorState` with no explicit selection defaults its
 * cursor to position 0 — a purely technical placeholder, not a signal that
 * the user is "looking there." If the document happens to start with a
 * supported construct (a heading, most commonly), that default position
 * sits inside it, so it rendered revealed on first paint before the user
 * had ever clicked into the editor at all — confirmed by loading the page
 * and checking decorations with zero interaction, not assumed. Gating on
 * `view.hasFocus` fixes it at the root: nothing is "away from the cursor"
 * or "at the cursor" when there's no real cursor engagement yet, so nothing
 * should be revealed by an incidental default position either. `hasFocus`
 * itself doesn't participate in `ViewUpdate`'s own diffing (focus is a DOM
 * concern state doesn't model) — `refreshRevealEffect` (dispatched from the
 * `focus`/`blur` DOM handlers below) is what makes a focus change actually
 * trigger a recompute. Exported for `list-bullet-plugin.ts`, which must
 * recompute on the exact same focus/blur transitions as this plugin so a
 * list's bullet widget never lags behind its marker's own hide/reveal.
 */
export const refreshRevealEffect = StateEffect.define<null>();

/** Exported for `list-bullet-plugin.ts`, which needs the exact same
 * "is the cursor meaningfully away from this construct" semantics so a
 * list's decorative bullet appears/disappears in lockstep with its marker
 * hiding/revealing, rather than drifting out of sync with a re-derived copy
 * of this logic. */
export function isRevealed(nodeFrom: number, nodeTo: number, view: EditorView): boolean {
  if (!view.hasFocus) return false;
  const { from: selFrom, to: selTo, head } = view.state.selection.main;
  if (view.state.field(granularityField) === "line") {
    const line = view.state.doc.lineAt(head);
    return nodeFrom <= line.to && nodeTo >= line.from;
  }
  return selFrom <= nodeTo && selTo >= nodeFrom;
}

/**
 * `@lezer/markdown` always nests a bulleted/numbered list as
 * `BulletList/OrderedList(ListItem(ListMark, ...), ...)` — `ListItem` is a
 * purely structural wrapper, never itself a registered, policy-gated
 * construct, so a list's actual `ListMark` bullet/number lives one level
 * deeper than `BulletList`/`OrderedList`'s own direct children. A `ListItem`
 * is eligible for hiding exactly when its parent list construct is active —
 * checked here, at the point the tree walk naturally reaches each `ListItem`
 * in document order, rather than by recursing ahead from the parent
 * `BulletList`/`OrderedList` match. That recursion was tried first and
 * crashed `RangeSetBuilder` (which requires strictly increasing `from`
 * order): eagerly hiding every item's `ListMark` when `BulletList` is
 * entered raced ahead of the walk's own later, in-order visit to each
 * item's nested `Task` construct, so a later `TaskMarker` add (position 2)
 * landed after an earlier item's own `ListMark` add (position 13) —
 * confirmed by reproducing the crash, not assumed from reading the code.
 */
function isEligibleListItem(ref: { name: string; node: SyntaxNode }, activeConstructs: ReadonlySet<string>): boolean {
  return ref.name === "ListItem" && ref.node.parent !== null && activeConstructs.has(ref.node.parent.name);
}

function computeDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const activeConstructs = view.state.field(activeConstructsField);

  for (const { from, to } of view.visibleRanges) {
    syntaxTree(view.state).iterate({
      from,
      to,
      enter: (ref) => {
        if (!activeConstructs.has(ref.name) && !isEligibleListItem(ref, activeConstructs)) return;
        if (isRevealed(ref.from, ref.to, view)) return;

        let child = ref.node.firstChild;
        while (child) {
          if (isMarkerNodeName(child.name)) {
            let to = child.to;
            if (hasMandatoryTrailingSpace(child.name) && view.state.doc.sliceString(to, to + 1) === " ") {
              to += 1;
            }
            builder.add(child.from, to, hiddenMarkerDecoration);
          } else if (isHiddenLinkDestination(child.name)) {
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
 * FR7/FR10/FR10a: hides supported constructs' markers unless the editor is
 * focused with the selection/caret inside (or, at line granularity, on the
 * same line) — never revealed at all while unfocused, so an incidental
 * default cursor position before the user's first interaction can't reveal
 * anything. Recomputes on document, selection, viewport, granularity and
 * focus changes — a granularity change alone sets none of the `ViewUpdate`
 * flags, which is exactly the bug the prototype spike caught. Suspended
 * entirely while an IME composition is in progress (FR10): touching the DOM
 * mid-composition can displace the candidate window or abort it outright.
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
      const focusChanged = update.transactions.some((tr) => tr.effects.some((effect) => effect.is(refreshRevealEffect)));
      if (update.docChanged || update.viewportChanged || update.selectionSet || granularityChanged || constructsChanged || focusChanged) {
        this.decorations = computeDecorations(update.view);
      }
    }
  },
  { decorations: (value) => value.decorations },
);

/** Dispatches a no-op-for-state, recompute-trigger effect on focus/blur —
 * `hasFocus` itself doesn't make `ViewUpdate` see anything change, so
 * without this a focus/blur transition would never actually update the
 * decorations that depend on it. */
export const revealFocusTracking = EditorView.domEventHandlers({
  focus: (_event, view) => {
    view.dispatch({ effects: refreshRevealEffect.of(null) });
    return false;
  },
  blur: (_event, view) => {
    view.dispatch({ effects: refreshRevealEffect.of(null) });
    return false;
  },
});
