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
