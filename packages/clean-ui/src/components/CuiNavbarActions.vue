<script setup lang="ts">
import type { HideableProps } from "../types/common";
import { useNavbarContext } from "./navbar-context";

export type CuiNavbarActionsProps = HideableProps;

withDefaults(defineProps<CuiNavbarActionsProps>(), {
  hidden: false,
});

// Fails clearly outside a CuiNavbar.
useNavbarContext();
</script>

<template>
  <!-- Plain content: buttons, a theme switcher, an account menu. The bar gives it the trailing edge. -->
  <div v-show="!hidden" class="cui-navbar-actions"><slot /></div>
</template>

<style scoped>
.cui-navbar-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: var(--cui-navbar-gap, 0.5rem);
  margin-inline-start: auto;
}
</style>
