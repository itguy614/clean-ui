import { mountStandaloneDialog } from "./mount-standalone";
import UrlDialog from "./UrlDialog.vue";
import { pickUrlDialogMessages, type UrlDialogKind } from "../../../messages";
import type { CommandContext } from "../../types";

export interface UrlDialogValues {
  url: string;
  text: string;
}

/**
 * Opens the link or image dialog through `context.collect()`, in the host's locale and
 * clean-ui context. Resolves the submitted values, or `null` on cancel.
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
        messages: pickUrlDialogMessages(context.messages, kind),
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
    );
  });
}
