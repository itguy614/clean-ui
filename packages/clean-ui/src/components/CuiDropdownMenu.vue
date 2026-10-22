<script setup lang="ts">
import { inject, ref, watch, onUnmounted } from "vue";
import { useEventListener } from "../composables/useEventListener";
import { usePresence } from "../composables/usePresence";
import { panelTransition } from "../utils/motion";
import { DropdownContextKey } from "./dropdown-context";
import { computeDropdownPosition } from "../utils/position";
import { focusMenuEdge, onMenuKeydown } from "../utils/menu";

export interface CuiDropdownMenuProps {
  /** Min width of the menu */
  minWidth?: string;
}

const props = withDefaults(defineProps<CuiDropdownMenuProps>(), {
  minWidth: "12rem",
});

const ctx = inject(DropdownContextKey);
const { present, onAfterLeave } = usePresence(() => !!ctx?.isOpen.value);
const menuRef = ref<HTMLElement>();
const menuStyle = ref<Record<string, string>>({});

function updatePosition() {
  if (ctx?.triggerEl.value) {
    const { styles, transformOrigin } = computeDropdownPosition(ctx.triggerEl.value, ctx.placement.value);
    // Grows out of the trigger, whichever side it opened on after flipping (#262).
    menuStyle.value = { ...styles, "--_dropdown-menu-transform-origin": transformOrigin };
  }
}

// Compute position synchronously when opening
watch(
  () => ctx?.isOpen.value,
  (isOpen) => {
    if (isOpen) updatePosition();
  },
);

// Focus moves in on every open, once the menu has rendered.
watch(
  () => ctx?.focusRequest?.value,
  (request) => request && focusMenuEdge(menuRef.value, request.edge),
  { flush: "post" },
);

// Reposition on scroll while open (a pinned dropdown stays open; an unpinned one closes)
let scrollRAF: number | null = null;

function onScroll() {
  if (!ctx?.isOpen.value) return;
  if (scrollRAF) cancelAnimationFrame(scrollRAF);
  scrollRAF = requestAnimationFrame(updatePosition);
}

const menuOpen = () => !!ctx?.isOpen.value;
useEventListener("window", ["scroll", "resize"], onScroll, { enabled: menuOpen, capture: true });

onUnmounted(() => {
  if (scrollRAF) cancelAnimationFrame(scrollRAF);
});

function onKeydown(e: KeyboardEvent) {
  if (menuRef.value && ctx) onMenuKeydown(e, menuRef.value, ctx.close);
}
</script>

<template>
  <Teleport to="body">
    <Transition v-bind="panelTransition" @after-leave="onAfterLeave">
    <div
      v-if="present"
      v-show="ctx?.isOpen.value"
      :id="ctx?.ownerId && `${ctx.ownerId}-menu`"
      ref="menuRef"
      class="cui-dropdown-menu"
      :data-cui-menu-owner="ctx?.ownerId"
      :style="{ ...menuStyle, minWidth }"
      role="menu"
      @keydown="onKeydown"
    >
      <slot />
    </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
:where(.cui-dropdown-menu) {
  transform-origin: var(--_dropdown-menu-transform-origin);
}

.cui-dropdown-menu {
  padding: calc(0.25rem * var(--cui-density-scale, 1));
  border-radius: var(--cui-button-radius, var(--cui-radius-md, 0.375rem));
  border: 1px solid var(--cui-border);
  background: var(--cui-surface-base);
  box-shadow: var(--cui-shadow-md);
  overflow-y: auto;
}
</style>
