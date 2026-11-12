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
      name: "ariaLabel",
      type: "string",
      default: "Scrollable code",
      description: "The code region's accessible name while the block scrolls. The default is the codeBlock.region message",
    },
    {
      name: "size",
      type: "xs | sm | md | lg | xl",
      default: "md",
      description: "Font size, line height and padding. Only sm, md and lg are styled",
    },
    hiddenProp,
  ],

  tokens: [
    { name: "--cui-code-block-bg", default: "var(--color-surface-950)", description: "The block's fill" },
    { name: "--cui-code-block-border", default: "var(--cui-border)", description: "The block's border colour" },
    { name: "--cui-code-block-radius", default: "0.5rem", description: "The block's corner radius" },
    { name: "--cui-code-block-color", default: "var(--color-surface-200)", description: "Code text colour" },
    { name: "--cui-code-block-font-size", default: "0.8125rem (size)", description: "Code and line-number text size. The line height and the header title size follow the size preset and have no token" },
    { name: "--cui-code-block-px", default: "1rem (size and density)", description: "Horizontal padding of the header, the gutter and the code" },
    { name: "--cui-code-block-py", default: "1rem (size and density)", description: "Vertical padding of the code area" },
    { name: "--cui-code-block-focus-ring", default: "var(--cui-primary-focus-ring)", description: "Focus ring colour on the scrolling code area" },
  ],
};

export default meta;
