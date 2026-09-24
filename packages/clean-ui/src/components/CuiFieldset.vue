<script setup lang="ts">
import { ref, computed, watch } from "vue";
import CuiIcon from "./CuiIcon.vue";
import type { CuiRounded, HideableProps, ColorableProps, DisableableProps } from "../types/common";

export type FieldsetVariant = "outline" | "subtle" | "ghost";

export interface CuiFieldsetProps extends HideableProps, ColorableProps, DisableableProps {
  /** Legend text */
  legend: string;
  /** Description text below the legend */
  description?: string;
  /** Visual variant: bordered outline, tinted subtle fill, or chrome-less ghost */
  variant?: FieldsetVariant;
  /** Border radius (mirrors CuiButton) */
  rounded?: CuiRounded;
  /** Allow collapsing the fieldset content */
  collapsible?: boolean;
  /** Whether the fieldset is expanded (v-model:expanded) */
  expanded?: boolean;
}

const props = withDefaults(defineProps<CuiFieldsetProps>(), {
  variant: "outline",
  color: "surface",
  rounded: "md",
  collapsible: false,
  expanded: true,
  disabled: false,
  hidden: false,
});

const emit = defineEmits<{
  "update:expanded": [value: boolean];
}>();

const isExpanded = ref(props.expanded);

watch(
  () => props.expanded,
  (val) => {
    isExpanded.value = val;
  },
);

function toggle() {
  if (!props.collapsible) return;
  isExpanded.value = !isExpanded.value;
  emit("update:expanded", isExpanded.value);
}

const radiusMap: Record<CuiRounded, string> = {
  none: "0",
  sm: "var(--cui-radius-sm, 0.25rem)",
  md: "var(--cui-button-radius, var(--cui-radius-md, 0.375rem))",
  lg: "var(--cui-radius-lg, 0.5rem)",
  full: "9999px",
};

const rootStyle = computed(() => {
  const c = props.color;
  const borderToken =
    c === "surface" ? "var(--cui-border)" : `var(--cui-${c}-border)`;
  const bgToken =
    c === "surface" ? "var(--cui-surface-bg)" : `var(--cui-${c}-bg)`;

  const style: Record<string, string> = {
    borderRadius: radiusMap[props.rounded],
  };

  if (props.variant === "ghost") {
    style.border = "none";
    style.background = "transparent";
  } else if (props.variant === "subtle") {
    style.border = `1px solid ${borderToken}`;
    style.background = bgToken;
  } else {
    style.border = `1px solid ${borderToken}`;
    style.background = "transparent";
  }

  return style;
});
</script>

<template>
  <fieldset
    v-show="!hidden"
    class="cui-fieldset"
    :class="[
      `cui-fieldset--${variant}`,
      {
        'cui-fieldset--collapsed': collapsible && !isExpanded,
        'cui-fieldset--disabled': disabled,
      },
    ]"
    :style="rootStyle"
    :disabled="disabled || undefined"
  >
    <legend
      class="cui-fieldset__legend"
      :class="{ 'cui-fieldset__legend--clickable': collapsible }"
      @click="toggle"
    >
      <CuiIcon
        v-if="collapsible"
        name="caret-down"
        size="1rem"
        class="cui-fieldset__chevron"
        :class="{ 'cui-fieldset__chevron--collapsed': !isExpanded }"
      />
      <span>{{ legend }}</span>
    </legend>

    <div
      v-if="description && isExpanded"
      class="cui-fieldset__description"
    >
      {{ description }}
    </div>

    <div
      class="cui-fieldset__content"
      :class="{ 'cui-fieldset__content--hidden': collapsible && !isExpanded }"
    >
      <slot />
    </div>
  </fieldset>
</template>

<style scoped>
.cui-fieldset {
  padding: calc(1.25rem * var(--cui-density-scale, 1));
  margin: 0;
  min-width: 0;
  transition: padding 0.25s ease, background 0.15s ease, border-color 0.15s ease;
}

/* Plain has no chrome — let content sit flush */
.cui-fieldset--ghost {
  padding: 0;
}

/* Collapsed: shrink-wrap the border to a slim bar around the legend
   (bordered variants only — plain has nothing to wrap) */
.cui-fieldset--collapsed:not(.cui-fieldset--ghost) {
  padding-top: calc(0.625rem * var(--cui-density-scale, 1));
  padding-bottom: calc(0.625rem * var(--cui-density-scale, 1));
}

.cui-fieldset--disabled {
  opacity: 0.6;
}

/* --- Legend --- */
.cui-fieldset__legend {
  display: flex;
  align-items: center;
  gap: calc(0.375rem * var(--cui-density-scale, 1));
  font-size: 1rem;
  font-weight: 600;
  color: var(--cui-text-emphasis);
  padding: 0 calc(0.375rem * var(--cui-density-scale, 1));
  line-height: 1.4;
}

.cui-fieldset--ghost .cui-fieldset__legend {
  padding-left: 0;
}

.cui-fieldset__legend--clickable {
  cursor: pointer;
  user-select: none;
  border-radius: 0.25rem;
  padding: calc(0.125rem * var(--cui-density-scale, 1)) calc(0.375rem * var(--cui-density-scale, 1));
  margin: calc(-0.125rem * var(--cui-density-scale, 1)) 0;
  transition: background 0.15s ease;
}

.cui-fieldset__legend--clickable:hover {
  background: var(--color-surface-100);
}

:where(.dark, .dark *) .cui-fieldset__legend--clickable:hover {
  background: var(--color-surface-800);
}

/* --- Chevron --- */
.cui-fieldset__chevron {
  flex-shrink: 0;
  color: var(--cui-text-secondary);
  transition: transform 0.2s ease;
}

.cui-fieldset__chevron--collapsed {
  transform: rotate(-90deg);
}

/* --- Description --- */
.cui-fieldset__description {
  font-size: 0.8125rem;
  color: var(--cui-text-secondary);
  line-height: 1.4;
  margin-top: 0;
  margin-bottom: 0;
  padding: 0 calc(0.375rem * var(--cui-density-scale, 1));
}

.cui-fieldset--ghost .cui-fieldset__description {
  padding-left: 0;
}

/* --- Content --- */
/* The gutter is room for a child's focus ring. `overflow: hidden` is required for the
   collapse animation, but it also clips the ring a field draws OUTSIDE its own box — a
   2px box-shadow on inputs, a 2px outline at 2px offset on checkboxes and radios. A
   full-width field sits flush against this box, so the ring was cut off on the left and
   right of every field, and on the top and bottom of the first and last. The padding
   gives it somewhere to land and the negative margin puts the layout back where it was.

   Vertical padding is dropped while collapsed: with `box-sizing: border-box`, padding
   survives `max-height: 0`, so the content would never animate away to nothing. */
.cui-fieldset__content {
  display: flex;
  flex-direction: column;
  gap: calc(1rem * var(--cui-density-scale, 1));
  padding: 4px;
  margin: -4px;
  overflow: hidden;
  transition: max-height 0.25s ease, opacity 0.2s ease, padding 0.25s ease;
}

.cui-fieldset__content--hidden {
  max-height: 0;
  opacity: 0;
  padding-block: 0;
  margin-block: 0;
  pointer-events: none;
}
</style>
