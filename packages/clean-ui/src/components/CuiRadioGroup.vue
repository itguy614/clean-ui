<script setup lang="ts">
import { computed, provide, toRef, useSlots } from "vue";
import type { ButtonColor, ButtonSize } from "./CuiButton.vue";
import CuiButtonGroup from "./CuiButtonGroup.vue";
import { RadioGroupKey, type RadioGroupVariant } from "./radio-context";

export type RadioDirection = "horizontal" | "vertical" | "auto";

export interface CuiRadioGroupProps {
  /** Selected value */
  modelValue?: string | number | boolean;
  /** Shared name attribute for all radios */
  name?: string;
  /** Color role (inherited by children) */
  color?: ButtonColor;
  /** Layout direction — auto: horizontal for ≤2 options, vertical for 3+ */
  direction?: RadioDirection;
  /** Visual variant — "default" for classic radios, "buttons" for button group */
  variant?: RadioGroupVariant;
  /** Button size when variant="buttons" */
  size?: ButtonSize;
  /** Disable all radios */
  disabled?: boolean;
  /** Make all radios readonly */
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

const props = withDefaults(defineProps<CuiRadioGroupProps>(), {
  color: "primary",
  direction: "auto",
  variant: "default",
  size: "md",
  disabled: false,
  readonly: false,
  error: false,
  hidden: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: string | number | boolean];
}>();

const groupName = computed(() => props.name ?? `cui-radio-${Math.random().toString(36).slice(2, 8)}`);

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
  if (props.variant === "buttons") return "horizontal";
  if (props.direction !== "auto") return props.direction;
  return childCount.value <= 2 ? "horizontal" : "vertical";
});

provide(RadioGroupKey, {
  modelValue: toRef(props, "modelValue"),
  name: groupName.value,
  color: toRef(props, "color"),
  disabled: toRef(props, "disabled"),
  readonly: toRef(props, "readonly"),
  variant: toRef(props, "variant"),
  size: toRef(props, "size"),
  select(value: string | number | boolean) {
    if (props.disabled || props.readonly) return;
    emit("update:modelValue", value);
  },
});

function onKeydown(e: KeyboardEvent) {
  if (props.disabled || props.readonly) return;

  const group = e.currentTarget as HTMLElement;
  const selector = props.variant === "buttons"
    ? 'button.cui-radio-button:not(:disabled)'
    : '[role="radio"]:not([aria-disabled="true"])';
  const radios = Array.from(group.querySelectorAll<HTMLElement>(selector));
  const currentIndex = radios.findIndex((el) => el === document.activeElement);

  let nextIndex = -1;

  if (e.key === "ArrowDown" || e.key === "ArrowRight") {
    e.preventDefault();
    nextIndex = currentIndex < radios.length - 1 ? currentIndex + 1 : 0;
  } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
    e.preventDefault();
    nextIndex = currentIndex > 0 ? currentIndex - 1 : radios.length - 1;
  }

  if (nextIndex >= 0) {
    radios[nextIndex].focus();
    radios[nextIndex].click();
  }
}
</script>

<template>
  <div
    v-show="!hidden"
    role="radiogroup"
    :aria-label="label"
    :aria-invalid="error || undefined"
    class="cui-radio-group"
    :class="[
      variant !== 'buttons' ? `cui-radio-group--${resolvedDirection}` : '',
      { 'cui-radio-group--error': error },
      { 'cui-radio-group--buttons': variant === 'buttons' },
    ]"
    @keydown="onKeydown"
  >
    <!-- Button variant wraps in CuiButtonGroup for proper radius merging -->
    <CuiButtonGroup v-if="variant === 'buttons'">
      <slot />
    </CuiButtonGroup>
    <template v-else>
      <slot />
    </template>
    <div v-if="error && errorMessage" class="cui-radio-group__error">
      {{ errorMessage }}
    </div>
  </div>
</template>

<style scoped>
.cui-radio-group {
  display: flex;
  gap: 0.75rem;
  border-left: 3px solid transparent;
  padding-left: 0.75rem;
}

.cui-radio-group--vertical {
  flex-direction: column;
}

.cui-radio-group--horizontal {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 1.25rem;
}

/* Button variant: no gap, no accent bar padding */
.cui-radio-group--buttons {
  gap: 0;
  border-left: none;
  padding-left: 0;
  display: inline-flex;
  flex-wrap: nowrap;
}

.cui-radio-group--error {
  border-left-color: var(--cui-error);
}

.cui-radio-group--buttons.cui-radio-group--error {
  border-left: 3px solid var(--cui-error);
  padding-left: 0.75rem;
}

.cui-radio-group__error {
  font-size: 0.8125rem;
  margin-top: 0.25rem;
  color: var(--cui-error);
}

.cui-radio-group--horizontal .cui-radio-group__error {
  flex-basis: 100%;
}
</style>
