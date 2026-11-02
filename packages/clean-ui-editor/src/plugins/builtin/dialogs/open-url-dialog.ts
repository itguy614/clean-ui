import { mountStandaloneDialog } from "./mount-standalone";
import { editorElementOf } from "../../command-context";
import UrlDialog from "./UrlDialog.vue";
import type { UrlDialogKind } from "../../../messages";
import type { CommandContext } from "../../types";

export interface UrlDialogValues {
  url: string;
  text: string;
}

/**
 * Opens the link or image dialog through `context.collect()`, in the host's clean-ui
 * context — which also carries the editor's own strings, the dialog reading them from the
 * provided catalog — and in the editor's scoped theme (#399). Resolves the submitted
 * values, or `null` on cancel or when the editor unmounts with the dialog still open.
 */
export function openUrlDialog(
  context: CommandContext,
  kind: UrlDialogKind,
  initial: Partial<UrlDialogValues> = {},
): Promise<UrlDialogValues | null> {
  return context.collect<UrlDialogValues>((settle) => {
    const unmount = mountStandaloneDialog(
      UrlDialog,
      {
        kind,
        initialUrl: initial.url,
        initialText: initial.text,
        onSubmit: (values: UrlDialogValues) => {
          settle.resolve(values);
          unmount();
        },
        onCancel: () => {
          settle.cancel();
          unmount();
        },
      },
      context.cleanUI,
      editorElementOf(context),
    );
    // The editor closes it if it unmounts first (#409).
    return unmount;
  });
}
