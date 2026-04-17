<script setup lang="ts">
import { ref, watch } from "vue";
import CuiIcon from "./CuiIcon.vue";

export interface CuiFieldsetProps {
  /** Legend text */
  legend: string;
  /** Description text below the legend */
  description?: string;
  /** Allow collapsing the fieldset content */
  collapsible?: boolean;
  /** Whether the fieldset is expanded (v-model:expanded) */
  expanded?: boolean;
  /** Disable all controls inside */
  disabled?: boolean;
}

const props = withDefaults(defineProps<CuiFieldsetProps>(), {
  collapsible: false,
  expanded: true,
  disabled: false,
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
</script>

<template>
  <fieldset
    class="cui-fieldset"
    :class="{
      'cui-fieldset--collapsed': collapsible && !isExpanded,
      'cui-fieldset--disabled': disabled,
    }"
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
  border: 1px solid var(--cui-border);
  border-radius: var(--cui-button-radius, 0.375rem);
  padding: 1.25rem;
  margin: 0;
  min-width: 0;
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
