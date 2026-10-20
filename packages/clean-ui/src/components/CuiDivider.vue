<script setup lang="ts">
import { computed, useSlots } from "vue";
import { useCuiId } from "../composables/useCuiId";
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
// A function, not a computed: `slots` is not reactive, so a computed would cache the
// first render's answer and miss a label slot the parent adds or removes later.
const hasLabel = () => !!props.label || !!slots.default;

// A separator's contents are presentational, so a label inside one is not announced
// on its own; aria-labelledby makes it the separator's name instead (#157).
const labelId = useCuiId("divider-label");

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
  <!-- With label (either orientation; the styles switch on it) -->
  <div
    v-if="hasLabel()"
    v-show="!hidden"
    class="cui-divider"
    :style="containerStyle"
    role="separator"
    :aria-orientation="orientation === 'vertical' ? 'vertical' : 'horizontal'"
    :aria-labelledby="labelId"
  >
    <div v-if="labelPosition !== 'start'" :style="lineStyle" aria-hidden="true" />
    <span :id="labelId" :style="labelStyle">
      <slot>{{ label }}</slot>
    </span>
    <div v-if="labelPosition !== 'end'" :style="lineStyle" aria-hidden="true" />
  </div>

  <!-- Horizontal without label -->
  <hr
    class="cui-divider"
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
    aria-orientation="horizontal"
  />

  <!-- Vertical without label -->
  <div
    class="cui-divider"
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
    aria-orientation="vertical"
  />
</template>
