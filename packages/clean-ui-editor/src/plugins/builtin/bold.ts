import { definePlugin } from "../define-plugin";
import { toggleInlineCommand } from "./toggle-inline";

export const boldPlugin = definePlugin({
  id: "cui-bold",
  commands: {
    bold: { ...toggleInlineCommand({ nodeName: "StrongEmphasis", marker: "**" }), label: "Bold", icon: "bold" },
  },
  toolbar: [{ command: "bold" }],
  keymap: [{ key: "Mod-b", command: "bold" }],
  constructs: ["StrongEmphasis"],
  decorations: [{ node: "StrongEmphasis" }],
  paste: [{ selector: "strong, b", produces: "StrongEmphasis", degradeTo: "plainText", toMarkdown: (_el, c) => `**${c}**` }],
});
