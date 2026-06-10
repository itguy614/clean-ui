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
  sm: "0.25rem",
  md: "var(--cui-button-radius, 0.375rem)",
  lg: "0.5rem",
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
  padding: 1.25rem;
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
  padding-top: 0.625rem;
  padding-bottom: 0.625rem;
}

.cui-fieldset--disabled {
  opacity: 0.6;
}

/* --- Legend --- */
.cui-fieldset__legend {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--cui-text-emphasis);
  padding: 0 0.375rem;
  line-height: 1.4;
}

.cui-fieldset--ghost .cui-fieldset__legend {
  padding-left: 0;
}

.cui-fieldset__legend--clickable {
  cursor: pointer;
  user-select: none;
  border-radius: 0.25rem;
  padding: 0.125rem 0.375rem;
  margin: -0.125rem 0;
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
  padding: 0 0.375rem;
}

.cui-fieldset--ghost .cui-fieldset__description {
  padding-left: 0;
}

/* --- Content --- */
.cui-fieldset__content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 0;
  overflow: hidden;
  transition: max-height 0.25s ease, opacity 0.2s ease;
}

.cui-fieldset__content--hidden {
  max-height: 0;
  opacity: 0;
  margin-top: 0;
  pointer-events: none;
}
</style>
