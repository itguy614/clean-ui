<script setup lang="ts">
import CuiFlex from "./CuiFlex.vue";
import type { ResponsiveValue, TailwindSpacing } from "../types/grid";
import type { CuiOrientation, HideableProps } from "../types/common";

export interface CuiStackProps extends HideableProps {
  /** Stack orientation: vertical (column) or horizontal (row) */
  orientation?: CuiOrientation;
  /** Spacing between items (Tailwind spacing scale) */
  spacing?: ResponsiveValue<TailwindSpacing>;
  /** Enable debug mode */
  debug?: boolean;
}

const props = withDefaults(defineProps<CuiStackProps>(), {
  orientation: "vertical",
  spacing: "4",
  debug: false,
  hidden: false,
});
</script>

<template>
  <CuiFlex
    v-show="!hidden"
    :direction="orientation === 'vertical' ? 'col' : 'row'"
    :gap="spacing"
    :debug="debug"
    wrap="nowrap"
    class="cui-stack"
  >
    <slot />
  </CuiFlex>
</template>
