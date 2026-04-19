<script setup lang="ts">
import { computed, inject, ref } from "vue";
import { ToggleGroupKey, type MultiSelectGroupContext } from "./multi-select-group-context";
import type { ButtonColor } from "./CuiButton.vue";

export type ToggleSize = "sm" | "md" | "lg";

export interface CuiToggleProps {
  /** The value this toggle represents (group mode) */
  value?: string | number;
  /** v-model binding (standalone boolean mode) */
  modelValue?: boolean;
  /** Label text (or use default slot) */
  label?: string;
  /** Description text (or use #description slot) */
  description?: string;
  /** Show ON/OFF labels inside the track (only visible at md and lg sizes) */
  showLabels?: boolean;
  /** Color role — overrides group color */
  color?: ButtonColor;
  /** Size */
  size?: ToggleSize;
  /** Disabled state */
  disabled?: boolean;
  /** Readonly state */
  readonly?: boolean;
  /** Hide the component */
  hidden?: boolean;
}

const props = withDefaults(defineProps<CuiToggleProps>(), {
  showLabels: false,
  size: "md",
  disabled: false,
  readonly: false,
  hidden: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const group = inject<MultiSelectGroupContext | null>(ToggleGroupKey, null);

const isChecked = computed(() => {
  if (group && props.value !== undefined) {
    return group.modelValue.value.includes(props.value);
  }
  return props.modelValue === true;
});

const isDisabled = computed(() => {
  if (group?.disabled.value) return true;
  return props.disabled;
});

const isReadonly = computed(() => {
  if (group?.readonly.value) return true;
  return props.readonly;
});

const resolvedColor = computed(() => {
  return props.color ?? group?.color.value ?? "primary";
});

const elRef = ref<HTMLElement>();

function toggle() {
  if (isDisabled.value || isReadonly.value) return;
  if (group && props.value !== undefined) {
    group.toggle(props.value);
  } else {
    emit("update:modelValue", !props.modelValue);
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    toggle();
  }
}

defineExpose({ el: elRef, focus: () => elRef.value?.focus() });

// Size dimensions
const trackSizes: Record<ToggleSize, { w: string; h: string; knob: string; travel: string; labelSize: string }> = {
  sm: { w: "2rem", h: "1.125rem", knob: "0.875rem", travel: "0.875rem", labelSize: "0.5rem" },
  md: { w: "2.75rem", h: "1.5rem", knob: "1.25rem", travel: "1.25rem", labelSize: "0.625rem" },
  lg: { w: "3.5rem", h: "1.875rem", knob: "1.5rem", travel: "1.625rem", labelSize: "0.6875rem" },
};

const dims = computed(() => trackSizes[props.size]);
</script>

<template>
  <label
    ref="elRef"
    v-show="!hidden"
    class="cui-toggle"
    :style="{ '--_toggle-focus-ring': `var(--cui-${resolvedColor}-focus-ring)` }"
    :class="{
      'cui-toggle--checked': isChecked,
      'cui-toggle--disabled': isDisabled,
      'cui-toggle--readonly': isReadonly,
    }"
    role="switch"
    :aria-checked="isChecked"
    :aria-disabled="isDisabled || isReadonly || undefined"
    :tabindex="isDisabled ? -1 : 0"
    @click="toggle"
    @keydown="onKeydown"
  >
    <!-- Hidden native input -->
    <input
      type="checkbox"
      :value="value !== undefined ? String(value) : undefined"
      :checked="isChecked"
      :disabled="isDisabled"
      :readonly="isReadonly"
      tabindex="-1"
      aria-hidden="true"
      class="cui-toggle__input"
      @click.stop.prevent
    />

    <!-- Track -->
    <span
      class="cui-toggle__track"
      :style="{
        width: dims.w,
        height: dims.h,
        '--_toggle-color': `var(--cui-${resolvedColor})`,
        '--_toggle-bg': `var(--cui-${resolvedColor}-bg)`,
        '--_toggle-border': `var(--cui-${resolvedColor}-border)`,
        '--_toggle-hover': `var(--cui-${resolvedColor}-hover)`,
        '--_toggle-active': `var(--cui-${resolvedColor}-active)`,
      }"
    >
      <!-- ON label inside track (md and lg only) -->
      <span v-if="showLabels && size !== 'sm' && isChecked" class="cui-toggle__labels" :style="{ fontSize: dims.labelSize }">
        <span class="cui-toggle__on-label">ON</span>
      </span>

      <!-- Knob -->
      <span
        class="cui-toggle__knob"
        :style="{
          width: dims.knob,
          height: dims.knob,
          transform: isChecked ? `translateX(${dims.travel})` : 'translateX(0)',
        }"
      />
    </span>

    <!-- Label + description -->
    <span v-if="label || $slots.default || description || $slots.description" class="cui-toggle__label-wrap">
      <span class="cui-toggle__label">
        <slot>{{ label }}</slot>
      </span>
      <span v-if="description || $slots.description" class="cui-toggle__description">
        <slot name="description">{{ description }}</slot>
      </span>
    </span>
  </label>
</template>

<style scoped>
.cui-toggle {
  display: inline-flex;
  align-items: flex-start;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
  position: relative;
}

.cui-toggle--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cui-toggle--readonly {
  cursor: default;
}

.cui-toggle:focus-visible {
  outline: 2px solid var(--_toggle-focus-ring);
  outline-offset: 2px;
  border-radius: 0.25rem;
}

.cui-toggle__input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* --- Track --- */
.cui-toggle__track {
  position: relative;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  border-radius: 9999px;
  background: var(--color-surface-300);
  border: 1px solid var(--cui-border-strong);
  transition: background 0.2s ease, border-color 0.2s ease;
  padding: calc(0.125rem - 1px);
  margin-top: 0.125rem;
}

.cui-toggle--checked .cui-toggle__track {
  background: var(--_toggle-color);
  border-color: var(--_toggle-color);
}

.cui-toggle:hover:not(.cui-toggle--disabled):not(.cui-toggle--readonly) .cui-toggle__track {
  background: var(--color-surface-400);
}

.cui-toggle--checked:hover:not(.cui-toggle--disabled):not(.cui-toggle--readonly) .cui-toggle__track {
  background: var(--_toggle-hover);
  border-color: var(--_toggle-hover);
}

.cui-toggle:active:not(.cui-toggle--disabled):not(.cui-toggle--readonly) .cui-toggle__track {
  background: var(--color-surface-500);
}

.cui-toggle--checked:active:not(.cui-toggle--disabled):not(.cui-toggle--readonly) .cui-toggle__track {
  background: var(--_toggle-active);
  border-color: var(--_toggle-active);
}

/* --- Knob --- */
.cui-toggle__knob {
  border-radius: 50%;
  background: var(--cui-text-secondary);
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.15);
  transition: transform 0.2s ease, background 0.2s ease;
  z-index: 1;
}

.cui-toggle--checked .cui-toggle__knob {
  background: var(--cui-text-secondary);
}

/* --- Labels inside track --- */
.cui-toggle__labels {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.375rem;
  font-weight: 600;
  pointer-events: none;
}

.cui-toggle__on-label {
  color: var(--cui-surface-base);
}

/* --- Label --- */
.cui-toggle__label-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.cui-toggle__label {
  font-size: 1rem;
  line-height: 1.5;
  color: var(--cui-text-body);
}

.cui-toggle__description {
  font-size: 0.8125rem;
  line-height: 1.4;
  color: var(--cui-text-secondary);
}
</style>
