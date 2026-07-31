import { definePlugin } from "../define-plugin";
import { toggleInlineCommand } from "./toggle-inline";

export const strikethroughPlugin = definePlugin({
  id: "cui-strikethrough",
  commands: {
    strikethrough: {
      ...toggleInlineCommand({ nodeName: "Strikethrough", marker: "~~" }),
      label: "Strikethrough",
      icon: "strikethrough",
    },
  },
  toolbar: [{ command: "strikethrough" }],
  keymap: [{ key: "Mod-Shift-x", command: "strikethrough" }],
  constructs: ["Strikethrough"],
  decorations: [{ node: "Strikethrough" }],
  paste: [{ selector: "s, del, strike", produces: "Strikethrough", degradeTo: "plainText", toMarkdown: (_el, c) => `~~${c}~~` }],
});
