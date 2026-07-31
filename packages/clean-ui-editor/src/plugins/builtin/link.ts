import { definePlugin } from "../define-plugin";
import { mountStandaloneDialog } from "./dialogs/mount-standalone";
import LinkDialog from "./dialogs/LinkDialog.vue";
import { pickLinkDialogMessages } from "../../messages";
import type { CommandContext } from "../types";

const URL_LOOKING_PATTERN = /^(https?:\/\/|mailto:)\S+$/i;

/** FR14: a URL-looking selection pre-fills the URL field; any other
 * selection becomes the link label rather than being discarded. */
function computeInitial(context: CommandContext): { url: string; label: string } {
  const { from, to, empty } = context.selection;
  if (empty) return { url: "", label: "" };
  const selected = context.doc.slice(from, to);
  return URL_LOOKING_PATTERN.test(selected) ? { url: selected, label: "" } : { url: "", label: selected };
}

export const linkPlugin = definePlugin({
  id: "cui-link",
  commands: {
    link: {
      run(context) {
        const initial = computeInitial(context);
        context
          .collect<{ url: string; label: string }>((settle) => {
            const unmount = mountStandaloneDialog(LinkDialog, {
              initialUrl: initial.url,
              initialLabel: initial.label,
              messages: pickLinkDialogMessages(context.messages),
              onSubmit: (values: { url: string; label: string }) => {
                settle.resolve(values);
                unmount();
              },
              onCancel: () => {
                settle.cancel();
                unmount();
              },
            });
          })
          .then((values) => {
            // Cancelling leaves the document untouched (FR18a); this single
            // insertAtCursor call is the entire edit, so it's one undo step.
            if (values) context.insertAtCursor(`[${values.label}](${values.url})`);
          });
        // FR18: the command itself returns synchronously — it has "handled"
        // the invocation by opening the dialog, even though the edit (if
        // any) lands later, after the awaited collect() resolves.
        return true;
      },
      isActive: (context) => context.findConstructRange("Link") !== null,
      label: "Link",
      icon: "link",
    },
  },
  toolbar: [{ command: "link" }],
  keymap: [{ key: "Mod-k", command: "link" }],
  constructs: ["Link"],
  decorations: [{ node: "Link" }],
  paste: [
    {
      selector: "a[href]",
      produces: "Link",
      degradeTo: "plainText",
      toMarkdown: (el, c) => `[${c || el.getAttribute("href")}](${el.getAttribute("href")})`,
    },
  ],
});
