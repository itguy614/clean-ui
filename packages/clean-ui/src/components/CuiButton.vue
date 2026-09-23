<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue";
import type { Component } from "vue";
import CuiIcon from "./CuiIcon.vue";
import { BUTTON_SIZE_SCALE } from "../utils/sizing";
import { warnVariantColor } from "../utils/devWarn";
import type {
  CuiColor,
  CuiRounded,
  HideableProps,
  ColorableProps,
  SizeableProps,
  DisableableProps,
} from "../types/common";

export type ButtonVariant = "solid" | "outline" | "dash" | "ghost";

export interface CuiButtonProps
  extends HideableProps,
    ColorableProps,
    SizeableProps,
    DisableableProps {
  /** Visual variant */
  variant?: ButtonVariant;
  /** Border radius */
  rounded?: CuiRounded;
  /** HTML button type */
  type?: "button" | "submit" | "reset";
  /** Render as a link (<a>) with this href */
  href?: string;
  /** Render as a <router-link> with this route */
  to?: string | object;
  /** Loading state — shows spinner and disables interaction */
  loading?: boolean;
  /**
   * Icon-only button: square, with no horizontal padding.
   *
   * Also opts out of the `--cui-control-min-target` floor, so an `xs` button at compact
   * density can go below the 24px WCAG 2.5.8 minimum. That is the only size/density
   * combination where the floor currently binds.
   */
  icon?: boolean;
}

const props = withDefaults(defineProps<CuiButtonProps>(), {
  color: "primary",
  variant: "outline",
  size: "md",
  rounded: "md",
  type: "button",
  loading: false,
  disabled: false,
  hidden: false,
  icon: false,
});

warnVariantColor("CuiButton", { value: props.variant, allowed: ["solid", "outline", "dash", "ghost"] }, props.color);

const isDisabled = computed(() => props.disabled || props.loading);

// Determine the root element tag
const tag = computed<string | Component>(() => {
  if (props.to) return "router-link";
  if (props.href) return "a";
  return "button";
});

// Build root element attributes based on tag
const rootAttrs = computed(() => {
  if (props.to) {
    return { to: props.to, ...(isDisabled.value ? { "aria-disabled": "true", tabindex: "-1" } : {}) };
  }
  if (props.href) {
    return {
      href: isDisabled.value ? undefined : props.href,
      role: "button",
      ...(isDisabled.value ? { "aria-disabled": "true", tabindex: "-1" } : {}),
    };
  }
  return {
    type: props.type,
    disabled: isDisabled.value || undefined,
    "aria-disabled": isDisabled.value || undefined,
  };
});

// Expose element ref and focus method
const elRef = useTemplateRef<HTMLElement>("buttonRef");

function focus(opts?: FocusOptions) {
  elRef.value?.focus(opts);
}

function blur() {
  elRef.value?.blur();
}

defineExpose({ el: elRef, focus, blur });

const radiusMap: Record<CuiRounded, string> = {
  none: "0",
  sm: "0.25rem",
  md: "var(--cui-button-radius, 0.375rem)",
  lg: "0.5rem",
  full: "9999px",
};

/**
 * Every value this component computes is emitted as a PRIVATE `--_button-*` custom
 * property, never as a bare declaration. The stylesheet below reads each one as
 * `var(--cui-button-<slot>, var(--_button-<slot>))`, so the public token wins wherever a
 * consumer sets it — including on an ancestor — and this computed value is the default.
 *
 * Emitting the *public* token here instead would look simpler and be wrong: an inline
 * custom property beats an inherited one, so `.toolbar { --cui-button-bg: … }` on a
 * container could never take effect. See "Themeable properties" in CLAUDE.md (#114).
 */
const buttonStyle = computed(() => {
  const c = props.color;
  const v = props.variant;
  const s = BUTTON_SIZE_SCALE[props.size];

  const base: Record<string, string> = {
    "--_button-height": s.height,
    "--_button-px": props.icon ? "0px" : s.px,
    "--_button-font-size": s.fontSize,
    "--_button-gap": s.gap,
    "--_button-radius": radiusMap[props.rounded],
    "--_button-focus-ring": `var(--cui-${c}-focus-ring)`,
    // An icon button is its own opt-out of the target-size floor (#118). Set on the
    // element itself, so it relaxes this button without touching anything around it.
    ...(props.icon ? { "--cui-control-min-target": "0px" } : {}),
  };

  if (v === "solid") {
    return {
      ...base,
      "--_button-bg": `var(--cui-${c}-solid, var(--cui-${c}))`,
      "--_button-color": `var(--cui-${c}-text)`,
      "--_button-border": "1px solid transparent",
      "--_button-hover-bg": `var(--cui-${c}-solid-hover, var(--cui-${c}-hover))`,
      "--_button-active-bg": `var(--cui-${c}-solid-active, var(--cui-${c}-active))`,
    };
  }

  if (v === "outline" || v === "dash") {
    return {
      ...base,
      "--_button-bg": "transparent",
      "--_button-color": `var(--cui-${c})`,
      "--_button-border": `1px ${v === "dash" ? "dashed" : "solid"} var(--cui-border-strong)`,
      "--_button-hover-bg": `var(--cui-${c}-bg)`,
      "--_button-hover-color": `var(--cui-${c}-hover)`,
      "--_button-hover-border": `var(--cui-${c})`,
      "--_button-active-bg": `var(--cui-${c}-subtle)`,
    };
  }

  // ghost
  return {
    ...base,
    "--_button-bg": "transparent",
    "--_button-color": `var(--cui-${c})`,
    "--_button-border": "1px solid transparent",
    "--_button-hover-bg": `var(--cui-${c}-bg)`,
    "--_button-hover-color": `var(--cui-${c}-hover)`,
    "--_button-active-bg": `var(--cui-${c}-subtle)`,
  };
});
</script>

<template>
  <component
    :is="tag"
    v-show="!hidden"
    ref="buttonRef"
    class="cui-button"
    :class="{ 'cui-button--disabled': isDisabled, 'cui-button--icon': icon }"
    :style="buttonStyle"
    v-bind="rootAttrs"
    :aria-busy="loading || undefined"
  >
    <!-- Prefix slot (icons, badges) -->
    <span v-if="$slots.prefix" class="cui-button__prefix">
      <slot name="prefix" />
    </span>

    <!-- Spinner overlay -->
    <span v-if="loading" class="cui-button__spinner" aria-hidden="true">
      <CuiIcon name="circle-notch" size="1em" class="cui-button__spinner-svg" />
    </span>

    <!-- Default content -->
    <span v-if="$slots.default" :class="{ 'opacity-0': loading }" class="cui-button__content">
      <slot />
    </span>

    <!-- Suffix slot (icons, badges) -->
    <span v-if="$slots.suffix" class="cui-button__suffix">
      <slot name="suffix" />
    </span>
  </component>
</template>

<style scoped>
/* --- Themeable ---
   Wrapped in `:where()` so these land at specificity (0,0,0). Vue's scoped compiler puts
   the `[data-v-…]` attribute INSIDE the bracket, where `:where()` zeroes it along with
   everything else — scoping still works, the specificity does not. That is what lets a
   consumer override with a plain `.cui-button { … }` rule instead of `!important` (#114).

   Note the state rules put the whole compound inside the bracket: `:where(.cui-button):hover`
   would be (0,1,0), because the `:hover` sits outside it. */
:where(.cui-button) {
  height: var(--cui-button-height, var(--_button-height));
  padding-inline: var(--cui-button-px, var(--_button-px));
  font-size: var(--cui-button-font-size, var(--_button-font-size));
  gap: var(--cui-button-gap, var(--_button-gap));
  border-radius: var(--cui-button-radius, var(--_button-radius));
  background: var(--cui-button-bg, var(--_button-bg));
  color: var(--cui-button-color, var(--_button-color));
  border: var(--cui-button-border, var(--_button-border));
  /* For the spinner overlay. Themeable so a consumer can reposition the button — the
     editor's floating mode-toggle needed `position: absolute !important` without this. */
  position: relative;
}

/* The hover colour falls back to the RESTING colour, not to `inherit`. Only the outline,
   dash and ghost variants change colour on hover; solid keeps its own. With `inherit` the
   solid variant took the surrounding text colour on hover — dark text on a dark fill —
   because both rules are stylesheet rules now and this one comes later. It was masked
   while the resting colour was an inline declaration, which outranked this rule outright
   (#114). Falling back to the resting value means a variant that omits a hover colour
   simply keeps the one it has. */
:where(.cui-button:hover:not(.cui-button--disabled)) {
  background: var(--cui-button-hover-bg, var(--_button-hover-bg));
  color: var(--cui-button-hover-color, var(--_button-hover-color, var(--cui-button-color, var(--_button-color))));
  border-color: var(--cui-button-hover-border, var(--_button-hover-border, transparent));
}

:where(.cui-button:active:not(.cui-button--disabled)) {
  background: var(--cui-button-active-bg, var(--_button-active-bg));
}

:where(.cui-button:focus-visible) {
  outline: 2px solid var(--cui-button-focus-ring, var(--_button-focus-ring));
  outline-offset: 2px;
}

/* Square. The horizontal padding is already 0 via `--_button-px` from the style binding;
   the aspect ratio is what makes the width track the height. */
:where(.cui-button--icon) {
  aspect-ratio: 1;
}

/* --- Structural ---
   Not themeable, so left at normal specificity: changing these breaks the component
   rather than restyling it. */
.cui-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  white-space: nowrap;
  user-select: none;
  text-decoration: none;
}

.cui-button--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Native disabled (button element) */
.cui-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* aria-disabled (links) — prevent click via CSS */
.cui-button[aria-disabled="true"] {
  pointer-events: none;
}

/* --- Slots --- */
.cui-button__prefix,
.cui-button__suffix {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

/* --- Spinner --- */
.cui-button__spinner {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cui-button__spinner-svg {
  animation: cui-spin 0.6s linear infinite;
}

.cui-button__content {
  display: inline-flex;
  align-items: center;
  gap: inherit;
}

/* cui-spin keyframe defined in main.css */
</style>
