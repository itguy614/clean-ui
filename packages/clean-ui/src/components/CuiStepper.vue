<script setup lang="ts">
import { computed, provide, ref } from "vue";
import CuiIcon from "./CuiIcon.vue";

export type StepperOrientation = "horizontal" | "vertical";
export type StepperSize = "sm" | "md" | "lg";
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

export interface CuiStepperProps {
  /** Step definitions */
  steps: StepDef[];
  /** Current active step (0-based index) */
  modelValue?: number;
  /** Orientation */
  orientation?: StepperOrientation;
  /** Size */
  size?: StepperSize;
  /** Allow clicking completed steps to go back */
  clickable?: boolean;
  /** Linear mode — can only progress forward, no skipping */
  linear?: boolean;
  /** Hide the component */
  hidden?: boolean;
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

function onStepClick(index: number) {
  if (!props.clickable) return;
  const status = getStatus(index);
  if (props.linear && status === "upcoming") return;
  emit("update:modelValue", index);
}

const sizeConfig: Record<StepperSize, {
  circle: string;
  font: string;
  iconSize: string;
  labelFont: string;
  descFont: string;
  connectorThickness: string;
  gap: string;
}> = {
  sm: { circle: "1.5rem", font: "0.6875rem", iconSize: "0.75rem", labelFont: "0.8125rem", descFont: "0.6875rem", connectorThickness: "2px", gap: "0.5rem" },
  md: { circle: "2rem", font: "0.75rem", iconSize: "0.875rem", labelFont: "0.875rem", descFont: "0.75rem", connectorThickness: "2px", gap: "0.75rem" },
  lg: { circle: "2.5rem", font: "0.875rem", iconSize: "1rem", labelFont: "1rem", descFont: "0.8125rem", connectorThickness: "3px", gap: "1rem" },
};

const cfg = computed(() => sizeConfig[props.size]);

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

function stepCursor(index: number) {
  if (!props.clickable) return "default";
  const status = getStatus(index);
  if (props.linear && status === "upcoming") return "default";
  return "pointer";
}
</script>

<template>
  <div
    v-show="!hidden"
    class="cui-stepper"
    :style="{
      display: 'flex',
      flexDirection: orientation === 'horizontal' ? 'row' : 'column',
      alignItems: orientation === 'horizontal' ? 'flex-start' : 'stretch',
      gap: cfg.gap,
    }"
    role="navigation"
    aria-label="Progress"
  >
    <template v-for="(step, index) in steps" :key="index">
      <!-- Step -->
      <div
        :style="{
          display: 'flex',
          flexDirection: orientation === 'horizontal' ? 'column' : 'row',
          alignItems: orientation === 'horizontal' ? 'center' : 'flex-start',
          gap: '0.375rem',
          cursor: stepCursor(index),
          flex: orientation === 'horizontal' ? '0 0 auto' : undefined,
        }"
        :aria-current="getStatus(index) === 'current' ? 'step' : undefined"
        @click="onStepClick(index)"
      >
        <!-- Circle + connector row (horizontal) or circle column (vertical) -->
        <div
          :style="{
            display: 'flex',
            flexDirection: orientation === 'horizontal' ? 'row' : 'column',
            alignItems: 'center',
            gap: cfg.gap,
          }"
        >
          <!-- Circle -->
          <div :style="circleStyle(getStatus(index))">
            <CuiIcon v-if="getStatus(index) === 'complete'" name="check" :size="cfg.iconSize" />
            <CuiIcon v-else-if="getStatus(index) === 'error'" name="warning" :size="cfg.iconSize" />
            <CuiIcon v-else-if="step.icon" :name="step.icon" :size="cfg.iconSize" />
            <span v-else>{{ index + 1 }}</span>
          </div>
        </div>

        <!-- Label + description -->
        <div :style="{ textAlign: orientation === 'horizontal' ? 'center' : 'left' }">
          <div :style="labelStyle(getStatus(index))">{{ step.label }}</div>
          <div
            v-if="step.description"
            :style="{
              fontSize: cfg.descFont,
              color: 'var(--cui-text-tertiary)',
              marginTop: '0.125rem',
              lineHeight: '1.4',
            }"
          >
            {{ step.description }}
          </div>
        </div>
      </div>

      <!-- Connector -->
      <div
        v-if="index < steps.length - 1"
        :style="{
          ...connectorStyle(index),
          alignSelf: orientation === 'horizontal' ? 'center' : undefined,
          marginLeft: orientation === 'vertical' ? `calc(${cfg.circle} / 2 - ${cfg.connectorThickness} / 2)` : undefined,
          marginTop: orientation === 'horizontal' ? `calc(${cfg.circle} / 2 - ${cfg.connectorThickness} / 2)` : undefined,
        }"
      />
    </template>
  </div>
</template>
