<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import type { HideableProps, SizeableProps } from "../types/common";
import { clampSize, scaleDensity } from "../utils/sizing";
import { PhCheck, PhWarning } from "@phosphor-icons/vue";
import CuiIcon from "./CuiIcon.vue";
import { useMessages } from "../composables/useMessages";
import { useRovingFocus } from "../composables/useRovingFocus";

export type StepperOrientation = "horizontal" | "vertical";
export type StepStatus = "complete" | "current" | "upcoming" | "error";

export interface StepDef {
  /** Step label */
  label: string;
  /** Optional description */
  description?: string;
  /** Optional icon (shown instead of step number) */
  icon?: string;
  /** Force error state on this step */
  error?: boolean;
}

export interface CuiStepperProps extends HideableProps, SizeableProps {
  /** Step definitions */
  steps: StepDef[];
  /** Current active step (0-based index) */
  modelValue?: number;
  /** Orientation */
  orientation?: StepperOrientation;
  /** Make each step that can be gone to a button (click, Enter or Space) */
  clickable?: boolean;
  /**
   * Linear mode — no skipping ahead: only steps up to the furthest one reached are
   * navigable, so going back can return forward again. An error step ahead is blocked too.
   */
  linear?: boolean;
}

const props = withDefaults(defineProps<CuiStepperProps>(), {
  modelValue: 0,
  orientation: "horizontal",
  size: "md",
  clickable: true,
  linear: true,
  hidden: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: number];
}>();

function getStatus(index: number): StepStatus {
  if (props.steps[index]?.error) return "error";
  if (index < props.modelValue) return "complete";
  if (index === props.modelValue) return "current";
  return "upcoming";
}

// The furthest step reached so far: in linear mode the stepper can go back and then forward
// again, as far as here, rather than going back locking the steps already done.
const furthest = ref(props.modelValue);
watch(() => props.modelValue, (v) => { if (v > furthest.value) furthest.value = v; });

/**
 * Whether step `index` can be navigated to: a button, rather than plain text (#154).
 * Linear blocks every step past the current one — an error step ahead included, which used
 * to slip through because its status is "error", not "upcoming".
 */
function isClickable(index: number) {
  return props.clickable && !(props.linear && index > furthest.value);
}

function onStepClick(index: number) {
  if (!isClickable(index)) return;
  emit("update:modelValue", index);
}

const SUPPORTED_SIZES = ["sm", "md", "lg"] as const;
const sizeConfig: Record<(typeof SUPPORTED_SIZES)[number], {
  circle: string;
  font: string;
  iconSize: string;
  labelFont: string;
  descFont: string;
  connectorThickness: string;
  gap: string;
}> = {
  sm: { circle: "1.5rem", font: "0.6875rem", iconSize: "0.75rem", labelFont: "0.8125rem", descFont: "0.6875rem", connectorThickness: "2px", gap: scaleDensity("0.5rem") },
  md: { circle: "2rem", font: "0.75rem", iconSize: "0.875rem", labelFont: "0.875rem", descFont: "0.75rem", connectorThickness: "2px", gap: scaleDensity("0.75rem") },
  lg: { circle: "2.5rem", font: "0.875rem", iconSize: "1rem", labelFont: "1rem", descFont: "0.8125rem", connectorThickness: "3px", gap: scaleDensity("1rem") },
};

const cfg = computed(() => sizeConfig[clampSize(props.size, SUPPORTED_SIZES)]);

function circleStyle(status: StepStatus) {
  const s: Record<string, string> = {
    width: cfg.value.circle,
    height: cfg.value.circle,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: cfg.value.font,
    fontWeight: "600",
    flexShrink: "0",
    transition: "background 0.2s ease, color 0.2s ease, border-color 0.2s ease",
  };

  if (status === "complete") {
    s.background = "var(--cui-primary)";
    s.color = "var(--cui-primary-text, white)";
    s.border = "2px solid var(--cui-primary)";
  } else if (status === "current") {
    s.background = "var(--cui-surface-base, white)";
    s.color = "var(--cui-primary)";
    s.border = "2px solid var(--cui-primary)";
  } else if (status === "error") {
    s.background = "var(--cui-error-bg)";
    s.color = "var(--cui-error)";
    s.border = "2px solid var(--cui-error)";
  } else {
    s.background = "var(--cui-surface-base, white)";
    s.color = "var(--cui-text-tertiary)";
    s.border = "2px solid var(--cui-border)";
  }

  return s;
}

function connectorStyle(index: number) {
  const complete = index < props.modelValue;
  const s: Record<string, string> = {
    transition: "background 0.3s ease",
  };

  if (props.orientation === "horizontal") {
    s.flex = "1";
    s.height = cfg.value.connectorThickness;
    s.minWidth = "1.5rem";
  } else {
    s.width = cfg.value.connectorThickness;
    s.flex = "1";
    s.minHeight = "1.5rem";
  }

  s.borderRadius = "9999px";
  s.background = complete ? "var(--cui-primary)" : "var(--cui-border)";

  return s;
}

function labelStyle(status: StepStatus) {
  const s: Record<string, string> = {
    fontSize: cfg.value.labelFont,
    fontWeight: status === "current" ? "600" : "500",
    lineHeight: "1.3",
    transition: "color 0.2s ease",
  };

  if (status === "current") {
    s.color = "var(--cui-text-body)";
  } else if (status === "complete") {
    s.color = "var(--cui-text-body)";
  } else if (status === "error") {
    s.color = "var(--cui-error)";
  } else {
    s.color = "var(--cui-text-tertiary)";
  }

  return s;
}

const messages = useMessages();

// --- Keyboard (#154) ---
// The steps are an <ol>, so their position and count are native. A step that can be
// navigated to is a <button>; the buttons share one tab stop (useRovingFocus), on the
// current step when it is one, and the arrows along the stepper move between them.
const listEl = useTemplateRef<HTMLElement>("listEl");
// The navigable steps are always a run from the first (none, those up to the furthest
// reached when linear, or all), so a button's place among the buttons is its step index.
const buttonIndex = ref(props.modelValue);
watch(() => props.modelValue, (v) => (buttonIndex.value = v));

// Arrowing moves the stop; leaving the stepper puts it back on the current step, so Tab
// returns there rather than to wherever the arrows stopped.
function onListFocusout(e: FocusEvent) {
  if (!listEl.value?.contains(e.relatedTarget as Node | null)) buttonIndex.value = props.modelValue;
}

const rootEl = useTemplateRef<HTMLElement>("rootEl");
defineExpose({
  el: rootEl,
  focus: (opts?: FocusOptions) => listEl.value?.querySelector<HTMLElement>('.cui-stepper__button[tabindex="0"]')?.focus(opts),
  blur: () => {
    const a = document.activeElement;
    if (a instanceof HTMLElement && rootEl.value?.contains(a)) a.blur();
  },
});
const roving = useRovingFocus({
  container: listEl,
  itemSelector: ".cui-stepper__button",
  orientation: () => props.orientation,
  activeIndex: buttonIndex,
});

/** Screen-reader text for what the check and warning icons show. */
function statusText(status: StepStatus) {
  if (status === "complete") return messages.value.stepper.complete;
  if (status === "error") return messages.value.stepper.error;
  return "";
}

// Each step's derived state, once per render rather than per binding.
const items = computed(() =>
  props.steps.map((step, i) => {
    const status = getStatus(i);
    return { step, status, clickable: isClickable(i), statusText: statusText(status) };
  }),
);
</script>

<template>
  <nav ref="rootEl" v-show="!hidden" class="cui-stepper" :aria-label="messages.stepper.label">
    <ol
      ref="listEl"
      class="cui-stepper__list"
      :style="{
        display: 'flex',
        flexDirection: orientation === 'horizontal' ? 'row' : 'column',
        alignItems: orientation === 'horizontal' ? 'flex-start' : 'stretch',
        gap: cfg.gap,
      }"
      @keydown="roving.onKeydown"
      @focusin="roving.onFocusin"
      @focusout="onListFocusout"
    >
      <!-- Each item is a step and the connector after it -->
      <li
        v-for="({ step, status, clickable: canGo, statusText: srStatus }, index) in items"
        :key="index"
        class="cui-stepper__item"
        :style="{
          display: 'flex',
          flexDirection: orientation === 'horizontal' ? 'row' : 'column',
          alignItems: orientation === 'horizontal' ? 'flex-start' : 'stretch',
          gap: cfg.gap,
          flex: index < steps.length - 1 ? '1 1 auto' : '0 0 auto',
        }"
      >
        <!-- Step: a button when it can be navigated to, plain text otherwise. Spans inside,
             not divs, since a button holds phrasing content only. -->
        <component
          :is="canGo ? 'button' : 'div'"
          class="cui-stepper__step"
          :class="{ 'cui-stepper__button': canGo }"
          v-bind="canGo ? { type: 'button', tabindex: roving.tabIndex(index) } : {}"
          :style="{
            display: 'flex',
            flexDirection: orientation === 'horizontal' ? 'column' : 'row',
            alignItems: orientation === 'horizontal' ? 'center' : 'flex-start',
            gap: 'calc(0.375rem * var(--cui-density-scale, 1))',
            flex: '0 0 auto',
            textAlign: orientation === 'horizontal' ? 'center' : 'start',
          }"
          :aria-current="status === 'current' ? 'step' : undefined"
          @click="onStepClick(index)"
        >
          <!-- Circle -->
          <span :style="circleStyle(status)" aria-hidden="true">
            <CuiIcon v-if="status === 'complete'" :icon="PhCheck" :size="cfg.iconSize" />
            <CuiIcon v-else-if="status === 'error'" :icon="PhWarning" :size="cfg.iconSize" />
            <CuiIcon v-else-if="step.icon" :name="step.icon" :size="cfg.iconSize" />
            <span v-else>{{ index + 1 }}</span>
          </span>

          <!-- Label + description -->
          <span :style="{ display: 'block' }">
            <span :style="{ display: 'block', ...labelStyle(status) }">
              {{ step.label }}<span v-if="srStatus" class="cui-sr-only">{{ srStatus }}</span>
            </span>
            <span
              v-if="step.description"
              :style="{
                display: 'block',
                fontSize: cfg.descFont,
                color: 'var(--cui-text-tertiary)',
                marginTop: 'calc(0.125rem * var(--cui-density-scale, 1))',
                lineHeight: '1.4',
              }"
            >
              {{ step.description }}
            </span>
          </span>
        </component>

        <!-- Connector -->
        <span
          v-if="index < steps.length - 1"
          aria-hidden="true"
          :style="{
            display: 'block',
            ...connectorStyle(index),
            marginLeft: orientation === 'vertical' ? `calc(${cfg.circle} / 2 - ${cfg.connectorThickness} / 2)` : undefined,
            marginTop: orientation === 'horizontal' ? `calc(${cfg.circle} / 2 - ${cfg.connectorThickness} / 2)` : undefined,
          }"
        />
      </li>
    </ol>
  </nav>
</template>

<style scoped>
/* --- Themeable: zero specificity, so a consumer's own rule wins (see CuiButton.vue) --- */
:where(.cui-stepper__button:focus-visible) {
  outline: 2px solid var(--cui-stepper-focus-ring, var(--cui-primary-focus-ring));
  outline-offset: 2px;
  border-radius: var(--cui-radius-sm, 0.25rem);
}

/* --- Structural --- */
.cui-stepper__button {
  cursor: pointer;
}
</style>
