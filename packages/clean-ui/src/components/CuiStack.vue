<script setup lang="ts">
import CuiFlex from "./CuiFlex.vue";
import type { ResponsiveValue, TailwindSpacing } from "../types/grid";

export interface CuiStackProps {
  /** Stack direction: vertical (column) or horizontal (row) */
  direction?: "vertical" | "horizontal";
  /** Spacing between items (Tailwind spacing scale) */
  spacing?: ResponsiveValue<TailwindSpacing>;
  /** Enable debug mode */
  debug?: boolean;
  /** Hide the component */
  hidden?: boolean;
}

const props = withDefaults(defineProps<CuiStackProps>(), {
  direction: "vertical",
  spacing: "4",
  debug: false,
  hidden: false,
});
</script>

<template>
  <CuiFlex
    v-show="!hidden"
    :direction="direction === 'vertical' ? 'col' : 'row'"
    :gap="spacing"
    :debug="debug"
    wrap="nowrap"
    class="cui-stack"
  >
    <slot />
  </CuiFlex>
</template>
