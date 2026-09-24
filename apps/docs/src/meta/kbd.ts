import type { ComponentMeta } from "./types";
import { clampedSizeProp, hiddenProp } from "./shared";

const meta: ComponentMeta = {
  name: "Kbd",
  description: "Renders a keyboard key as a keycap — a real <kbd> element, for documenting shortcuts inline.",

  props: [
    clampedSizeProp("sm, md and lg", "md", "Keycap size"),
    hiddenProp,
  ],

  slots: [{ name: "default", description: "The key label — a glyph (⌘, ⇧, ⏎) or a word (Esc, Space, F5)" }],
};

export default meta;
