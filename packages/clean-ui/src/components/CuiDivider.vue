<script setup lang="ts">
import { computed, useSlots } from "vue";
import type { CuiColorOrCss, HideableProps } from "../types/common";
import { resolveColor } from "../utils/color";

export type DividerOrientation = "horizontal" | "vertical";
export type DividerLabelPosition = "start" | "center" | "end";
export type DividerVariant = "solid" | "dashed" | "dotted";

export interface CuiDividerProps extends HideableProps {
  /** Orientation */
  orientation?: DividerOrientation;
  /** Label position (when using default slot or label prop) */
  labelPosition?: DividerLabelPosition;
  /** Simple text label */
  label?: string;
  /** Line style */
  variant?: DividerVariant;
  /** Spacing above and below (CSS value, e.g., "1rem") */
  spacing?: string;
  /** Line color — a color role (mapped to its token) or any CSS color */
  color?: CuiColorOrCss;
}

const props = withDefaults(defineProps<CuiDividerProps>(), {
  orientation: "horizontal",
  labelPosition: "center",
  variant: "solid",
  spacing: "0",
  hidden: false,
});

const slots = useSlots();
const hasLabel = computed(() => !!props.label || !!slots.default);

const borderStyle = computed(() => {
  const c = props.color ? resolveColor(props.color) : "var(--cui-border)";
  return `1px ${props.variant} ${c}`;
});

const containerStyle = computed(() => {
  if (props.orientation === "vertical") {
    return {
      display: "inline-flex",
      flexDirection: "column" as const,
      alignItems: "center",
      alignSelf: "stretch",
      marginLeft: props.spacing,
      marginRight: props.spacing,
    };
  }
  return {
    display: "flex",
    alignItems: "center",
    width: "100%",
    marginTop: props.spacing,
    marginBottom: props.spacing,
  };
});

const lineStyle = computed(() => {
  if (props.orientation === "vertical") {
    return {
      flex: "1",
      width: "0",
      borderLeft: borderStyle.value,
      minHeight: "1rem",
    };
  }
  return {
    flex: "1",
    height: "0",
    borderTop: borderStyle.value,
  };
});

const labelStyle = computed(() => ({
  fontSize: "0.75rem",
  fontWeight: "500" as const,
  color: props.color ? resolveColor(props.color) : "var(--cui-text-tertiary)",
  padding: props.orientation === "horizontal" ? "0 calc(0.75rem * var(--cui-density-scale, 1))" : "calc(0.5rem * var(--cui-density-scale, 1)) 0",
  whiteSpace: "nowrap" as const,
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
}));
</script>

<template>
  <!-- Horizontal with label -->
  <div v-if="orientation === 'horizontal' && hasLabel" v-show="!hidden" :style="containerStyle" role="separator">
    <div v-if="labelPosition !== 'start'" :style="lineStyle" />
    <span :style="labelStyle">
      <slot>{{ label }}</slot>
    </span>
    <div v-if="labelPosition !== 'end'" :style="lineStyle" />
  </div>

  <!-- Horizontal without label -->
  <hr
    v-else-if="orientation === 'horizontal'"
    v-show="!hidden"
    :style="{
      border: 'none',
      borderTop: borderStyle,
      width: '100%',
      marginTop: spacing,
      marginBottom: spacing,
    }"
    role="separator"
  />

  <!-- Vertical with label -->
  <div v-else-if="hasLabel" v-show="!hidden" :style="containerStyle" role="separator">
    <div v-if="labelPosition !== 'start'" :style="lineStyle" />
    <span :style="labelStyle">
      <slot>{{ label }}</slot>
    </span>
    <div v-if="labelPosition !== 'end'" :style="lineStyle" />
  </div>

  <!-- Vertical without label -->
  <div
    v-else
    v-show="!hidden"
    :style="{
      display: 'inline-block',
      width: '0',
      alignSelf: 'stretch',
      borderLeft: borderStyle,
      marginLeft: spacing,
      marginRight: spacing,
      minHeight: '1rem',
    }"
    role="separator"
  />
</template>
