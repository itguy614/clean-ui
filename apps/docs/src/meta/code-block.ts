import type { ComponentMeta } from "./types";
import { hiddenProp } from "./shared";

const meta: ComponentMeta = {
  name: "Code Block",
  description:
    "Code display with a language or filename header, optional line numbers, line highlighting and a copy button. Always dark, so code reads the same in both modes.",

  props: [
    { name: "code", type: "string", default: "— (required)", description: "The code to display, verbatim. Newlines split it into lines" },
    {
      name: "language",
      type: "string",
      description: "Language label shown uppercased in the header. A label only — there is no syntax highlighting",
    },
    { name: "filename", type: "string", description: "Filename for the header. Takes precedence over language and is not uppercased" },
    { name: "lineNumbers", type: "boolean", default: "false", description: "Show the line-number gutter" },
    { name: "startLine", type: "number", default: "1", description: "Number the first line something other than 1 — for an excerpt" },
    {
      name: "highlightLines",
      type: "number[]",
      description: "Lines to call out, numbered as displayed (so relative to startLine). Tinted, with a primary-coloured left edge",
    },
    { name: "copyable", type: "boolean", default: "true", description: "Show the copy button, which copies code exactly" },
    { name: "maxHeight", type: "string", description: "Any CSS length. Past it the code area scrolls instead of growing" },
    {
      name: "size",
      type: "xs | sm | md | lg | xl",
      default: "md",
      description: "Font size, line height and padding. Only sm, md and lg are styled",
    },
    hiddenProp,
  ],
};

export default meta;
