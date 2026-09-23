/**
 * Per-component docs metadata — one source of truth for a component's API.
 *
 * `DocPage` renders the Props / Slots / Events / Customization sections from this, in that
 * order, and the Playground page builds its controls from the same `props` array (a `type`
 * of `"a | b | c"` parses straight into a select). Describing a prop in two places is how
 * the pages drifted apart in the first place, so there is deliberately only one.
 */

export interface PropRow {
  name: string;
  /** Union types are written `"solid | outline | dash | ghost"` — the Playground splits on `|`. */
  type: string;
  default?: string;
  description: string;
}

export interface SlotRow {
  name: string;
  /** Slot props, if the slot is scoped. */
  payload?: string;
  description: string;
}

export interface EventRow {
  name: string;
  payload: string;
  description: string;
}

/** A public `--cui-*` custom property (see "Themeable Properties" in CLAUDE.md). */
export interface TokenRow {
  name: string;
  /** What it falls back to when unset — often the computed per-variant value rather than a literal. */
  default: string;
  description: string;
}

export interface ComponentMeta {
  /** Display name, used for the page title and the Playground's component list. */
  name: string;
  /** One or two sentences under the title. */
  description: string;
  props?: PropRow[];
  slots?: SlotRow[];
  events?: EventRow[];
  tokens?: TokenRow[];
  /**
   * Whether the component is focusable or keyboard-operable. Interactive components must
   * document an Accessibility section; layout and display ones need not.
   */
  interactive?: boolean;
}
