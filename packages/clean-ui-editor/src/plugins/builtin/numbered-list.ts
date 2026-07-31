import { definePlugin } from "../define-plugin";
import { linesInRange } from "./line-utils";

const NUMBERED_PREFIX_PATTERN = /^\d+\.\s/;

export const numberedListPlugin = definePlugin({
  id: "cui-numbered-list",
  commands: {
    numberedList: {
      run(context) {
        const { from, to } = context.selection;
        const lines = linesInRange(context.doc, from, to);
        const allNumbered = lines.every((line) => NUMBERED_PREFIX_PATTERN.test(line.text));

        context.replaceRanges(
          lines.flatMap((line, index) => {
            const match = line.text.match(NUMBERED_PREFIX_PATTERN);
            if (allNumbered && match) return [{ from: line.start, to: line.start + match[0].length, text: "" }];
            if (!allNumbered && !match) return [{ from: line.start, to: line.start, text: `${index + 1}. ` }];
            return [];
          }),
        );
        return true;
      },
      isActive: (context) => {
        const { from, to } = context.selection;
        return linesInRange(context.doc, from, to).every((line) => NUMBERED_PREFIX_PATTERN.test(line.text));
      },
      label: "Numbered list",
      icon: "list-numbered",
    },
  },
  toolbar: [{ command: "numberedList" }],
  keymap: [{ key: "Mod-Shift-7", command: "numberedList" }],
  constructs: ["OrderedList"],
  decorations: [{ node: "OrderedList" }],
  paste: [
    {
      selector: "ol > li",
      produces: "OrderedList",
      degradeTo: "plainText",
      toMarkdown: (el, c) => {
        const index = el.parentElement ? [...el.parentElement.children].indexOf(el) + 1 : 1;
        return `${index}. ${c.trim()}`;
      },
    },
  ],
});
