import { definePlugin } from "../define-plugin";
import { toggleLinePrefixCommand } from "./toggle-line-prefix";

export const bulletedListPlugin = definePlugin({
  id: "cui-bulleted-list",
  commands: {
    bulletedList: {
      ...toggleLinePrefixCommand({ match: "- " }),
      label: "Bulleted list",
      icon: "list-bulleted",
    },
  },
  toolbar: [{ command: "bulletedList" }],
  keymap: [{ key: "Mod-Shift-8", command: "bulletedList" }],
  constructs: ["BulletList"],
  decorationNodes: ["BulletList"],
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
