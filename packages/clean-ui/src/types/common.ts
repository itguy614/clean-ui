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
