import { definePlugin } from "../define-plugin";
import { toggleLinePrefixCommand } from "./toggle-line-prefix";

export const blockquotePlugin = definePlugin({
  id: "cui-blockquote",
  commands: {
    blockquote: {
      ...toggleLinePrefixCommand({ match: "> " }),
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
