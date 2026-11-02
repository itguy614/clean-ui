<script setup lang="ts">
import { computed } from "vue";
import { useToolbarContext } from "./toolbar-context";
import type { HideableProps } from "../types/common";

/**
 * A rule between sets of controls in a CuiToolbar (#190). It stands across the toolbar's
 * axis on its own: upright in a horizontal toolbar, flat in a vertical one. Not focusable,
 * so the toolbar's arrow keys pass over it.
 */
export interface CuiToolbarSeparatorProps extends HideableProps {}

withDefaults(defineProps<CuiToolbarSeparatorProps>(), { hidden: false });

const toolbar = useToolbarContext();
const axis = computed(() => (toolbar.orientation.value === "horizontal" ? "vertical" : "horizontal"));
</script>

<template>
  <div
    v-show="!hidden"
    class="cui-toolbar-separator"
    :class="`cui-toolbar-separator--${axis}`"
    role="separator"
    :aria-orientation="axis"
  />
</template>

<style>
.cui-toolbar-separator {
  flex-shrink: 0;
  align-self: stretch;
}

/* --- Themeable: zero specificity, so a consumer's own rule wins --- */
:where(.cui-toolbar-separator) {
  background: var(--cui-toolbar-separator-bg, var(--cui-border));
}

:where(.cui-toolbar-separator--vertical) {
  width: 1px;
  margin-block: calc(0.25rem * var(--cui-density-scale, 1));
}

:where(.cui-toolbar-separator--horizontal) {
  height: 1px;
  margin-inline: calc(0.25rem * var(--cui-density-scale, 1));
}
</style>
