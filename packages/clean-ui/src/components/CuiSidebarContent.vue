<script setup lang="ts">
import type { HideableProps } from "../types/common";
import { useSidebarContext } from "./sidebar-context";

export type CuiSidebarContentProps = HideableProps;

withDefaults(defineProps<CuiSidebarContentProps>(), {
  hidden: false,
});

// Fails clearly outside a CuiSidebar.
useSidebarContext();
</script>

<template>
  <!-- The part that scrolls: the header and footer stay put around it. -->
  <div v-show="!hidden" class="cui-sidebar-content cui-scrollbar">
    <slot />
  </div>
</template>

<style scoped>
:where(.cui-sidebar-content) {
  padding: calc(0.25rem * var(--cui-density-scale, 1)) calc(0.75rem * var(--cui-density-scale, 1)) calc(1rem * var(--cui-density-scale, 1));
}

.cui-sidebar-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: calc(0.75rem * var(--cui-density-scale, 1));
  min-height: 0;
  overflow-y: auto;
}
</style>
