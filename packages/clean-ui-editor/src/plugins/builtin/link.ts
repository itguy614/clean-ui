import { definePlugin } from "../define-plugin";
import { lookupConstructIn } from "../command-context";
import { openUrlDialog, type UrlDialogValues } from "./dialogs/open-url-dialog";
import { escapeLinkLabel, foldLineBreaks, markdownLink, markdownLinkFromLabel } from "./link-markdown";
import type { CommandContext } from "../types";

const URL_LOOKING_PATTERN = /^(https?:\/\/|mailto:)\S+$/i;

/** FR14: a URL-looking selection pre-fills the URL field; any other
 * selection becomes the link text rather than being discarded. */
function computeInitial(context: CommandContext): Partial<UrlDialogValues> {
  const { from, to, empty } = context.selection;
  if (empty) return {};
  const selected = context.sliceDoc(from, to);
  // The text field is one line: an <input> would drop the breaks and run the words together.
  return URL_LOOKING_PATTERN.test(selected) ? { url: selected } : { text: foldLineBreaks(selected) };
}

export const linkPlugin = definePlugin({
  id: "cui-link",
  commands: {
    link: {
      run(context) {
        openUrlDialog(context, "link", computeInitial(context)).then((values) => {
          // Cancelling leaves the document untouched (FR18a); this single
          // insertAtCursor call is the entire edit, so it's one undo step.
          // A link with no text shows its URL.
          if (values) context.insertAtCursor(markdownLink(values.text || values.url, values.url));
        });
        // FR18: the command itself returns synchronously — it has "handled"
        // the invocation by opening the dialog, even though the edit (if
        // any) lands later, after the awaited collect() resolves.
        return true;
      },
      isActive: (context) => lookupConstructIn(context, "Link").status === "inside",
      label: "Link",
      icon: "link",
    },
  },
  toolbar: [{ command: "link" }],
  keymap: [{ key: "Mod-k", command: "link" }],
  constructs: ["Link"],
  decorationNodes: ["Link"],
  paste: [
    {
      selector: "a[href]",
      produces: "Link",
      degradeTo: "plainText",
      // `c` is already markdown, converted from the anchor's children: only the href is raw.
      toMarkdown: (el, c) => {
        const href = el.getAttribute("href")!;
        return markdownLinkFromLabel(c || escapeLinkLabel(href), href);
      },
    },
  ],
});
