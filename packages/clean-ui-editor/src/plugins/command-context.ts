import type { EditorView } from "@codemirror/view";
import type { ChangeSpec, EditorState } from "@codemirror/state";
import type { SyntaxNode } from "@lezer/common";
import { QUERY_PARSE_CAP_MS, settledAt, treeSettledAt } from "./parse-settled";
import type { CommandContext, ConstructLookup } from "./types";
import type { CleanUIContext } from "@itguy614/clean-ui";
import { defaultMarkdownEditorMessages, type CuiMarkdownEditorMessages } from "../messages";

const NO_CLEAN_UI_CONTEXT: CleanUIContext = { provideTo() {} };

const OUTSIDE: ConstructLookup = Object.freeze({ status: "outside" });
const UNKNOWN: ConstructLookup = Object.freeze({ status: "unknown" });

/** Internal to the package: state the editor drives that commands never see.
 * Kept off the object so it adds nothing to the public type. */
interface ContextInternals {
  /** Inside an `isActive` query: answer from what is parsed, never parse. */
  peeking: boolean;
  peekedState: EditorState | null;
  /** A query on `peekedState` hit an unsettled block. */
  peekUnsettled: boolean;
  /** Each open `collect()`: closes its UI and resolves it `null`. */
  openCollects: Set<() => void>;
  disposed: boolean;
}
const internals = new WeakMap<CommandContext, ContextInternals>();

/** Runs an `isActive` query in peek mode: lookups parse for a few
 * milliseconds at most instead of blocking the render. Re-entrant. */
export function peeking<T>(context: CommandContext, query: () => T): T {
  const own = internals.get(context);
  if (!own) return query();
  const outer = own.peeking;
  own.peeking = true;
  try {
    return query();
  } finally {
    own.peeking = outer;
  }
}

/** Whether the latest queries met a block still being parsed, so a later
 * parse chunk can change their answers. */
export function peekedUnsettled(context: CommandContext): boolean {
  return internals.get(context)?.peekUnsettled ?? false;
}

/**
 * The editor is unmounting (#409): every open `collect()` closes its UI and
 * resolves `null`, as a cancel would, and a later one resolves `null` without
 * opening anything. Nothing can then write into the destroyed view.
 */
export function disposeCommandContext(context: CommandContext): void {
  const own = internals.get(context);
  if (!own) return;
  own.disposed = true;
  for (const abandon of [...own.openCollects]) {
    try {
      abandon();
    } catch (error) {
      // One plugin's broken close must not keep the others' dialogs open.
      console.error("[CuiMarkdownEditor] closing a dialog on unmount threw:", error);
    }
  }
}

/**
 * `getView` is a live accessor (not a captured reference) so a context built
 * once and reused across invocations always operates on the current view —
 * matters for `collect()` continuations, which run after an awaited gap.
 *
 * `onCollectingChange`, if supplied, fires `true` for the duration of any
 * `collect()` call and `false` once it settles — this is how the host
 * component knows to block mode switching while a dialog is open (FR14),
 * without `CommandContext` itself needing any concept of "mode."
 *
 * `getMessages`, if supplied, is a live accessor over the resolved message
 * catalog (task 5.2.2) — a command that opens its own dialog (link, image)
 * reads `context.messages` and passes its strings down as plain props, since
 * `mountStandaloneDialog` creates a detached Vue app with no `inject()`
 * access to the host's `CuiConfigProvider`. Defaults to the English catalog
 * so a context built without this (e.g. a unit test) still works.
 *
 * `cleanUI`, if supplied, is the host's clean-ui context (#326), which that
 * same detached app is given so its clean-ui components follow the host's
 * defaults and catalog. Defaults to one that provides nothing.
 */
export function createCommandContext(
  getView: () => EditorView | null,
  onCollectingChange?: (isCollecting: boolean) => void,
  getMessages: () => CuiMarkdownEditorMessages = () => defaultMarkdownEditorMessages,
  cleanUI: CleanUIContext = NO_CLEAN_UI_CONTEXT,
): CommandContext {
  function requireView(): EditorView {
    const view = getView();
    if (!view) throw new Error("CuiMarkdownEditor: command invoked after the editor was unmounted.");
    return view;
  }

  const own: ContextInternals = {
    peeking: false,
    peekedState: null,
    peekUnsettled: false,
    openCollects: new Set(),
    disposed: false,
  };

  function lookupConstruct(nodeName: string): ConstructLookup {
    const view = requireView();
    const { state } = view;
    const pos = state.selection.main.head;
    // A query parses briefly; only a command waits for the block to close.
    if (own.peeking && own.peekedState !== state) {
      own.peekedState = state;
      own.peekUnsettled = false;
    }
    const tree = own.peeking ? treeSettledAt(state, QUERY_PARSE_CAP_MS) : treeSettledAt(state);
    if (!tree) return OUTSIDE; // no language, so no constructs
    // The cursor's block may still be cut short: no range in it is safe to
    // rewrite, and "not inside" would make a toggle wrap inside it.
    if (!settledAt(tree, pos, state.doc.length)) {
      if (own.peeking) own.peekUnsettled = true;
      return UNKNOWN;
    }
    // Bias toward the node ending here first (side -1) — matters right
    // after a closing marker, e.g. the cursor landing at "**bold**|" should
    // still read as inside the bold construct — then fall back to the node
    // starting here (side 1) for a cursor at the open boundary.
    for (const side of [-1, 1] as const) {
      let node: SyntaxNode | null = tree.resolveInner(pos, side);
      while (node) {
        if (node.name === nodeName) return { status: "inside", range: { from: node.from, to: node.to } };
        node = node.parent;
      }
    }
    return OUTSIDE;
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

  const context: CommandContext = {
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
      if (own.disposed) return null;
      onCollectingChange?.(true);
      let abandon = () => {};
      try {
        return await new Promise((resolve) => {
          let close: unknown;
          // Settled by the UI: it closes itself, so unmounting has nothing left to close.
          const settle = (value: Parameters<typeof resolve>[0]) => {
            own.openCollects.delete(abandon);
            resolve(value);
          };
          abandon = () => {
            settle(null);
            if (typeof close === "function") close();
          };
          own.openCollects.add(abandon);
          close = open({ resolve: settle, cancel: () => settle(null) });
        });
      } finally {
        own.openCollects.delete(abandon);
        onCollectingChange?.(false);
      }
    },
    lookupConstruct,
    get messages() {
      return getMessages();
    },
    cleanUI,
  };
  internals.set(context, own);
  return context;
}
