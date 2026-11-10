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

// What follows the props is per-instance data: the line's style and colour (a role or any
// CSS colour, so the colour IS the data) and the spacing. They are emitted as private
// properties on the root; the stylesheet reads them back through the public tokens, so a
// consumer's rule or container token still wins (#489).
const resolvedColor = computed(() => (props.color ? resolveColor(props.color) : undefined));

const rootVars = computed(() => ({
  "--_divider-border": `1px ${props.variant} ${resolvedColor.value ?? "var(--cui-border)"}`,
  "--_divider-color": resolvedColor.value,
  "--_divider-spacing": props.spacing,
}));
</script>

<template>
  <!-- With label (either orientation; the styles switch on it) -->
  <div
    v-if="hasLabel()"
    v-show="!hidden"
    class="cui-divider cui-divider--labeled"
    :class="`cui-divider--${orientation}`"
    :style="rootVars"
    role="separator"
    :aria-orientation="orientation === 'vertical' ? 'vertical' : 'horizontal'"
    :aria-labelledby="labelId"
  >
    <div v-if="labelPosition !== 'start'" class="cui-divider__line" aria-hidden="true" />
    <span :id="labelId" class="cui-divider__label">
      <slot>{{ label }}</slot>
    </span>
    <div v-if="labelPosition !== 'end'" class="cui-divider__line" aria-hidden="true" />
  </div>

  <!-- Horizontal without label -->
  <hr
    class="cui-divider cui-divider--horizontal"
    v-else-if="orientation === 'horizontal'"
    v-show="!hidden"
    :style="rootVars"
    role="separator"
    aria-orientation="horizontal"
  />

  <!-- Vertical without label -->
  <div
    class="cui-divider cui-divider--vertical"
    v-else
    v-show="!hidden"
    :style="rootVars"
    role="separator"
    aria-orientation="vertical"
  />
</template>

<style scoped>
/*
 * Every themeable rule is a whole :where(), so a consumer's plain `.cui-divider { … }` at
 * (0,1,0) wins without !important; the structure (display, flex, which side the line is
 * drawn on) keeps normal specificity. The line's style and colour, the label's colour and
 * the spacing arrive as private --_divider-* properties on the root (#489).
 */
.cui-divider--horizontal {
  width: 100%;
}
:where(.cui-divider--horizontal) {
  margin-top: var(--_divider-spacing);
  margin-bottom: var(--_divider-spacing);
}
:where(.cui-divider--vertical) {
  margin-left: var(--_divider-spacing);
  margin-right: var(--_divider-spacing);
}

/* Labelled: a row (or column) of line, label, line. */
.cui-divider--labeled {
  display: flex;
  align-items: center;
}
.cui-divider--labeled.cui-divider--vertical {
  display: inline-flex;
  flex-direction: column;
  align-self: stretch;
}

/* The line itself: a bare <hr>, an empty vertical <div>, or either side of a label. */
:where(hr.cui-divider) {
  border: none;
}
:where(hr.cui-divider--horizontal) {
  border-top:var(--cui-divider-border, var(--_divider-border));
}
.cui-divider--vertical:not(.cui-divider--labeled) {
  display: inline-block;
  width: 0;
  align-self: stretch;
  min-height: 1rem;
}
:where(.cui-divider--vertical:not(.cui-divider--labeled)) {
  border-left: var(--cui-divider-border, var(--_divider-border));
}
.cui-divider__line {
  flex: 1;
}
.cui-divider--horizontal .cui-divider__line {
  height: 0;
}
.cui-divider--vertical .cui-divider__line {
  width: 0;
  min-height: 1rem;
}
:where(.cui-divider--horizontal .cui-divider__line) {
  border-top: var(--cui-divider-border, var(--_divider-border));
}
:where(.cui-divider--vertical .cui-divider__line) {
  border-left: var(--cui-divider-border, var(--_divider-border));
}

.cui-divider__label {
  white-space: nowrap;
  text-transform: uppercase;
}
:where(.cui-divider__label) {
  font-size: var(--cui-divider-font-size, 0.75rem);
  font-weight: 500;
  letter-spacing: 0.04em;
  color: var(--cui-divider-color, var(--_divider-color, var(--cui-text-tertiary)));
}
:where(.cui-divider--horizontal .cui-divider__label) {
  padding: 0 calc(0.75rem * var(--cui-density-scale, 1));
}
:where(.cui-divider--vertical .cui-divider__label) {
  padding: calc(0.5rem * var(--cui-density-scale, 1)) 0;
}
</style>
