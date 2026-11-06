<script setup lang="ts">
import { computed, ref } from "vue";
import { useChoiceLabelling } from "../composables/useChoiceLabelling";
import { ToggleGroupKey, useOptionalMultiSelectGroupContext } from "./multi-select-group-context";
import type { HideableProps, ColorableProps, SizeableProps, DisableableProps, NativeControlProps } from "../types/common";
import { clampSize } from "../utils/sizing";
import { useMessages } from "../composables/useMessages";

const messages = useMessages();

export interface CuiToggleProps extends NativeControlProps, HideableProps, ColorableProps, SizeableProps, DisableableProps {
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
  /** Readonly state */
  readonly?: boolean;
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

const group = useOptionalMultiSelectGroupContext(ToggleGroupKey);

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
const SUPPORTED_SIZES = ["sm", "md", "lg"] as const;
// Switch dimensions sit inline with a fixed-size label, so they stay fixed —
// scaling them while the label text doesn't would break vertical alignment.
// Density scales the spacing around the control instead.
const trackSizes: Record<(typeof SUPPORTED_SIZES)[number], { w: string; h: string; knob: string; travel: string; labelSize: string }> = {
  sm: { w: "2rem", h: "1.125rem", knob: "0.875rem", travel: "0.875rem", labelSize: "0.5rem" },
  md: { w: "2.75rem", h: "1.5rem", knob: "1.25rem", travel: "1.25rem", labelSize: "0.625rem" },
  lg: { w: "3.5rem", h: "1.875rem", knob: "1.5rem", travel: "1.625rem", labelSize: "0.6875rem" },
};

const clampedSize = computed(() => clampSize(props.size, SUPPORTED_SIZES));
const dims = computed(() => trackSizes[clampedSize.value]);

// Named by the label, described by the description, not both as one name (#183).
const choice = useChoiceLabelling(props);
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
    :id="id"
    role="switch"
    :aria-describedby="choice.describedBy()"
    :aria-required="ariaRequired || undefined"
    :aria-labelledby="choice.labelledBy()"
    :aria-checked="isChecked"
    :aria-disabled="isDisabled || isReadonly || undefined"
    :tabindex="isDisabled ? -1 : 0"
    @click="toggle"
    @keydown="onKeydown"
  >
    <!-- Hidden native input -->
    <input
      :name="name"
      :autocomplete="autocomplete"
      type="checkbox"
      :value="value !== undefined ? String(value) : undefined"
      :checked="isChecked"
      :disabled="isDisabled"
      :readonly="isReadonly"
      tabindex="-1"
      aria-hidden="true"
      class="cui-toggle__input cui-sr-only"
      @click.stop.prevent
    />

    <!-- Track -->
    <span
      class="cui-toggle__track"
      :style="{
        width: dims.w,
        '--_toggle-height': dims.h,
        '--_toggle-color': `var(--cui-${resolvedColor})`,
        '--_toggle-bg': `var(--cui-${resolvedColor}-bg)`,
        '--_toggle-hover-border': isChecked ? `var(--cui-${resolvedColor}-hover)` : `var(--cui-${resolvedColor})`,
        '--_toggle-active': `var(--cui-${resolvedColor}-active)`,
      }"
    >
      <!-- ON label inside track (md and lg only) -->
      <span v-if="showLabels && clampedSize !== 'sm' && isChecked" class="cui-toggle__labels" :style="{ '--_toggle-font-size': dims.labelSize }">
        <span class="cui-toggle__on-label">{{ messages.toggle.on }}</span>
      </span>

      <!-- Knob -->
      <span
        class="cui-toggle__knob"
        :style="{
          '--_toggle-knob-size': dims.knob,
          transform: isChecked ? `translateX(${dims.travel})` : 'translateX(0)',
        }"
      />
    </span>

    <!-- Label + description -->
    <span v-if="label || $slots.default || choice.hasDescription()" class="cui-toggle__label-wrap">
      <span :id="choice.labelId" class="cui-toggle__label">
        <slot>{{ label }}</slot>
      </span>
      <span v-if="choice.hasDescription()" :id="choice.descriptionId" class="cui-toggle__description">
        <slot name="description">{{ description }}</slot>
      </span>
    </span>
  </label>
</template>

<style scoped>
.cui-toggle {
  display: inline-flex;
  align-items: flex-start;
  gap: calc(0.5rem * var(--cui-density-scale, 1));
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
  outline-width: 2px;
  outline-style: solid;
  outline-offset: 2px;
  border-radius: 0.25rem;
}

/* Themeable (#454): zero specificity, so a consumer's plain `.cui-toggle:focus-visible { … }`
   or `--cui-toggle-focus-ring` on a container wins. */
:where(.cui-toggle:focus-visible) {
  outline-color: var(--cui-toggle-focus-ring, var(--_toggle-focus-ring));
}

/* --- Track --- */
.cui-toggle__track {
  position: relative;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  border-radius: 9999px;
  border-width: 1px;
  border-style: solid;
  transition: background var(--cui-duration-base) ease, border-color var(--cui-duration-base) ease;
  padding: calc(0.125rem - 1px);
  margin-top: 0.125rem;
}

/* Themeable (#333, #454): zero specificity, so a consumer's plain `.cui-toggle__track { … }`
   or a `--cui-toggle-*` token on a container wins.

   The track's height is tied to the knob and the track width, which follow the size preset, so
   it is private only (#333). The pressed border has no slot in the vocabulary, so
   `--_toggle-active` is private only too.

   The state rules sit in the order they used to win by specificity: resting, on, hover,
   pressed, then on and hovered, which still beats pressed. */
:where(.cui-toggle__track) {
  height: var(--_toggle-height);
  /* Subtle-first, mirroring the checkbox: no fill when off, light-primary tint
     when on. The knob is the primary "dot" in both states. */
  background: transparent;
  border-color: var(--cui-border-strong);
}

:where(.cui-toggle--checked .cui-toggle__track) {
  background: var(--cui-toggle-bg, var(--_toggle-bg));
  border-color: var(--cui-toggle-color, var(--_toggle-color));
}

:where(.cui-toggle:hover:not(.cui-toggle--disabled):not(.cui-toggle--readonly) .cui-toggle__track) {
  border-color: var(--cui-toggle-hover-border, var(--_toggle-hover-border));
}

:where(.cui-toggle:active:not(.cui-toggle--disabled):not(.cui-toggle--readonly) .cui-toggle__track) {
  border-color: var(--_toggle-active);
}

:where(.cui-toggle--checked:hover:not(.cui-toggle--disabled):not(.cui-toggle--readonly) .cui-toggle__track) {
  border-color: var(--cui-toggle-hover-border, var(--_toggle-hover-border));
}

/* --- Knob (primary "dot" in both states) --- */
/* The knob's box follows the track's size preset; it is geometry, so private only. */
.cui-toggle__knob {
  width: var(--_toggle-knob-size);
  height: var(--_toggle-knob-size);
  border-radius: 50%;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.15);
  transition: transform var(--cui-duration-press) var(--cui-ease-in-out), background var(--cui-duration-base) ease;
  z-index: 1;
}

/* The knob is the accent colour; one token recolours it with the track's border. */
:where(.cui-toggle__knob) {
  background: var(--cui-toggle-color, var(--_toggle-color));
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

:where(.cui-toggle__labels) {
  font-size: var(--cui-toggle-font-size, var(--_toggle-font-size));
}

:where(.cui-toggle__on-label) {
  color: var(--cui-toggle-color, var(--_toggle-color));
}

/* --- Label --- */
.cui-toggle__label-wrap {
  display: flex;
  flex-direction: column;
  gap: calc(0.125rem * var(--cui-density-scale, 1));
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
