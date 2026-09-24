<script setup lang="ts">
import { computed } from "vue";
import type { HideableProps } from "../types/common";

export interface CuiCardFooterProps extends HideableProps {
  /** Align footer content */
  align?: "left" | "right" | "center" | "between";
}

const props = withDefaults(defineProps<CuiCardFooterProps>(), {
  align: "right",
  hidden: false,
});

const justifyMap: Record<string, string> = {
  left: "flex-start",
  right: "flex-end",
  center: "center",
  between: "space-between",
};

/** `align` is the only prop that reaches the styling, so it is the only thing emitted. */
const footerStyle = computed(() => ({ "--_card-footer-justify": justifyMap[props.align] }));
</script>

<template>
  <div class="cui-card-footer" v-show="!hidden" :style="footerStyle">
    <slot />
  </div>
</template>

<style scoped>
:where(.cui-card-footer) {
  padding: var(
    --cui-card-footer-padding,
    calc(0.375rem * var(--cui-density-scale, 1)) calc(1.125rem * var(--cui-density-scale, 1))
      calc(1rem * var(--cui-density-scale, 1))
  );
  gap: var(--cui-card-footer-gap, calc(0.5rem * var(--cui-density-scale, 1)));
  justify-content: var(--cui-card-footer-justify, var(--_card-footer-justify));
}

.cui-card-footer {
  display: flex;
  align-items: center;
}
</style>
