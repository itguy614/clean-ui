<script setup lang="ts">
import type { HideableProps } from "../types/common";
import { useNavbarContext } from "./navbar-context";

export interface CuiNavbarBrandProps extends HideableProps {
  /**
   * Make the brand a link (typically to the home page). Without it the brand is plain
   * content; put a `router-link` in the default slot for a routed one.
   */
  href?: string;
}

withDefaults(defineProps<CuiNavbarBrandProps>(), {
  hidden: false,
});

// Fails clearly outside a CuiNavbar.
useNavbarContext();
</script>

<template>
  <a v-if="href" v-show="!hidden" :href="href" class="cui-navbar-brand"><slot /></a>
  <div v-else v-show="!hidden" class="cui-navbar-brand"><slot /></div>
</template>

<style scoped>
:where(.cui-navbar-brand) {
  color: var(--cui-text-emphasis);
  font-size: 1.125rem;
  font-weight: 700;
}

.cui-navbar-brand {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.5rem;
  line-height: inherit;
  text-decoration: none;
}
</style>
