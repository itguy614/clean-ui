import { EditorView } from "@codemirror/view";
import { insertNewlineContinueMarkup } from "@codemirror/lang-markdown";

/**
 * `@codemirror/lang-markdown`'s own `insertNewlineContinueMarkup` handles
 * "Enter on an empty list/blockquote item" by deleting the marker to exit
 * that block — but it only removes the marker, it never also inserts the
 * blank line CommonMark needs to keep whatever gets typed next from being
 * read as a *lazy continuation* of the block just left (a line immediately
 * following list/blockquote content, with no blank line before it, is
 * silently absorbed into that block's last item, not a sibling paragraph).
 * Confirmed by reading the resulting document state directly and
 * re-parsing it with the same grammar the editor uses — invisible while
 * composing, since the reveal layer only shows this by widening which
 * range counts as "inside" the list item once its content quietly spans
 * another line.
 *
 * Detection doesn't need to replicate the library's own nested list/
 * blockquote context resolution: the exit-marker-deletion branch always
 * *shrinks* the document (marker text removed, no newline inserted),
 * whereas every other outcome (continuing a list/task, the tight-to-loose
 * list case which already inserts its own blank line, a plain paragraph's
 * ordinary newline) grows it. A doc that got shorter, with the cursor now
 * sitting right after a single newline that isn't already a blank-line
 * pair, is exactly the exit-marker case — and exactly the case needing a
 * topped-up blank line.
 */
export function exitListWithBlankLine(view: EditorView): boolean {
  const before = view.state.doc.length;
  const ran = insertNewlineContinueMarkup(view);
  if (!ran) return false;

  const state = view.state;
  if (state.doc.length >= before) return true; // grew or unchanged — not the exit-marker branch

  const pos = state.selection.main.head;
  if (pos === 0 || state.doc.sliceString(pos - 1, pos) !== "\n") return true; // not at a fresh line start
  if (pos >= 2 && state.doc.sliceString(pos - 2, pos) === "\n\n") return true; // already a blank line

  view.dispatch({ changes: { from: pos, insert: "\n" }, selection: { anchor: pos + 1 } });
  return true;
}
