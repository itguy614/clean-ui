<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue";
import type { Component } from "vue";
import CuiIcon from "./CuiIcon.vue";
import { BUTTON_SIZE_SCALE } from "../utils/sizing";

export type ButtonColor = "primary" | "secondary" | "success" | "error" | "warning" | "info";
export type ButtonVariant = "solid" | "outline" | "dash" | "ghost";
export type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";
export type ButtonRounded = "sm" | "md" | "lg" | "full";

export interface CuiButtonProps {
  /** Color role */
  color?: ButtonColor;
  /** Visual variant */
  variant?: ButtonVariant;
  /** Size */
  size?: ButtonSize;
  /** Border radius */
  rounded?: ButtonRounded;
  /** HTML button type */
  type?: "button" | "submit" | "reset";
  /** Render as a link (<a>) with this href */
  href?: string;
  /** Render as a <router-link> with this route */
  to?: string | object;
  /** Loading state — shows spinner and disables interaction */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Hide the component */
  hidden?: boolean;
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
});

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

const radiusMap: Record<ButtonRounded, string> = {
  sm: "0.25rem",
  md: "var(--cui-button-radius, 0.375rem)",
  lg: "0.5rem",
  full: "9999px",
};

const buttonStyle = computed(() => {
  const c = props.color;
  const v = props.variant;
  const s = BUTTON_SIZE_SCALE[props.size];

  const base: Record<string, string> = {
    height: s.height,
    paddingLeft: s.px,
    paddingRight: s.px,
    fontSize: s.fontSize,
    gap: s.gap,
    borderRadius: radiusMap[props.rounded],
    "--_btn-focus-ring": `var(--cui-${c}-focus-ring)`,
  };

  if (v === "solid") {
    return {
      ...base,
      background: `var(--cui-${c}-solid, var(--cui-${c}))`,
      color: `var(--cui-${c}-text)`,
      border: "1px solid transparent",
      "--_btn-hover-bg": `var(--cui-${c}-solid-hover, var(--cui-${c}-hover))`,
      "--_btn-active-bg": `var(--cui-${c}-solid-active, var(--cui-${c}-active))`,
    };
  }

  if (v === "outline") {
    return {
      ...base,
      background: "transparent",
      color: `var(--cui-${c})`,
      border: `1px solid var(--cui-border-strong)`,
      "--_btn-hover-bg": `var(--cui-${c}-bg)`,
      "--_btn-hover-color": `var(--cui-${c}-hover)`,
      "--_btn-hover-border": `var(--cui-${c})`,
      "--_btn-active-bg": `var(--cui-${c}-subtle)`,
    };
  }

  if (v === "dash") {
    return {
      ...base,
      background: "transparent",
      color: `var(--cui-${c})`,
      border: `1px dashed var(--cui-border-strong)`,
      "--_btn-hover-bg": `var(--cui-${c}-bg)`,
      "--_btn-hover-color": `var(--cui-${c}-hover)`,
      "--_btn-hover-border": `var(--cui-${c})`,
      "--_btn-active-bg": `var(--cui-${c}-subtle)`,
    };
  }

  // ghost
  return {
    ...base,
    background: "transparent",
    color: `var(--cui-${c})`,
    border: "1px solid transparent",
    "--_btn-hover-bg": `var(--cui-${c}-bg)`,
    "--_btn-hover-color": `var(--cui-${c}-hover)`,
    "--_btn-active-bg": `var(--cui-${c}-subtle)`,
  };
});
</script>

<template>
  <component
    :is="tag"
    v-show="!hidden"
    ref="buttonRef"
    class="cui-button"
    :class="{ 'cui-button--disabled': isDisabled }"
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
    <span :class="{ 'opacity-0': loading }" class="cui-button__content">
      <slot />
    </span>

    <!-- Suffix slot (icons, badges) -->
    <span v-if="$slots.suffix" class="cui-button__suffix">
      <slot name="suffix" />
    </span>
  </component>
</template>

<style scoped>
.cui-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  white-space: nowrap;
  user-select: none;
  text-decoration: none;
}

.cui-button:hover:not(.cui-button--disabled) {
  background: var(--_btn-hover-bg) !important;
  color: var(--_btn-hover-color, inherit);
  border-color: var(--_btn-hover-border, transparent);
}

.cui-button:active:not(.cui-button--disabled) {
  background: var(--_btn-active-bg) !important;
}

.cui-button:focus-visible {
  outline: 2px solid var(--_btn-focus-ring);
  outline-offset: 2px;
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
