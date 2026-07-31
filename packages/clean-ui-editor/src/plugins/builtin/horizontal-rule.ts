import { definePlugin } from "../define-plugin";
import { lineBoundsAt } from "./line-utils";

const RULE_PATTERN = /^(-{3,}|\*{3,}|_{3,})$/;

export const horizontalRulePlugin = definePlugin({
  id: "cui-horizontal-rule",
  commands: {
    horizontalRule: {
      run(context) {
        const { start, end } = lineBoundsAt(context.doc, context.selection.from);
        const text = context.doc.slice(start, end).trim();
        if (RULE_PATTERN.test(text)) {
          const hasTrailingNewline = end < context.doc.length;
          context.replaceRange(start, hasTrailingNewline ? end + 1 : end, "");
        } else {
          context.insertAtCursor("\n---\n");
        }
        return true;
      },
      isActive: (context) => {
        const { start, end } = lineBoundsAt(context.doc, context.selection.from);
        return RULE_PATTERN.test(context.doc.slice(start, end).trim());
      },
      label: "Horizontal rule",
      icon: "horizontal-rule",
    },
  },
  toolbar: [{ command: "horizontalRule" }],
  constructs: ["HorizontalRule"],
  decorations: [{ node: "HorizontalRule" }],
});
