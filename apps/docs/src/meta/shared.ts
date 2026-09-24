import type { PropRow, SlotRow } from "./types";

/**
 * Prop rows shared by many components, mirroring the mixins in the library's
 * `types/common.ts`. They were written out per component and had already started to
 * drift in wording; a mixin described in five places is the same problem the metadata
 * modules exist to solve.
 */

/** `NativeControlProps` — every component wrapping a real form control. */
export const nativeControlProps: PropRow[] = [
  {
    name: "id",
    type: "string",
    description:
      "id of the native control — what a label's for attribute must point at. CuiFormField supplies it automatically",
  },
  { name: "name", type: "string", description: "Native control name, for form serialization and browser autofill" },
  { name: "autocomplete", type: "string", description: "Native autocomplete hint, e.g. email, street-address, off" },
  {
    name: "aria-describedby",
    type: "string",
    description: "id(s) of describing text. CuiFormField points this at its help text or error message",
  },
  {
    name: "aria-labelledby",
    type: "string",
    description: "id(s) of the labelling element. CuiFormField points this at its label",
  },
];

/** `HideableProps`. */
export const hiddenProp: PropRow = {
  name: "hidden",
  type: "boolean",
  default: "false",
  description: "Hide the component (v-show)",
};

/** `DisableableProps`. */
export const disabledProp: PropRow = {
  name: "disabled",
  type: "boolean",
  default: "false",
  description: "Disabled state",
};

/** `SizeableProps`, for a control that sizes itself from `INPUT_SIZE_SCALE`. */
export const inputSizeProp: PropRow = {
  name: "size",
  type: "xs | sm | md | lg | xl",
  default: "md",
  description: "Size, from the shared input scale — matches CuiInput and CuiSelect at the same value",
};

/** `CuiRounded`. */
export const roundedProp: PropRow = {
  name: "rounded",
  type: "none | sm | md | lg | full",
  default: "md",
  description: "Border radius",
};

/** The nine color roles, as the type column spells them. The Playground splits this on `|`. */
export const COLOR_ROLES =
  "primary | secondary | success | error | warning | info | surface | surface-light | surface-dark";

/** `ColorableProps`. */
export const colorProp = (description: string, dflt = "primary"): PropRow => ({
  name: "color",
  type: COLOR_ROLES,
  default: dflt,
  description,
});

/** `LiveRegionProps` — the feedback components. */
export const liveProp: PropRow = {
  name: "live",
  type: "off | polite | assertive",
  default: "from color",
  description:
    "Screen-reader live region. error → assertive (role=alert), else polite (role=status). off to silence",
};

/** `RoleIconProps` — CuiAlert, CuiToast, CuiBanner. */
export const roleIconProps: PropRow[] = [
  {
    name: "icon",
    type: "string",
    description:
      "Replace the role icon. A name in the static icon registry renders that icon; anything else — an emoji, a character — renders as text",
  },
  { name: "noIcon", type: "boolean", default: "false", description: "Hide the role icon entirely" },
];

/** The `#icon` slot that accompanies `roleIconProps`. */
export const roleIconSlot: SlotRow = {
  name: "icon",
  description: "Replaces the role icon entirely — a spinner, an avatar, anything",
};

/** `TitleAsProps` — the components whose `title` prop renders a heading. */
export const titleAsProp = (dflt: string): PropRow => ({
  name: "titleAs",
  type: "h1 | h2 | h3 | h4 | h5 | h6 | div",
  default: dflt,
  description:
    "Element the title renders as. Set it to match the surrounding document's heading level, or div for a decorative title",
});

/**
 * `SizeableProps` for a component that takes the full `CuiSize` but styles only a subset
 * via `clampSize()` — the majority of them.
 *
 * Written out by hand in seven modules during the #130 batches, with the wording already
 * drifting between them.
 */
export const clampedSizeProp = (supported: string, dflt = "md", what = "Size"): PropRow => ({
  name: "size",
  type: "xs | sm | md | lg | xl",
  default: dflt,
  description: `${what}. Only ${supported} are styled — the others clamp to the nearest of those`,
});

/**
 * `CuiColorOrCss` — the paint components (Icon, Divider, Backdrop), which take a role name
 * *or* any raw CSS colour.
 *
 * `type` deliberately stays as the role list with no `| <css-color>` pseudo-member: the
 * Playground splits `type` on `|` to build its select, so a pseudo-token would become a
 * bogus option. The raw-CSS half belongs in the description.
 */
export const colorOrCssProp = (description: string, dflt = "—"): PropRow => ({
  name: "color",
  type: COLOR_ROLES,
  default: dflt,
  description: `${description}. A role name maps to its token; any other CSS color passes straight through`,
});

/**
 * `v-model:visible`, on every overlay.
 *
 * A factory rather than a constant because Popover and Tooltip have no `false` default —
 * `visible` is optional there.
 */
export const visibleProp = (dflt?: string): PropRow => ({
  name: "v-model:visible",
  type: "boolean",
  ...(dflt ? { default: dflt } : {}),
  description: "Whether the overlay is open",
});

/**
 * A Tailwind spacing-scale prop, as the layout components take it.
 *
 * Spelling the 35-member union in the `type` column is useless to a reader, and printing
 * the TypeScript name (`ResponsiveValue<TailwindSpacing>`) is unresolvable on a docs page —
 * so the type column names the scale and the description carries the responsive half.
 */
export const spacingProp = (name: string, description: string, dflt?: string): PropRow => ({
  name,
  type: "TailwindSpacing",
  ...(dflt ? { default: dflt } : {}),
  description: `${description}. Accepts a responsive object, e.g. { base: 2, md: 4 }`,
});
