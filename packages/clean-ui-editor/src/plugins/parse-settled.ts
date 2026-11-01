import type { EditorState } from "@codemirror/state";
import { ensureSyntaxTree, syntaxTree } from "@codemirror/language";
import type { SyntaxNode, Tree } from "@lezer/common";

/** A safety net for a pathological document only, never the normal limit:
 * the parse below is bounded by distance (the cursor's block), not by time,
 * so a slow machine gets the same answer as a fast one. */
const PARSE_CAP_MS = 1000;
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

/** The parser's own furthest tree, which may be ahead of `syntaxTree(state)`:
 * `ensureSyntaxTree` advances the parse without dispatching it. */
function furthestTree(state: EditorState): Tree {
  return ensureSyntaxTree(state, 0, 0) ?? syntaxTree(state);
}

/** One answer per state and cursor, so the toolbar's `isActive` queries in a
 * single render share one parse (and one time cap) instead of each running
 * its own. */
const cache = new WeakMap<EditorState, { pos: number; tree: Tree }>();

/**
 * The parser finishes a long document in the background (#256), so the
 * current tree may stop short of the cursor, or run into the block the
 * cursor is in and cut it off. Read as-is, either one says "not inside" and a
 * toggle double-wraps instead of unwrapping. Parse on until the cursor's
 * top-level block has closed: never to the end of the document unless the
 * block runs that far. Only past `PARSE_CAP_MS` can the result still be
 * unsettled (check with `settledAt`).
 */
export function treeSettledAt(state: EditorState, pos: number): Tree {
  const cached = cache.get(state);
  if (cached?.pos === pos) return cached.tree;

  const docLength = state.doc.length;
  const deadline = Date.now() + PARSE_CAP_MS;
  let upto = state.doc.lineAt(pos).to;
  let step = FIRST_PARSE_STEP;
  let tree: Tree;
  for (;;) {
    tree = ensureSyntaxTree(state, upto, Math.max(0, deadline - Date.now())) ?? furthestTree(state);
    if (settledAt(tree, pos, docLength) || Date.now() >= deadline) break;
    upto = Math.min(docLength, Math.max(upto, tree.length) + step);
    step *= 2;
  }
  cache.set(state, { pos, tree });
  return tree;
}
