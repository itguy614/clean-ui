<script setup lang="ts">
import { computed, provide, toRef, useSlots } from "vue";
import type { ButtonColor } from "./CuiButton.vue";
import { CheckboxGroupKey } from "./multi-select-group-context";

export type CheckboxDirection = "horizontal" | "vertical" | "auto";

export interface CuiCheckboxGroupProps {
  /** Array of selected values */
  modelValue?: Array<string | number>;
  /** Color role (inherited by children) */
  color?: ButtonColor;
  /** Layout direction — auto: horizontal for ≤2 options, vertical for 3+ */
  direction?: CheckboxDirection;
  /** Disable all checkboxes */
  disabled?: boolean;
  /** Make all checkboxes readonly */
  readonly?: boolean;
  /** Show error state */
  error?: boolean;
  /** Error message displayed below the group */
  errorMessage?: string;
  /** Accessible label for the group */
  label?: string;
  /** Hide the component */
  hidden?: boolean;
}

const props = withDefaults(defineProps<CuiCheckboxGroupProps>(), {
  modelValue: () => [],
  color: "primary",
  direction: "auto",
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
  if (props.direction !== "auto") return props.direction;
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
    <slot />
    <div v-if="error && errorMessage" class="cui-checkbox-group__error">
      {{ errorMessage }}
    </div>
  </div>
</template>

<style scoped>
.cui-checkbox-group {
  display: flex;
  gap: 0.75rem;
  border-left: 3px solid transparent;
  padding-left: 0.75rem;
}

.cui-checkbox-group--vertical {
  flex-direction: column;
}

.cui-checkbox-group--horizontal {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 1.25rem;
}

.cui-checkbox-group--error {
  border-left-color: var(--cui-error);
}

.cui-checkbox-group__error {
  font-size: 0.8125rem;
  margin-top: 0.25rem;
  color: var(--cui-error);
}

.cui-checkbox-group--horizontal .cui-checkbox-group__error {
  flex-basis: 100%;
}
</style>
