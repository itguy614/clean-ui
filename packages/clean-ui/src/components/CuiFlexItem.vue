<script setup lang="ts">
import { computed } from "vue";
import { useBreakpoint } from "../composables/useBreakpoint";
import { resolveResponsive } from "../utils/responsive";
import type { ResponsiveValue } from "../types/grid";

export interface CuiFlexItemProps {
  /** Flex grow value (0-1) */
  grow?: ResponsiveValue<0 | 1>;
  /** Flex shrink value (0-1) */
  shrink?: ResponsiveValue<0 | 1>;
  /** Flex shorthand (e.g., "1", "auto", "initial", "none") */
  flex?: ResponsiveValue<"1" | "auto" | "initial" | "none">;
  /** Hide the component */
  hidden?: boolean;
}

const props = withDefaults(defineProps<CuiFlexItemProps>(), {
  hidden: false,
});
const { breakpoint } = useBreakpoint();

const itemStyle = computed(() => {
  const bp = breakpoint.value;
  const style: Record<string, string> = {};

  const flex = resolveResponsive(props.flex, undefined, bp);
  if (flex !== undefined) {
    style.flex = flex;
  } else {
    const grow = resolveResponsive(props.grow, undefined, bp);
    const shrink = resolveResponsive(props.shrink, undefined, bp);
    if (grow !== undefined) style.flexGrow = String(grow);
    if (shrink !== undefined) style.flexShrink = String(shrink);
  }

  return style;
});
</script>

<template>
  <div v-show="!hidden" class="cui-flex-item" :style="itemStyle">
    <slot />
  </div>
</template>
