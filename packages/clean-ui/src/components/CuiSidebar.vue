<script setup lang="ts">
import { computed, useTemplateRef } from "vue";
import CuiButton from "./CuiButton.vue";
import CuiIcon from "./CuiIcon.vue";
import CuiSlideover from "./CuiSlideover.vue";
import { useCollapseToDrawer, type CuiCollapseBelow } from "../composables/useCollapseToDrawer";
import { useMessages } from "../composables/useMessages";
import type { HideableProps } from "../types/common";
import { useSidebarProvider } from "./sidebar-context";
import { IconList } from "../icons/generated/list";

export interface CuiSidebarProps extends HideableProps {
  /**
   * The accessible name of the `<nav>` landmark. A page with a sidebar and another
   * navigation has two, and they must be told apart. Defaults to the catalogue's "Sidebar".
   */
  label?: string;
  /**
   * The viewport below which the sidebar leaves the page and its content moves into a
   * `CuiSlideover`: a Tailwind breakpoint, or `never` to stay inline at every width (a
   * sidebar nested in a container or a drawer of its own).
   */
  collapseBelow?: CuiCollapseBelow;
  /** Which edge the sidebar sits on, and the drawer slides from. */
  side?: "left" | "right";
  /**
   * Stick to the top of the page while it scrolls, below `--cui-navbar-height` (0 without a
   * navbar), filling the rest of the viewport. Off, the sidebar sizes to its container.
   */
  sticky?: boolean;
  /**
   * Show the menu button that opens the drawer while collapsed. Turn it off to open the
   * drawer from your own button through `v-model:open`.
   */
  toggle?: boolean;
}

const props = withDefaults(defineProps<CuiSidebarProps>(), {
  collapseBelow: "lg",
  side: "left",
  sticky: false,
  toggle: true,
  hidden: false,
});

/** Whether the drawer is open (`v-model:open`). Only meaningful while collapsed. */
const openModel = defineModel<boolean>("open");

const messages = useMessages();
const { collapsed, open, drawerId, toggle: toggleDrawer, close, toggleAttrs } = useCollapseToDrawer({
  collapseBelow: () => props.collapseBelow,
  open: openModel,
});

useSidebarProvider({});

/** Following a link leaves the drawer: it would otherwise stay over the page it navigated to. */
function onDrawerClick(event: MouseEvent) {
  if ((event.target as Element | null)?.closest("a[href]")) close();
}

const name = computed(() => props.label ?? messages.value.navigation?.sidebar ?? "Sidebar");
// The drawer is a dialog around the `<nav>`: it is named for what it is (the menu), so the
// dialog and the landmark inside it are not announced under one name.
const drawerName = computed(() => messages.value.navigation?.menu ?? "Navigation menu");

const elRef = useTemplateRef<HTMLElement>("rootEl");
// `toggleAttrs` (aria-expanded, aria-controls, the catalogue's menu name) lets a button of your
// own, in a header, drive the drawer with the library's labelling: `v-bind` it on the button.
defineExpose({ el: elRef, open, toggle: toggleDrawer, toggleAttrs, collapsed });
</script>

<template>
  <!-- Inline: the navigation is a column in the page, sized by its container. -->
  <nav
    v-if="!collapsed"
    v-show="!hidden"
    ref="rootEl"
    class="cui-sidebar"
    :class="[`cui-sidebar--${side}`, { 'cui-sidebar--sticky': sticky }]"
    :aria-label="name"
  >
    <slot />
  </nav>

  <!-- Collapsed: only the menu button stays in the page; the navigation is the slideover's
       content, mounted while it is open, so it is not in the tab order otherwise. -->
  <div v-else v-show="!hidden" ref="rootEl" class="cui-sidebar cui-sidebar--collapsed">
    <CuiButton v-if="toggle" variant="ghost" size="sm" v-bind="toggleAttrs" @click="toggleDrawer">
      <template #prefix><CuiIcon :icon="IconList" size="1.25rem" /></template>
    </CuiButton>
    <CuiSlideover
      :id="drawerId"
      v-model:visible="open"
      :side="side"
      :hidden="hidden"
      size="sm"
      :aria-label="drawerName"
    >
      <nav class="cui-sidebar cui-sidebar--drawer" :aria-label="name" @click="onDrawerClick">
        <slot />
      </nav>
    </CuiSlideover>
  </div>
</template>

<style scoped>
/* --- Themeable --- Whole-:where() rules, so a plain consumer rule or a container token wins. */
:where(.cui-sidebar) {
  /* The links inside are CuiList rows: tighten them to a navigation's scale, through the
     list's own public tokens. */
  --cui-list-py: calc(0.375rem * var(--cui-density-scale, 1));
  --cui-list-px: 0.625rem;
  --cui-list-font-size: 0.875rem;
  --cui-list-color: var(--cui-text-body);
  background: var(--cui-sidebar-bg, var(--cui-surface-base));
  color: var(--cui-text-body);
}

:where(.cui-sidebar--left:not(.cui-sidebar--drawer)) {
  border-inline-end: 1px solid var(--cui-sidebar-border, var(--cui-border));
}

:where(.cui-sidebar--right:not(.cui-sidebar--drawer)) {
  border-inline-start: 1px solid var(--cui-sidebar-border, var(--cui-border));
}

/* --- Structural --- */
.cui-sidebar {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  min-height: 0;
  min-width: 0;
}

/* Sizes to its container: a column that fills the height it is given. Zero specificity, so
   the sticky and collapsed forms below, or a consumer's own height, replace it. */
:where(.cui-sidebar) {
  height: 100%;
}

.cui-sidebar--drawer {
  flex: 1;
}

/* The page owns the viewport only if asked: stuck below the navbar, if there is one. */
.cui-sidebar--sticky {
  position: sticky;
  top: var(--cui-navbar-height, 0px);
  height: calc(100dvh - var(--cui-navbar-height, 0px));
  align-self: flex-start;
}

/* The collapsed host holds only the menu button. */
.cui-sidebar--collapsed {
  flex-direction: row;
  height: auto;
  background: none;
}

/* The links (a CuiList's rows) keep a transparent border, so the current page's border
   takes no room, and a subtle raised fill marks it: never the solid primary colour. */
.cui-sidebar :deep(.cui-list-item__row) {
  border: 1px solid transparent;
  border-radius: var(--cui-sidebar-radius, var(--cui-radius-md, 0.375rem));
}

.cui-sidebar :deep(.cui-list-item__row[aria-current="page"]) {
  border-color: var(--cui-sidebar-pressed-border, var(--cui-border));
  background: var(--cui-sidebar-pressed-bg, var(--cui-surface-bg));
  color: var(--cui-sidebar-pressed-color, var(--cui-text-emphasis));
}
</style>
