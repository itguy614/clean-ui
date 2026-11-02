import type { ComponentMeta } from "./types";
import { hiddenProp } from "./shared";

const meta: ComponentMeta = {
  name: "Toolbar",
  description:
    "A strip of controls with a single tab stop: Tab enters and leaves it however many controls it holds, and the arrow keys move between them. It composes buttons, button groups, selects and separators rather than rendering its own.",
  interactive: true,

  props: [
    {
      name: "label",
      type: "string",
      description: "The toolbar's accessible name. A toolbar needs one — this, aria-label or aria-labelledby — and warns in the console without",
    },
    { name: "aria-label", type: "string", description: "The same as label, as an attribute. label wins if both are set" },
    {
      name: "aria-labelledby",
      type: "string",
      description: "id(s) of visible text naming the toolbar. Takes precedence over label",
    },
    {
      name: "orientation",
      type: "horizontal | vertical",
      default: "horizontal",
      description: "Which way the controls run, and so which arrow keys move between them: Left/Right or Up/Down",
    },
    {
      name: "overflow",
      type: "wrap | scroll",
      default: "wrap",
      description:
        "A toolbar longer than its container. `wrap` breaks onto another line; `scroll` keeps one line in a CuiScrollArea, faded at an edge with more past it",
    },
    { name: "loop", type: "boolean", default: "false", description: "An arrow past the last control comes round to the first, and back" },
    {
      name: "itemSelector",
      type: "string",
      default: '".cui-button, [role=\'combobox\']:not(input)"',
      description:
        "Which descendants share the tab stop. The default is every CuiButton (in a CuiButtonGroup or not) and CuiSelect. Anything unmatched, such as a text input, keeps its own tab stop and its own keys",
    },
    hiddenProp,
  ],

  slots: [
    {
      name: "default",
      description: "The controls: CuiButton, CuiButtonGroup, CuiSelect, CuiDropdown and CuiPopover triggers, and CuiToolbarSeparator between sets. A select or dropdown keeps the vertical arrows to open itself, so it belongs in a horizontal toolbar",
    },
  ],

  methods: [
    { name: "el", signature: "HTMLElement | null", description: "The toolbar element" },
    { name: "focus", signature: "(options?: FocusOptions) => void", description: "Focus the control holding the tab stop" },
    { name: "blur", signature: "() => void", description: "Blur whichever control inside the toolbar has focus" },
  ],

  tokens: [
    { name: "--cui-toolbar-gap", default: "0.25rem × density", description: "Space between controls" },
    {
      name: "--cui-toolbar-px",
      default: "0 (scroll: 0.25rem)",
      description: "Inline padding. In scroll mode it is the scroller's, and its default leaves room for a focus ring the scroller would otherwise clip",
    },
    { name: "--cui-toolbar-py", default: "0 (scroll: 0.25rem)", description: "Block padding, as above" },
    { name: "--cui-toolbar-bg", default: "transparent", description: "Background" },
    { name: "--cui-toolbar-border", default: "none", description: "Border shorthand, e.g. `1px solid var(--cui-border)`" },
    { name: "--cui-toolbar-radius", default: "0", description: "Corner radius. The scroll area's fades follow it" },
    { name: "--cui-toolbar-separator-bg", default: "var(--cui-border)", description: "CuiToolbarSeparator's colour" },
  ],

  parts: [
    {
      name: "CuiToolbarSeparator",
      props: [hiddenProp],
    },
  ],
};

export default meta;
