import type { EditorState } from "@codemirror/state";
import { ensureSyntaxTree, language, syntaxTree } from "@codemirror/language";
import type { SyntaxNode, Tree } from "@lezer/common";

/** A safety net for a pathological document only, never the normal limit:
 * the parse below is bounded by distance (the cursor's block), not by time,
 * so a slow machine gets the same answer as a fast one. */
const PARSE_CAP_MS = 1000;
/** What a toolbar query may spend: a render must stay responsive. Progress
 * carries over, so a long block settles over a few queries. */
export const QUERY_PARSE_CAP_MS = 10;
/** How far past the current parse frontier each extension reaches; doubles
 * on every round so a long block costs a handful of rounds, not hundreds. */
const FIRST_PARSE_STEP = 4096;

/** The block (a child of `Document`) that `pos` sits in on `side`, or `null`
 * between blocks. */
function topLevelBlockAt(tree: Tree, pos: number, side: -1 | 1): SyntaxNode | null {
  let node: SyntaxNode = tree.resolve(pos, side);
  if (!node.parent) return null;
  while (node.parent?.parent) node = node.parent;
  return node;
}

/**
 * Whether `tree` is final around `pos`. A partial parse closes every block
 * still open where it stopped, so the last top-level block of a partial tree
 * may be cut short; any block with a sibling after it was closed by the
 * parser itself, so it is complete, and so are its inline constructs, which
 * are parsed only once their block closes. (Comparing a block's end with the
 * tree's length can't tell the two apart: a stopped parse also takes in the
 * newline after the cut.)
 */
export function settledAt(tree: Tree, pos: number, docLength: number): boolean {
  if (tree.length >= docLength) return true;
  const blocks = ([-1, 1] as const).map((side) => topLevelBlockAt(tree, pos, side));
  if (blocks.every((block) => block === null)) return tree.topNode.childAfter(pos) !== null;
  return blocks.every((block) => block === null || block.nextSibling !== null);
}

/** Where a partial tree may still change: from the start of its last
 * top-level block (possibly cut short) onwards. A complete tree has none. */
export function unsettledFrom(tree: Tree, docLength: number): number | null {
  if (tree.length >= docLength) return null;
  return tree.topNode.lastChild?.from ?? 0;
}

/** The parser's own furthest tree, which may be ahead of `syntaxTree(state)`
 * (`ensureSyntaxTree` advances the parse without dispatching the result).
 * Never parses. */
function furthestTree(state: EditorState): Tree {
  return ensureSyntaxTree(state, 0, 0) ?? syntaxTree(state);
}

/** The latest tree per state, kept once settled so repeated lookups on one
 * state share one parse. */
const cache = new WeakMap<EditorState, Tree>();

/**
 * The parser finishes a long document in the background (#256), so the
 * current tree may stop short of the cursor, or run into the block the
 * cursor is in and cut it off. Read as-is, either one says "not inside" and a
 * toggle double-wraps instead of unwrapping. Parse on until the cursor's
 * top-level block has closed: never to the end of the document unless the
 * block runs that far. Only past `capMs` can the result still be unsettled
 * (check with `settledAt`). A command waits up to `PARSE_CAP_MS`; a toolbar
 * query passes a few milliseconds, and since progress is kept, repeated
 * queries get there too.
 *
 * `null` when the state has no language.
 */
export function treeSettledAt(state: EditorState, capMs = PARSE_CAP_MS): Tree | null {
  if (!state.facet(language)) return null;
  const cached = cache.get(state);
  if (cached) return cached;
  let tree = furthestTree(state);

  const pos = state.selection.main.head;
  const docLength = state.doc.length;
  const deadline = Date.now() + capMs;
  let upto = state.doc.lineAt(pos).to;
  let step = FIRST_PARSE_STEP;
  while (!settledAt(tree, pos, docLength) && Date.now() < deadline) {
    tree = ensureSyntaxTree(state, upto, Math.max(0, deadline - Date.now())) ?? furthestTree(state);
    upto = Math.min(docLength, Math.max(upto, tree.length) + step);
    step *= 2;
  }
  // Only a settled answer is final: an unsettled one may be a short query's,
  // and a command after it must still be free to parse on.
  if (settledAt(tree, pos, docLength)) cache.set(state, tree);
  return tree;
}
