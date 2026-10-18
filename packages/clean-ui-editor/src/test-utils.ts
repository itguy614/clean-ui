import { ensureSyntaxTree } from "@codemirror/language";
import type { EditorState } from "@codemirror/state";

/**
 * The whole document's syntax tree. syntaxTree() returns only what the parser has reached
 * so far — it works to a time budget and continues in the background — so under load a
 * node near the end of the document can be missing (#250).
 */
export function completeTree(state: EditorState) {
  const tree = ensureSyntaxTree(state, state.doc.length, 5000);
  if (!tree) throw new Error("the document did not finish parsing within 5s");
  return tree;
}
