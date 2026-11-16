import { definePlugin } from "../define-plugin";

const RULE_PATTERN = /^(-{3,}|\*{3,}|_{3,})$/;

export const horizontalRulePlugin = definePlugin({
  id: "cui-horizontal-rule",
  commands: {
    horizontalRule: {
      run(context) {
        const { from, to, text } = context.lineAt(context.selection.from);
        if (RULE_PATTERN.test(text.trim())) {
          const hasTrailingNewline = context.sliceDoc(to, to + 1) === "\n";
          context.replaceRange(from, hasTrailingNewline ? to + 1 : to, "");
        } else {
          context.insertAtCursor("\n---\n");
        }
        return true;
      },
      isActive: (context) => {
        return RULE_PATTERN.test(context.lineAt(context.selection.from).text.trim());
      },
      label: "Horizontal rule",
      icon: "horizontal-rule",
    },
  },
  toolbar: [{ command: "horizontalRule" }],
  constructs: ["HorizontalRule"],
  decorationNodes: ["HorizontalRule"],
});
