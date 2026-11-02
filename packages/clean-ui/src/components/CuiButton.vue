<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue";
import type { Component } from "vue";
import CuiIcon from "./CuiIcon.vue";
import { BUTTON_SIZE_SCALE, RADIUS_SCALE } from "../utils/sizing";
import { warnVariantColor } from "../utils/devWarn";
import { disabledLink } from "../utils/disabled-link";
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
  /**
   * Keep a disabled or loading `<button>` focusable (#396). It gets `aria-disabled="true"`
   * and the disabled look instead of native `disabled`, so it stays in the tab order and
   * keeps focus when it becomes disabled under the keyboard (a request in flight). A click,
   * Enter or Space does nothing, but `contextmenu` and long-press still reach a wrapping
   * CuiContextMenu. The WAI-ARIA pattern for a disabled control in a toolbar. No effect on
   * a link, which is never focusable while disabled.
   */
  focusableWhenDisabled?: boolean;
  /**
   * A toggle button's state (#396): renders `aria-pressed` and a selected look for the
   * current `variant` and `color`, themeable through `--cui-button-pressed-bg`, `-color` and
   * `-border`. Leave it unset for a button that isn't a toggle — no `aria-pressed` at all.
   */
  pressed?: boolean;
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
  focusableWhenDisabled: false,
  // Not `false`: a boolean prop with no default is cast to `false`, and `false` here means
  // "a toggle that is off", which renders `aria-pressed="false"`.
  pressed: undefined,
});

warnVariantColor("CuiButton", { value: props.variant, allowed: ["solid", "outline", "dash", "ghost"] }, props.color);

const isDisabled = computed(() => props.disabled || props.loading);

/**
 * The root element and its attributes. A disabled link drops its target, through the helper
 * CuiListItem shares (#422).
 */
const root = computed((): { is: string | Component; attrs: Record<string, unknown> } => {
  // A `to` button is a link, so it stays one; an `href` button is `role="button"` either way.
  const dead = disabledLink(props, isDisabled.value, props.to ? "link" : "button");
  if (dead) return dead;
  if (props.to) return { is: "router-link", attrs: { to: props.to } };
  if (props.href) return { is: "a", attrs: { href: props.href, role: "button" } };
  return {
    is: "button",
    attrs: {
      type: props.type,
      disabled: (isDisabled.value && !props.focusableWhenDisabled) || undefined,
      "aria-disabled": isDisabled.value ? "true" : undefined,
      // Tells CuiToolbar's roving focus to keep it in the arrow-key order (#396).
      "data-cui-focusable-disabled": (isDisabled.value && props.focusableWhenDisabled) || undefined,
    },
  };
});

/**
 * Holds every click back while disabled. Native `disabled` does that for a plain button; a
 * focusable disabled one and a disabled link (an `<a>` without `href` still fires `click`)
 * need it here. In the capture phase, and first among the element's capture listeners (the
 * component's own come before fallthrough ones), so `stopImmediatePropagation` reaches
 * every listener a consumer put on the button, `@click`, `@click.capture` and ancestors'
 * bubbling ones alike. `preventDefault` cancels a submit button's form submission too, Enter
 * in a field included: implicit submission is a click on the default button.
 */
function onClickCapture(event: MouseEvent) {
  if (!isDisabled.value) return;
  event.preventDefault();
  event.stopImmediatePropagation();
}

// Expose element ref and focus method
const elRef = useTemplateRef<HTMLElement>("buttonRef");

function focus(opts?: FocusOptions) {
  elRef.value?.focus(opts);
}

function blur() {
  elRef.value?.blur();
}

defineExpose({ el: elRef, focus, blur });

/**
 * A pressed toggle's look (#396). Subtle-first like every other selected state: the tinted
 * fill, a role-coloured edge and the stronger text colour, so it reads apart from the
 * unpressed button's hover, which has the fill but neither of the other two. Solid is the
 * exception, already filled: it takes the darker shade its hover uses.
 */
function pressedPaint(c: CuiColor, v: ButtonVariant): Record<string, string> {
  if (v === "solid") {
    return {
      "--_button-pressed-bg": `var(--cui-${c}-solid-hover, var(--cui-${c}-hover))`,
      "--_button-pressed-color": `var(--cui-${c}-text)`,
      "--_button-pressed-border": "1px solid transparent",
    };
  }
  // Ghost and outline both gain a solid edge (ghost the lighter one); dash keeps its dashes.
  const style = v === "dash" ? "dashed" : "solid";
  const edge = v === "ghost" ? `var(--cui-${c}-border)` : `var(--cui-${c})`;
  return {
    "--_button-pressed-bg": `var(--cui-${c}-bg)`,
    "--_button-pressed-color": `var(--cui-${c}-hover)`,
    "--_button-pressed-border": `1px ${style} ${edge}`,
  };
}


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
    "--_button-radius": RADIUS_SCALE[props.rounded],
    "--_button-focus-ring": `var(--cui-${c}-focus-ring)`,
    // An icon button is its own opt-out of the target-size floor (#118). Set on the
    // element itself, so it relaxes this button without touching anything around it.
    ...(props.icon ? { "--cui-control-min-target": "0px" } : {}),
    ...(props.pressed ? pressedPaint(c, v) : {}),
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
    :is="root.is"
    v-show="!hidden"
    ref="buttonRef"
    class="cui-button"
    :class="{
      'cui-button--disabled': isDisabled,
      'cui-button--icon': icon,
      'cui-button--pressed': pressed,
      'cui-button--ghost': variant === 'ghost',
      // Draws no edge, so CuiButtonGroup doesn't merge corners against it. A pressed ghost
      // button has one (#396).
      'cui-button--edgeless': variant === 'ghost' && !pressed,
    }"
    :style="buttonStyle"
    v-bind="root.attrs"
    :aria-busy="loading || undefined"
    :aria-pressed="pressed"
    @click.capture="onClickCapture"
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

/* After the hover rule, so a pressed toggle keeps its look under the pointer, and before the
   active rule, so pressing it still gives feedback. */
:where(.cui-button--pressed) {
  background: var(--cui-button-pressed-bg, var(--_button-pressed-bg));
  color: var(--cui-button-pressed-color, var(--_button-pressed-color));
  border: var(--cui-button-pressed-border, var(--_button-pressed-border));
}

:where(.cui-button:active:not(.cui-button--disabled)) {
  background: var(--cui-button-active-bg, var(--_button-active-bg));
  /* Press feedback (#261): a brief shrink, `--cui-press-scale` (0.97; 1 turns it off, as
     reduced motion does). */
  transform: scale(var(--cui-press-scale, 0.97));
}

/* Pressing a pressed toggle mixes a little of its text colour into its fill. The variant's
   active fill can't be used: it is drawn for the unpressed button's text (a ghost's pale tint
   would take the white text of a solid pressed look), and for solid it is the pressed shade's
   neighbour. */
:where(.cui-button--pressed:active:not(.cui-button--disabled)) {
  background: color-mix(in srgb, var(--cui-button-pressed-bg, var(--_button-pressed-bg)) 85%, currentColor);
}

/* In the rule rather than only on the token, so a consumer's --cui-press-scale can't turn
   the press back on for someone who asked for less motion. */
@media (prefers-reduced-motion: reduce) {
  :where(.cui-button:active) {
    transform: none;
  }
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
  transition:
    background var(--cui-duration-fast) ease,
    color var(--cui-duration-fast) ease,
    border-color var(--cui-duration-fast) ease,
    transform var(--cui-duration-press) var(--cui-ease-out);
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
