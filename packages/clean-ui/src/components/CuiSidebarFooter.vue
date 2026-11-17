<script setup lang="ts">
import type { HideableProps } from "../types/common";
import { useSidebarContext } from "./sidebar-context";

export type CuiSidebarFooterProps = HideableProps;

withDefaults(defineProps<CuiSidebarFooterProps>(), {
  hidden: false,
});

// Fails clearly outside a CuiSidebar.
useSidebarContext();
</script>

<template>
  <div v-show="!hidden" class="cui-sidebar-footer">
    <slot />
  </div>
</template>

<style scoped>
:where(.cui-sidebar-footer) {
  padding: calc(0.75rem * var(--cui-density-scale, 1)) calc(1rem * var(--cui-density-scale, 1));
  border-top: 1px solid var(--cui-sidebar-footer-border, var(--cui-border));
}

.cui-sidebar-footer {
  flex-shrink: 0;
}
</style>
