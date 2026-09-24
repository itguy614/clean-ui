// ============================================================
// Shared cross-component types & base prop interfaces
// ("mixin" props — composed via `interface X extends ...`)
// ============================================================

/** Semantic color roles. The three `surface*` entries are neutral
 *  intensity steps (all mode-aware). */
export type CuiColor =
  | "primary"
  | "secondary"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "surface"
  | "surface-light"
  | "surface-dark";

/** Canonical size scale. Components support a subset and clamp the rest
 *  via `clampSize()` from utils/sizing. */
export type CuiSize = "xs" | "sm" | "md" | "lg" | "xl";

/** Canonical border-radius scale (mirrors CuiButton). */
export type CuiRounded = "none" | "sm" | "md" | "lg" | "full";

/** Layout axis for groups/segmented components. */
export type CuiOrientation = "horizontal" | "vertical";

/** Orientation that can auto-resolve based on item count (form-control groups). */
export type CuiAutoOrientation = CuiOrientation | "auto";

/** Shared stylistic variant vocabulary. Components pick the subset they
 *  support; structural variants (bar/circle, ring/dots/bars, …) stay local. */
export type CuiVariant = "solid" | "outline" | "subtle" | "ghost" | "dash";

/** A color value that accepts a role (mapped to its token) OR any raw CSS
 *  color string. Used by paint components (Icon, Divider, Backdrop). */
export type CuiColorOrCss = CuiColor | (string & {});

/**
 * Element a component's title renders as — a heading level, or `div` to opt out.
 *
 * Shared by every component with a `title` convenience prop (`CuiCardHeader`,
 * `CuiModalHeader`, `CuiConfirmDialog`), so the vocabulary stays one thing.
 */
export type CuiTitleAs = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "div";

// --- Base prop "mixins" ---

/** Every component can be hidden via `v-show`. */
export interface HideableProps {
  /** Hide the component (v-show) */
  hidden?: boolean;
}

/** Components with a semantic color role. */
export interface ColorableProps {
  /** Color role */
  color?: CuiColor;
}

/** Components with a size on the canonical scale. */
export interface SizeableProps {
  /** Size */
  size?: CuiSize;
}

/** Components that can be disabled. */
export interface DisableableProps {
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Screen-reader live-region mode for ephemeral feedback components
 * (Toast / Alert / Banner).
 *  - `"polite"`     — announced when the screen reader is idle (`role="status"`)
 *  - `"assertive"`  — interrupts immediately (`role="alert"`)
 *  - `"off"`        — no live region (decorative / static content)
 */
export type LiveRegionMode = "off" | "polite" | "assertive";

/** Components that announce to screen readers via an ARIA live region. */
/**
 * The role icon on a feedback component — CuiAlert, CuiToast, CuiBanner. Alongside an
 * `#icon` slot, which replaces the icon with arbitrary content.
 */
/**
 * For components whose `title` prop renders a heading.
 *
 * A title that looks like a heading should be one — a `<div>` is invisible to heading
 * navigation and absent from the document outline (#129). The right *level* depends on
 * where the component sits, which the component cannot know, so it is the caller's:
 * `h2` under a page `h1`, `h4` inside an `h3` section. `div` opts out for a title that
 * is decorative rather than structural.
 *
 * Each component sets its own default in `withDefaults` — `h3` for a card, `h2` for a
 * dialog, which starts a fresh accessible context.
 */
export interface TitleAsProps {
  /** Element the title renders as. See {@link CuiTitleAs}. */
  titleAs?: CuiTitleAs;
}

export interface RoleIconProps {
  /**
   * Replace the role icon. A name in the static icon registry (built-ins plus
   * `registerIcons()`) renders that icon; anything else — an emoji, a character —
   * renders as text. A name resolvable only through the optional lazy resolver is not
   * known statically and renders as text.
   */
  icon?: string;
  /** Hide the role icon entirely. */
  noIcon?: boolean;
}

export interface LiveRegionProps {
  /**
   * Screen-reader live-region mode. Defaults from `color`: `error` → assertive
   * (`role="alert"`), everything else → polite (`role="status"`). Set `"off"`
   * for purely decorative/static feedback that shouldn't be announced.
   */
  live?: LiveRegionMode;
}

/** Shared surface for form controls (label/description/validation/readonly). */
export interface FormControlProps extends DisableableProps {
  /** Label text */
  label?: string;
  /** Description / helper text */
  description?: string;
  /** Show error state */
  error?: boolean;
  /** Error message displayed below the control */
  errorMessage?: string;
  /** Mark the control as required */
  required?: boolean;
  /** Readonly state */
  readonly?: boolean;
}

/**
 * Attributes that belong on a form control's **native focusable element**, not
 * on its wrapper.
 *
 * Without these declared as props, Vue's attribute fallthrough drops them on
 * the component's single root — `.cui-input-wrapper`, `.cui-select`, and so on
 * — which is a plain `<div>`. A `<label for>` then points at something that
 * cannot be focused or labelled, so clicking the label does nothing and screen
 * readers never form the label/control association (#78). `name` and
 * `autocomplete` are equally useless on a wrapper: the browser only reads them
 * off a real form control.
 *
 * Declaring them here takes them out of `$attrs`, so they stop landing on the
 * wrapper and the component binds them where they belong. `class` and `style`
 * still fall through to the wrapper, which is where consumers expect them.
 *
 * `CuiFormField` supplies `id`, `ariaDescribedby` and `ariaLabelledby` through
 * its slot bindings, so `v-bind="f"` wires all of this up on its own.
 */
export interface AriaLabelableProps {
  /** id of the element — what a `<label for>` has to point at, where it can. */
  id?: string;
  /** id(s) of the text describing this control — help text, error message. */
  ariaDescribedby?: string;
  /**
   * id(s) of the element labelling this control.
   *
   * The only way to name something `<label for>` cannot reach: a group has no
   * single control to point at, and `CuiSelect`'s trigger is a
   * `div[role="combobox"]`, which is not a *labelable* element. `for`/`id`
   * silently forms no association with either, so without this they are unnamed.
   */
  ariaLabelledby?: string;
  /**
   * Marks the control as required for assistive tech.
   *
   * `CuiFormField`'s visible marker is an asterisk, which is decorative and `aria-hidden`,
   * so required-ness reached assistive tech through no path at all (#175). This rides the
   * same plumbing as `ariaDescribedby`: declared once here, inherited by every control, and
   * supplied automatically by `CuiFormField`.
   *
   * Deliberately `aria-required` rather than the native `required` attribute — the latter
   * switches on browser validation and would change form behaviour, not just announce it.
   */
  ariaRequired?: boolean;
}

export interface NativeControlProps extends AriaLabelableProps {
  /** Native control name, for form serialization and browser autofill. */
  name?: string;
  /** Native autocomplete hint, e.g. `"email"`, `"street-address"`, `"off"`. */
  autocomplete?: string;
}
