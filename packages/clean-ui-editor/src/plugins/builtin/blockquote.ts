import { definePlugin } from "../define-plugin";
import { linesInRange } from "./line-utils";

const QUOTE_PREFIX = "> ";

export const blockquotePlugin = definePlugin({
  id: "cui-blockquote",
  commands: {
    blockquote: {
      run(context) {
        const { from, to } = context.selection;
        const lines = linesInRange(context.doc, from, to);
        const allQuoted = lines.every((line) => line.text.startsWith(QUOTE_PREFIX));

        context.replaceRanges(
          lines.flatMap((line) => {
            const isQuoted = line.text.startsWith(QUOTE_PREFIX);
            if (allQuoted && isQuoted) return [{ from: line.start, to: line.start + QUOTE_PREFIX.length, text: "" }];
            if (!allQuoted && !isQuoted) return [{ from: line.start, to: line.start, text: QUOTE_PREFIX }];
            return [];
          }),
        );
        return true;
      },
      isActive: (context) => {
        const { from, to } = context.selection;
        const lines = linesInRange(context.doc, from, to);
        return lines.every((line) => line.text.startsWith(QUOTE_PREFIX));
      },
      label: "Blockquote",
      icon: "blockquote",
    },
  },
  toolbar: [{ command: "blockquote" }],
  keymap: [{ key: "Mod-Shift-.", command: "blockquote" }],
  constructs: ["Blockquote"],
  decorations: [{ node: "Blockquote" }],
  paste: [
    {
      selector: "blockquote",
      produces: "Blockquote",
      degradeTo: "plainText",
      toMarkdown: (_el, c) =>
        c
          .split("\n")
          .map((line) => `> ${line}`)
          .join("\n"),
    },
  ],
});
