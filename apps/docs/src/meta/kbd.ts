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

  tokens: [
    { name: "--cui-kbd-bg", default: "var(--cui-surface-base)", description: "The keycap's fill" },
    { name: "--cui-kbd-color", default: "var(--cui-text-secondary)", description: "The key label's colour" },
    { name: "--cui-kbd-border", default: "var(--cui-border)", description: "The keycap's border colour, its thicker bottom edge and its shadow line" },
    { name: "--cui-kbd-radius", default: "0.25rem", description: "The keycap's corner radius" },
    { name: "--cui-kbd-font-size", default: "0.75rem (size)", description: "The label's text size" },
    { name: "--cui-kbd-px", default: "0.375rem (size and density)", description: "Horizontal padding" },
    { name: "--cui-kbd-py", default: "0.125rem (size and density)", description: "Vertical padding. The minimum width follows the size preset and has no token" },
  ],
};

export default meta;
