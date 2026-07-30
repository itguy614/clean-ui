import { definePlugin } from "../define-plugin";
import { linesInRange } from "./line-utils";

const BULLET_PREFIX = "- ";

export const bulletedListPlugin = definePlugin({
  id: "cui-bulleted-list",
  commands: {
    bulletedList: {
      run(context) {
        const { from, to } = context.selection;
        const lines = linesInRange(context.doc, from, to);
        const allBulleted = lines.every((line) => line.text.startsWith(BULLET_PREFIX));

        context.replaceRanges(
          lines.flatMap((line) => {
            const isBulleted = line.text.startsWith(BULLET_PREFIX);
            if (allBulleted && isBulleted) return [{ from: line.start, to: line.start + BULLET_PREFIX.length, text: "" }];
            if (!allBulleted && !isBulleted) return [{ from: line.start, to: line.start, text: BULLET_PREFIX }];
            return [];
          }),
        );
        return true;
      },
      isActive: (context) => {
        const { from, to } = context.selection;
        return linesInRange(context.doc, from, to).every((line) => line.text.startsWith(BULLET_PREFIX));
      },
      label: "Bulleted list",
      icon: "list-bulleted",
    },
  },
  toolbar: [{ command: "bulletedList" }],
  keymap: [{ key: "Mod-Shift-8", command: "bulletedList" }],
  constructs: ["BulletList"],
  decorations: [{ node: "BulletList" }],
  paste: [
    {
      // Excludes task items — taskListPlugin's own rule claims those.
      selector: "ul > li:not(:has(> input[type='checkbox']))",
      produces: "BulletList",
      degradeTo: "plainText",
      toMarkdown: (_el, c) => `- ${c.trim()}`,
    },
  ],
});
