<script setup lang="ts">
import { Comment, Fragment, cloneVNode, useSlots, type VNode } from "vue";
import CuiButton from "./CuiButton.vue";
import CuiDropdown from "./CuiDropdown.vue";
import CuiDropdownMenu from "./CuiDropdownMenu.vue";
import CuiDropdownTrigger from "./CuiDropdownTrigger.vue";
import CuiIcon from "./CuiIcon.vue";
import CuiSidebarGroup from "./CuiSidebarGroup.vue";
import type { HideableProps } from "../types/common";
import { useNavbarContext } from "./navbar-context";
import { IconCaretDown } from "../icons/generated/caret-down";

export interface CuiNavbarMenuProps extends HideableProps {
  /** The menu's name: the trigger's text in the bar, the group's heading in the drawer. The `#label` slot replaces it. */
  label?: string;
}

/**
 * A group of links inside a CuiNavbarNav, written once. The navbar decides how it shows: a
 * CuiDropdown in the bar (menu semantics and keyboard come from it), a collapsible
 * CuiSidebarGroup in the drawer. Its items are links (`<a>`, `router-link`): in the dropdown
 * each becomes a `menuitem`, and choosing one closes the menu.
 */
withDefaults(defineProps<CuiNavbarMenuProps>(), {
  hidden: false,
});

const { collapsed } = useNavbarContext();
const slots = useSlots();

/** The slot's nodes, with fragments flattened (a `v-for`) and comments (a false `v-if`) dropped. */
function flatten(nodes: VNode[]): VNode[] {
  return nodes.flatMap((n) => (n.type === Fragment ? flatten(n.children as VNode[]) : n.type === Comment ? [] : [n]));
}

/** The default slot, each item given the menu role the dropdown's keyboard looks for. */
const MenuItems = () =>
  flatten(slots.default?.() ?? []).map((n) => (typeof n.type === "symbol" ? n : cloneVNode(n, { role: "menuitem" }, true)));

/** Choosing a link closes the menu (the dropdown's own items do the same). */
function onItemsClick(event: MouseEvent, close: () => void) {
  if ((event.target as Element | null)?.closest("a[href]")) close();
}
</script>

<template>
  <!-- Wide: a dropdown, whose trigger is a menu button and whose panel holds the links. -->
  <CuiDropdown v-if="!collapsed" v-slot="{ close }" v-show="!hidden" class="cui-navbar-menu">
    <CuiDropdownTrigger>
      <CuiButton variant="ghost" size="sm" class="cui-navbar-menu__trigger">
        <slot name="label">{{ label }}</slot>
        <template #suffix><CuiIcon :icon="IconCaretDown" size="sm" /></template>
      </CuiButton>
    </CuiDropdownTrigger>
    <CuiDropdownMenu>
      <div class="cui-navbar-menu__items" role="none" @click="onItemsClick($event, close)">
        <MenuItems />
      </div>
    </CuiDropdownMenu>
  </CuiDropdown>

  <!-- Narrow: a collapsible group in the drawer. The group is a block, a link keeps its own row. -->
  <CuiSidebarGroup v-else v-show="!hidden" class="cui-navbar-menu" :label="label">
    <template v-if="$slots.label" #label><slot name="label" /></template>
    <slot />
  </CuiSidebarGroup>
</template>

<style scoped>
.cui-navbar-menu__items {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

/* The links of the panel, painted like the bar's own. */
.cui-navbar-menu__items :deep(a[href]) {
  display: block;
  padding: calc(0.375rem * var(--cui-density-scale, 1)) 0.625rem;
  border-radius: var(--cui-navbar-radius, var(--cui-radius-md, 0.375rem));
  color: var(--cui-text-body);
  font-size: var(--cui-navbar-font-size, 0.875rem);
  line-height: inherit;
  text-decoration: none;
}

.cui-navbar-menu__items :deep(a[href]:hover),
.cui-navbar-menu__items :deep(a[href]:focus-visible) {
  background: var(--cui-navbar-hover-bg, var(--cui-surface-bg));
  color: var(--cui-navbar-hover-color, var(--cui-text-emphasis));
  outline: none;
}

.cui-navbar-menu__items :deep(a[aria-current="page"]) {
  background: var(--cui-navbar-pressed-bg, var(--cui-surface-bg));
  color: var(--cui-navbar-pressed-color, var(--cui-text-emphasis));
}
</style>
