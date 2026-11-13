<script setup lang="ts">
import { ref, computed, watch } from "vue";
import CuiIcon from "./CuiIcon.vue";
import { useCuiId } from "../composables/useCuiId";
import { useCollapsible } from "../composables/useCollapsible";
import type { CuiRounded, HideableProps, ColorableProps, DisableableProps } from "../types/common";
import { RADIUS_SCALE } from "../utils/sizing";
import { IconCaretDown } from "../icons/generated/caret-down";

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
  if (!props.collapsible || props.disabled) return;
  isExpanded.value = !isExpanded.value;
  emit("update:expanded", isExpanded.value);
}

// The content collapses by grid-template-rows and is hidden once shut (until-found, else
// inert), so collapsed fields are out of the tab order and the accessibility tree (#176).
const contentId = useCuiId("fieldset-content");
const collapsed = computed(() => props.collapsible && !isExpanded.value);
const { panel, hiddenAttr, inertAttr, onBeforeMatch } = useCollapsible(
  () => !collapsed.value,
  () => {
    isExpanded.value = true;
    emit("update:expanded", true);
  },
);

const rootStyle = computed(() => {
  const c = props.color;
  const borderToken =
    c === "surface" ? "var(--cui-border)" : `var(--cui-${c}-border)`;
  const bgToken =
    c === "surface" ? "var(--cui-surface-bg)" : `var(--cui-${c}-bg)`;

  const style: Record<string, string> = {
    borderRadius: RADIUS_SCALE[props.rounded],
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
    <legend class="cui-fieldset__legend">
      <button
        v-if="collapsible"
        type="button"
        class="cui-fieldset__toggle"
        :aria-expanded="isExpanded"
        :aria-controls="contentId"
        :disabled="disabled || undefined"
        @click="toggle"
      >
        <CuiIcon
          :icon="IconCaretDown"
          size="1rem"
          class="cui-fieldset__chevron"
          :class="{ 'cui-fieldset__chevron--collapsed': !isExpanded }"
        />
        <span>{{ legend }}</span>
      </button>
      <span v-else>{{ legend }}</span>
    </legend>

    <div
      v-if="description && isExpanded"
      class="cui-fieldset__description"
    >
      {{ description }}
    </div>

    <div
      :id="collapsible ? contentId : undefined"
      ref="panel"
      class="cui-fieldset__body"
      :class="{ 'cui-fieldset__body--collapsed': collapsed }"
      :hidden.attr="hiddenAttr"
      :inert.attr="inertAttr"
      @beforematch="onBeforeMatch"
    >
      <div class="cui-fieldset__content">
        <slot />
      </div>
    </div>
  </fieldset>
</template>

<style scoped>
.cui-fieldset {
  padding: calc(1.25rem * var(--cui-density-scale, 1));
  margin: 0;
  min-width: 0;
  transition: padding var(--cui-duration-slow) ease, background var(--cui-duration-fast) ease, border-color var(--cui-duration-fast) ease;
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

/* The toggle is a real button inside the legend (#176): focusable, Space/Enter, and the
   pressed state is announced through aria-expanded. */
.cui-fieldset__toggle {
  display: flex;
  align-items: center;
  gap: calc(0.375rem * var(--cui-density-scale, 1));
  padding: calc(0.125rem * var(--cui-density-scale, 1)) calc(0.375rem * var(--cui-density-scale, 1));
  margin: calc(-0.125rem * var(--cui-density-scale, 1)) calc(-0.375rem * var(--cui-density-scale, 1));
  font: inherit;
  line-height: inherit;
  color: inherit;
  background: none;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  user-select: none;
  text-align: left;
  transition: background var(--cui-duration-fast) ease;
}

.cui-fieldset--ghost .cui-fieldset__toggle {
  margin-left: 0;
  padding-left: 0;
}

.cui-fieldset__toggle:hover {
  background: var(--cui-surface-bg);
}

.cui-fieldset__toggle:disabled {
  cursor: default;
}

.cui-fieldset__toggle:disabled:hover {
  background: none;
}

.cui-fieldset__toggle:focus-visible {
  outline: 2px solid var(--cui-primary-focus-ring);
  outline-offset: 2px;
}

/* --- Chevron --- */
.cui-fieldset__chevron {
  flex-shrink: 0;
  color: var(--cui-text-secondary);
  transition: transform var(--cui-duration-slow) var(--cui-ease-in-out);
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

/* --- Content ---
   The body is the collapse: a grid whose one row goes 0fr -> 1fr (no height is measured),
   fading as it goes. The content inside shrinks (min-height: 0) and clips.

   The gutter is room for a child's focus ring. `overflow: hidden` is required for the
   collapse, but it also clips the ring a field draws OUTSIDE its own box — a 2px box-shadow
   on inputs, a 2px outline at 2px offset on checkboxes and radios. A full-width field sits
   flush against this box, so the ring was cut off on the left and right of every field, and
   on the top and bottom of the first and last. The padding gives it somewhere to land and the
   negative margin puts the layout back where it was.

   Vertical padding is dropped while collapsed: padding can't shrink below itself, so it
   would hold the row open by 8px. (It snaps, rather than transitions: with the negative
   margin the layout is the same either side, and a ring has nothing to show on a closing
   section.) The opacity is listed first so reduced motion, which keeps only opacity, pairs
   it with the first duration. */
.cui-fieldset__body {
  display: grid;
  grid-template-rows: 1fr;
  transition:
    opacity var(--cui-duration-base) var(--cui-ease-out),
    grid-template-rows var(--cui-duration-slow) var(--cui-ease-out);
}

.cui-fieldset__body--collapsed {
  grid-template-rows: 0fr;
  opacity: 0;
}

.cui-fieldset__body[inert] {
  visibility: hidden;
}

.cui-fieldset__content {
  display: flex;
  flex-direction: column;
  gap: calc(1rem * var(--cui-density-scale, 1));
  min-height: 0;
  padding: 4px;
  margin: -4px;
  overflow: hidden;
}

.cui-fieldset__body--collapsed > .cui-fieldset__content {
  padding-block: 0;
  margin-block: 0;
}
</style>
