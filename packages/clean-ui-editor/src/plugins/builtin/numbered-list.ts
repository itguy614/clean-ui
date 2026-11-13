import { definePlugin } from "../define-plugin";
import { toggleLinePrefixCommand } from "./toggle-line-prefix";

export const numberedListPlugin = definePlugin({
  id: "cui-numbered-list",
  commands: {
    numberedList: {
      ...toggleLinePrefixCommand({ match: /^\d+\.\s/, insert: (index) => `${index + 1}. ` }),
      label: "Numbered list",
      icon: "list-numbered",
    },
  },
  toolbar: [{ command: "numberedList" }],
  keymap: [{ key: "Mod-Shift-7", command: "numberedList" }],
  constructs: ["OrderedList"],
  decorationNodes: ["OrderedList"],
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
