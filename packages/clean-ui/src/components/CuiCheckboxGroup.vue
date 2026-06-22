<script setup lang="ts">
import { computed, provide, toRef, useSlots } from "vue";
import type { CuiColor, CuiAutoOrientation, HideableProps, ColorableProps, DisableableProps } from "../types/common";
import { CheckboxGroupKey } from "./multi-select-group-context";

export interface CuiCheckboxGroupProps extends HideableProps, ColorableProps, DisableableProps {
  /** Array of selected values */
  modelValue?: Array<string | number>;
  /** Layout orientation — auto: horizontal for ≤2 options, vertical for 3+ */
  orientation?: CuiAutoOrientation;
  /** Make all checkboxes readonly */
  readonly?: boolean;
  /** Show error state */
  error?: boolean;
  /** Error message displayed below the group */
  errorMessage?: string;
  /** Accessible label for the group */
  label?: string;
}

const props = withDefaults(defineProps<CuiCheckboxGroupProps>(), {
  modelValue: () => [],
  color: "primary",
  orientation: "auto",
  disabled: false,
  readonly: false,
  error: false,
  hidden: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: Array<string | number>];
}>();

// Count slotted children to determine auto direction
const slots = useSlots();
const childCount = computed(() => {
  const defaultSlot = slots.default?.();
  if (!defaultSlot) return 0;
  return defaultSlot.reduce((count, vnode) => {
    if (vnode.type === Symbol.for("v-fgm") || (vnode as any).type === Symbol.for("v-fgt")) {
      return count + ((vnode.children as any[])?.length ?? 0);
    }
    return count + 1;
  }, 0);
});

const resolvedDirection = computed(() => {
  if (props.orientation !== "auto") return props.orientation;
  return childCount.value <= 2 ? "horizontal" : "vertical";
});

provide(CheckboxGroupKey, {
  modelValue: toRef(props, "modelValue"),
  color: toRef(props, "color"),
  disabled: toRef(props, "disabled"),
  readonly: toRef(props, "readonly"),
  toggle(value: string | number) {
    if (props.disabled || props.readonly) return;
    const current = [...props.modelValue];
    const idx = current.indexOf(value);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(value);
    }
    emit("update:modelValue", current);
  },
});
</script>

<template>
  <div
    v-show="!hidden"
    role="group"
    :aria-label="label"
    :aria-invalid="error || undefined"
    class="cui-checkbox-group"
    :class="[
      `cui-checkbox-group--${resolvedDirection}`,
      { 'cui-checkbox-group--error': error },
    ]"
  >
    <div class="cui-checkbox-group__options">
      <slot />
    </div>
    <div v-if="error && errorMessage" class="cui-checkbox-group__error">
      {{ errorMessage }}
    </div>
  </div>
</template>

<style scoped>
.cui-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: calc(0.375rem * var(--cui-density-scale, 1));
}

.cui-checkbox-group__options {
  display: flex;
  gap: calc(0.75rem * var(--cui-density-scale, 1));
}

.cui-checkbox-group--vertical .cui-checkbox-group__options {
  flex-direction: column;
}

.cui-checkbox-group--horizontal .cui-checkbox-group__options {
  flex-direction: row;
  flex-wrap: wrap;
  gap: calc(1.25rem * var(--cui-density-scale, 1));
}

/* Error: subtle bordered container around the options */
.cui-checkbox-group--error .cui-checkbox-group__options {
  border: 1px solid var(--cui-error-border);
  background: var(--cui-error-bg);
  border-radius: var(--cui-button-radius, 0.375rem);
  padding: calc(0.625rem * var(--cui-density-scale, 1)) calc(0.75rem * var(--cui-density-scale, 1));
}

.cui-checkbox-group__error {
  font-size: 0.8125rem;
  color: var(--cui-error);
}
</style>
