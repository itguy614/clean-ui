<script setup lang="ts">
import { inject, ref, watch, onUnmounted } from "vue";
import { useEventListener } from "../composables/useEventListener";
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
const menuRef = ref<HTMLElement>();
const menuStyle = ref<Record<string, string>>({});

function updatePosition() {
  if (ctx?.triggerEl.value) {
    const { styles } = computeDropdownPosition(ctx.triggerEl.value, ctx.placement.value);
    menuStyle.value = styles;
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
  if (ctx?.isClosing.value) return;
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
    <div
      v-if="ctx?.isOpen.value || ctx?.isClosing.value"
      :id="ctx?.ownerId && `${ctx.ownerId}-menu`"
      ref="menuRef"
      class="cui-dropdown-menu"
      :class="{ 'cui-dropdown-menu--closing': ctx?.isClosing.value }"
      :data-cui-menu-owner="ctx?.ownerId"
      :style="{ ...menuStyle, minWidth }"
      role="menu"
      @keydown="onKeydown"
    >
      <slot />
    </div>
  </Teleport>
</template>

<style scoped>
.cui-dropdown-menu {
  padding: calc(0.25rem * var(--cui-density-scale, 1));
  border-radius: var(--cui-button-radius, var(--cui-radius-md, 0.375rem));
  border: 1px solid var(--cui-border);
  background: var(--cui-surface-base);
  box-shadow: 0 4px 16px rgb(0 0 0 / 0.1);
  overflow-y: auto;
  animation: cui-dropdown-in 0.15s ease forwards;
}

.cui-dropdown-menu--closing {
  animation: cui-dropdown-out 0.15s ease forwards;
  pointer-events: none;
}

:where(.dark, .dark *) .cui-dropdown-menu {
  box-shadow: 0 4px 16px rgb(0 0 0 / 0.3);
}

@keyframes cui-dropdown-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes cui-dropdown-out {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-4px);
  }
}
</style>
