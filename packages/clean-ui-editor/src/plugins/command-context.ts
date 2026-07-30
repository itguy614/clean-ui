import type { EditorView } from "@codemirror/view";
import type { ChangeSpec } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";
import type { SyntaxNode } from "@lezer/common";
import type { CommandContext } from "./types";

/**
 * `getView` is a live accessor (not a captured reference) so a context built
 * once and reused across invocations always operates on the current view —
 * matters for `collect()` continuations, which run after an awaited gap.
 *
 * `onCollectingChange`, if supplied, fires `true` for the duration of any
 * `collect()` call and `false` once it settles — this is how the host
 * component knows to block mode switching while a dialog is open (FR14),
 * without `CommandContext` itself needing any concept of "mode."
 */
export function createCommandContext(
  getView: () => EditorView | null,
  onCollectingChange?: (isCollecting: boolean) => void,
): CommandContext {
  function requireView(): EditorView {
    const view = getView();
    if (!view) throw new Error("CuiMarkdownEditor: command invoked after the editor was unmounted.");
    return view;
  }

  function findConstructRange(nodeName: string): { from: number; to: number } | null {
    const view = requireView();
    const pos = view.state.selection.main.head;
    // Bias toward the node ending here first (side -1) — matters right
    // after a closing marker, e.g. the cursor landing at "**bold**|" should
    // still read as inside the bold construct — then fall back to the node
    // starting here (side 1) for a cursor at the open boundary.
    for (const side of [-1, 1] as const) {
      let node: SyntaxNode | null = syntaxTree(view.state).resolveInner(pos, side);
      while (node) {
        if (node.name === nodeName) return { from: node.from, to: node.to };
        node = node.parent;
      }
    }
    return null;
  }

  function replaceRange(from: number, to: number, text: string): void {
    const view = requireView();
    view.dispatch(
      view.state.update({
        changes: { from, to, insert: text },
        selection: { anchor: from + text.length },
        scrollIntoView: true,
      }),
    );
  }

  return {
    get doc() {
      return requireView().state.doc.toString();
    },
    get selection() {
      const { from, to } = requireView().state.selection.main;
      return { from, to, empty: from === to };
    },
    insertAtCursor(text) {
      const { from, to } = requireView().state.selection.main;
      replaceRange(from, to, text);
    },
    replaceRange,
    wrapSelection(before, after) {
      const view = requireView();
      const { from, to, empty } = view.state.selection.main;
      const inner = view.state.sliceDoc(from, to);
      view.dispatch(
        view.state.update({
          changes: { from, to, insert: `${before}${inner}${after}` },
          // FR13: an empty selection places the cursor between the two
          // markers; a non-empty one re-selects the wrapped text so the
          // caller can immediately toggle again or keep typing over it.
          selection: empty
            ? { anchor: from + before.length }
            : { anchor: from + before.length, head: from + before.length + inner.length },
          scrollIntoView: true,
        }),
      );
    },
    replaceRanges(edits) {
      const view = requireView();
      // A single `state.update()` call with multiple non-overlapping changes
      // (all specified in original-document coordinates) composes into one
      // ChangeSet — one transaction, one undo step (FR15) — regardless of
      // how many logically separate edits a command makes internally, e.g.
      // toggling a list marker on every line of a multi-line selection.
      const changes: ChangeSpec = edits.map(({ from, to, text }) => ({ from, to, insert: text }));
      view.dispatch(view.state.update({ changes, scrollIntoView: true }));
    },
    async collect(open) {
      onCollectingChange?.(true);
      try {
        return await new Promise((resolve) => {
          open({
            resolve: (value) => resolve(value),
            cancel: () => resolve(null),
          });
        });
      } finally {
        onCollectingChange?.(false);
      }
    },
    findConstructRange,
  };
}
