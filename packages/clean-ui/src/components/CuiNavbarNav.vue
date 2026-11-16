<script setup lang="ts">
import { onBeforeUnmount, watch } from "vue";
import CuiSlideover from "./CuiSlideover.vue";
import type { HideableProps } from "../types/common";
import { followsLink, useNavbarContext } from "./navbar-context";

export type CuiNavbarNavProps = HideableProps;

const props = withDefaults(defineProps<CuiNavbarNavProps>(), {
  hidden: false,
});

const { collapsed, open, drawerId, label, drawerName, close, registerNav } = useNavbarContext();

// Tells the bar there is a navigation to collapse, so it shows the menu button: not while this one
// is hidden, when the button would open an empty drawer.
let unregister: (() => void) | undefined;
watch(
  () => props.hidden,
  (hidden) => {
    unregister?.();
    unregister = hidden ? undefined : registerNav();
  },
  { immediate: true },
);
onBeforeUnmount(() => unregister?.());

/** Following a link leaves the drawer: it would otherwise stay over the page it navigated to. */
function onDrawerClick(event: MouseEvent) {
  if (followsLink(event)) close();
}
</script>

<template>
  <!-- Wide: the links sit in the bar. The slot renders here or in the drawer, never both. -->
  <nav v-if="!collapsed" v-show="!hidden" class="cui-navbar-nav" :aria-label="label">
    <slot />
  </nav>

  <!-- Narrow: nothing of the nav stays in the bar. The slideover mounts its panel only while
       open, so the links are out of the tab order until then. The host is a box-less wrapper:
       the slideover is teleported, and a Teleport can't be a component's root. -->
  <div v-else v-show="!hidden" class="cui-navbar-nav cui-navbar-nav--host">
    <CuiSlideover :id="drawerId" v-model:visible="open" side="left" :hidden="hidden" size="sm" :aria-label="drawerName">
      <nav class="cui-navbar-nav cui-navbar-nav--drawer" :aria-label="label" @click="onDrawerClick">
        <slot />
      </nav>
    </CuiSlideover>
  </div>
</template>

<style scoped>
/* --- Themeable --- Whole-:where() rules, so a plain consumer rule or a container token wins.
   The links are the consumer's own (<a>, router-link): the nav paints them, so they read as one
   set in the bar and in the drawer. A current page is raised, never filled with the primary. */
:where(.cui-navbar-nav :deep(a[href])) {
  padding: calc(0.375rem * var(--cui-density-scale, 1)) 0.625rem;
  border: 1px solid transparent;
  border-radius: var(--cui-navbar-radius, var(--cui-radius-md, 0.375rem));
  color: var(--cui-navbar-color, var(--cui-text-secondary));
  font-size: var(--cui-navbar-font-size, 0.875rem);
}

:where(.cui-navbar-nav :deep(a[href]:hover)) {
  background: var(--cui-navbar-hover-bg, var(--cui-surface-bg));
  color: var(--cui-navbar-hover-color, var(--cui-text-emphasis));
}

:where(.cui-navbar-nav :deep(a[aria-current="page"])) {
  border-color: var(--cui-navbar-pressed-border, var(--cui-border));
  background: var(--cui-navbar-pressed-bg, var(--cui-surface-bg));
  color: var(--cui-navbar-pressed-color, var(--cui-text-emphasis));
}

/* --- Structural --- */
.cui-navbar-nav {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  min-width: 0;
}

.cui-navbar-nav :deep(a[href]) {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  box-sizing: border-box;
  line-height: inherit;
  text-decoration: none;
}

/* The collapsed host holds only the teleported drawer: it takes no room in the bar. */
.cui-navbar-nav--host {
  display: contents;
}

.cui-navbar-nav--drawer {
  flex: 1;
  flex-direction: column;
  align-items: stretch;
  gap: 0.125rem;
  padding: calc(0.75rem * var(--cui-density-scale, 1));
}

.cui-navbar-nav--drawer :deep(a[href]) {
  display: flex;
}
</style>
