import type { ComponentMeta } from "./types";
import { hiddenProp } from "./shared";

const meta: ComponentMeta = {
  name: "Kbd",
  description: "Renders a keyboard key as a keycap — a real <kbd> element, for documenting shortcuts inline.",

  props: [
    {
      name: "size",
      type: "xs | sm | md | lg | xl",
      default: "md",
      description: "Keycap size. Only sm, md and lg are styled — xs and xl clamp to the nearest of those",
    },
    hiddenProp,
  ],

  slots: [{ name: "default", description: "The key label — a glyph (⌘, ⇧, ⏎) or a word (Esc, Space, F5)" }],
};

export default meta;
