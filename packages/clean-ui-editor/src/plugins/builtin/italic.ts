import { definePlugin } from "../define-plugin";
import { toggleInlineCommand } from "./toggle-inline";

export const italicPlugin = definePlugin({
  id: "cui-italic",
  commands: {
    italic: { ...toggleInlineCommand({ nodeName: "Emphasis", marker: "*" }), label: "Italic", icon: "italic" },
  },
  toolbar: [{ command: "italic" }],
  keymap: [{ key: "Mod-i", command: "italic" }],
  constructs: ["Emphasis"],
  decorations: [{ node: "Emphasis" }],
  paste: [{ selector: "em, i", produces: "Emphasis", degradeTo: "plainText", toMarkdown: (_el, c) => `*${c}*` }],
});
