<script setup lang="ts">
import { computed, provide, toRef, useSlots } from "vue";
import type { ButtonColor } from "./CuiButton.vue";
import { ToggleGroupKey } from "./multi-select-group-context";

export type ToggleDirection = "horizontal" | "vertical" | "auto";

export interface CuiToggleGroupProps {
  /** Array of selected values */
  modelValue?: Array<string | number>;
  /** Color role (inherited by children) */
  color?: ButtonColor;
  /** Layout direction — auto: horizontal for ≤2 options, vertical for 3+ */
  direction?: ToggleDirection;
  /** Disable all toggles */
  disabled?: boolean;
  /** Make all toggles readonly */
  readonly?: boolean;
  /** Show error state */
  error?: boolean;
  /** Error message displayed below the group */
  errorMessage?: string;
  /** Accessible label for the group */
  label?: string;
}

const props = withDefaults(defineProps<CuiToggleGroupProps>(), {
  modelValue: () => [],
  color: "primary",
  direction: "auto",
  disabled: false,
  readonly: false,
  error: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: Array<string | number>];
}>();

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

provide(ToggleGroupKey, {
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
    role="group"
    :aria-label="label"
    :aria-invalid="error || undefined"
    class="cui-toggle-group"
    :class="[
      `cui-toggle-group--${resolvedDirection}`,
      { 'cui-toggle-group--error': error },
    ]"
  >
    <slot />
    <div v-if="error && errorMessage" class="cui-toggle-group__error">
      {{ errorMessage }}
    </div>
  </div>
</template>

<style scoped>
.cui-toggle-group {
  display: flex;
  gap: 0.75rem;
  border-left: 3px solid transparent;
  padding-left: 0.75rem;
}

.cui-toggle-group--vertical {
  flex-direction: column;
}

.cui-toggle-group--horizontal {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 1.25rem;
}

.cui-toggle-group--error {
  border-left-color: var(--cui-error);
}

.cui-toggle-group__error {
  font-size: 0.8125rem;
  margin-top: 0.25rem;
  color: var(--cui-error);
}

.cui-toggle-group--horizontal .cui-toggle-group__error {
  flex-basis: 100%;
}
</style>
