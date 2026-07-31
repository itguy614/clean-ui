import { definePlugin } from "../define-plugin";
import { toggleInlineCommand } from "./toggle-inline";

export const inlineCodePlugin = definePlugin({
  id: "cui-inline-code",
  commands: {
    inlineCode: { ...toggleInlineCommand({ nodeName: "InlineCode", marker: "`" }), label: "Inline code", icon: "code" },
  },
  toolbar: [{ command: "inlineCode" }],
  keymap: [{ key: "Mod-e", command: "inlineCode" }],
  constructs: ["InlineCode"],
  decorations: [{ node: "InlineCode" }],
  paste: [
    {
      // Excludes <code> inside <pre> — that's a fenced code BLOCK,
      // codeFencePlugin's own rule (below) claims it instead.
      selector: "code:not(pre code)",
      produces: "InlineCode",
      degradeTo: "plainText",
      // Raw textContent, not the (escaped) converted children — code
      // content is verbatim; markdown escaping is exactly what it must NOT
      // get, since backticks already protect it.
      toMarkdown: (el) => `\`${el.textContent ?? ""}\``,
    },
  ],
});
