import { RangeSetBuilder } from "@codemirror/state";
import { Decoration, EditorView, ViewPlugin, WidgetType, type DecorationSet, type ViewUpdate } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import type { SyntaxNode } from "@lezer/common";
import { setGranularityEffect } from "./granularity";
import { activeConstructsField, setActiveConstructsEffect } from "./construct-policy";
import { isRevealed, refreshRevealEffect } from "./reveal-plugin";

/** A purely decorative stand-in for a hidden `ListMark` ("-", "*", "+") —
 * `aria-hidden` because the real marker text stays in the DOM for the
 * accessibility tree (FR9); this widget would otherwise double-announce it.
 * `ignoreEvent` lets clicks fall through to CodeMirror's own coordinate-based
 * cursor placement instead of the widget swallowing them. Positioned via an
 * inline style computed from nesting `depth` (not a CSS class per depth,
 * unlike the line's own indent below) — this widget is a single, uniquely
 * positioned element, not a shared line that two different depths might
 * both claim, so there's no cascade-ordering tie to resolve through source
 * order; a plain computed value is simpler. */
class BulletWidget extends WidgetType {
  constructor(private readonly depth: number) {
    super();
  }
  eq(other: BulletWidget): boolean {
    return other.depth === this.depth;
  }
  toDOM(): HTMLElement {
    const span = document.createElement("span");
    span.className = "cui-md-bullet";
    span.textContent = "•";
    span.setAttribute("aria-hidden", "true");
    span.style.left = `${(this.depth - 1) * 1.25 + 0.4}em`;
    return span;
  }
  ignoreEvent(): boolean {
    return true;
  }
}

/** One class per nesting depth so a deeper list's indent (and, when a line
 * is claimed by two different depths — see below — its winning padding)
 * comes from CSS source order, not specificity: `editor.css` defines these
 * in increasing-depth order, so the deepest matching class always wins a
 * same-specificity tie. Capped rather than generated per-depth without
 * bound — six levels is already deep for a real document, and an unbounded
 * class name would be one no stylesheet rule could ever match anyway. */
const MAX_INDENT_DEPTH = 6;

function listDepth(node: SyntaxNode): number {
  let depth = 0;
  let ancestor: SyntaxNode | null = node.parent;
  while (ancestor) {
    if (ancestor.name === "BulletList" || ancestor.name === "OrderedList") depth++;
    ancestor = ancestor.parent;
  }
  return Math.min(depth, MAX_INDENT_DEPTH);
}

function lineDecorationFor(depth: number): Decoration {
  return Decoration.line({ class: `cui-md-list-line cui-md-list-line-${depth}` });
}

const bulletWidgetCache = new Map<number, Decoration>();

function bulletWidgetDecorationFor(depth: number): Decoration {
  let decoration = bulletWidgetCache.get(depth);
  if (!decoration) {
    decoration = Decoration.widget({ widget: new BulletWidget(depth), side: -1 });
    bulletWidgetCache.set(depth, decoration);
  }
  return decoration;
}

/**
 * Renders a bulleted list's marker as an actual bullet glyph instead of
 * plain, indent-less text once its `ListMark` is hidden — matching what a
 * WYSIWYG list should look like, rather than the flush, unindented lines
 * left behind by marker-hiding alone. Deliberately its own `ViewPlugin`
 * (like `code-decorations.ts`), not folded into `reveal-plugin.ts`: that
 * file's own `RangeSetBuilder` already walks nested `ListItem`s and must add
 * ranges in strict document order — reusing it here would mean two
 * unrelated decoration kinds (marker-hiding, bullet widgets) racing to keep
 * a single builder's `add()` calls monotonic, exactly the ordering hazard
 * that already crashed once during marker-hiding (see `reveal-plugin.ts`'s
 * `isEligibleListItem` comment). A separate `ViewPlugin` means a separate
 * builder, so the two can never collide.
 *
 * Only ever decorates a `ListItem`'s own first line, never a multi-line
 * loop across its full range the way `codeBackgroundPlugin` does for fenced
 * code: a fenced code block can't nest, but a list item can contain another
 * list, so looping ahead from an outer `ListItem` to its last line would
 * again race ahead of the walk's own later, in-order visit to a nested
 * `ListItem` — the same hazard, avoided the same way. A list item's lazy
 * continuation lines (rare) simply don't get the hanging indent.
 */
function computeBulletDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const activeConstructs = view.state.field(activeConstructsField);
  if (!activeConstructs.has("BulletList")) return Decoration.none;

  for (const { from, to } of view.visibleRanges) {
    syntaxTree(view.state).iterate({
      from,
      to,
      enter: (ref) => {
        if (ref.name !== "ListItem" || ref.node.parent?.name !== "BulletList") return;
        if (isRevealed(ref.from, ref.to, view)) return;

        const depth = listDepth(ref.node);
        const line = view.state.doc.lineAt(ref.from);
        builder.add(line.from, line.from, lineDecorationFor(depth));
        builder.add(ref.from, ref.from, bulletWidgetDecorationFor(depth));
      },
    });
  }

  return builder.finish();
}

export const listBulletPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = computeBulletDecorations(view);
    }
    update(update: ViewUpdate) {
      if (update.view.compositionStarted) return;

      const granularityChanged = update.transactions.some((tr) => tr.effects.some((effect) => effect.is(setGranularityEffect)));
      const constructsChanged = update.transactions.some((tr) => tr.effects.some((effect) => effect.is(setActiveConstructsEffect)));
      const focusChanged = update.transactions.some((tr) => tr.effects.some((effect) => effect.is(refreshRevealEffect)));
      if (update.docChanged || update.viewportChanged || update.selectionSet || granularityChanged || constructsChanged || focusChanged) {
        this.decorations = computeBulletDecorations(update.view);
      }
    }
  },
  { decorations: (value) => value.decorations },
);
