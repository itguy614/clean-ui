<script setup lang="ts">
import { inject, ref, watch, nextTick, computed, onMounted, onUnmounted } from "vue";
import { DropdownContextKey, computeDropdownPosition } from "./dropdown-context";

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
    if (isOpen) {
      updatePosition();
      nextTick(() => {
        const firstItem = menuRef.value?.querySelector<HTMLElement>(
          '[role="menuitem"]:not([aria-disabled="true"])',
        );
        firstItem?.focus();
      });
    }
  },
);

// Reposition on scroll (for pinned mode -- parent won't close, so we track)
let scrollRAF: number | null = null;

function onScroll() {
  if (!ctx?.isOpen.value || ctx?.isClosing.value) return;
  if (scrollRAF) cancelAnimationFrame(scrollRAF);
  scrollRAF = requestAnimationFrame(updatePosition);
}

onMounted(() => {
  window.addEventListener("scroll", onScroll, true);
  window.addEventListener("resize", onScroll);
});

onUnmounted(() => {
  window.removeEventListener("scroll", onScroll, true);
  window.removeEventListener("resize", onScroll);
  if (scrollRAF) cancelAnimationFrame(scrollRAF);
});

function onKeydown(e: KeyboardEvent) {
  if (!menuRef.value) return;
  const items = Array.from(menuRef.value.querySelectorAll<HTMLElement>(
    '[role="menuitem"]:not([aria-disabled="true"]), [role="menuitemcheckbox"]:not([aria-disabled="true"]), [role="menuitemradio"]:not([aria-disabled="true"])',
  ));
  const currentIdx = items.indexOf(document.activeElement as HTMLElement);

  if (e.key === "ArrowDown") {
    e.preventDefault();
    const next = currentIdx < items.length - 1 ? currentIdx + 1 : 0;
    items[next]?.focus();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    const prev = currentIdx > 0 ? currentIdx - 1 : items.length - 1;
    items[prev]?.focus();
  } else if (e.key === "Home") {
    e.preventDefault();
    items[0]?.focus();
  } else if (e.key === "End") {
    e.preventDefault();
    items[items.length - 1]?.focus();
  }
}

const ownerId = computed(() => {
  const wrapper = ctx?.triggerEl.value?.closest("[data-cui-dropdown-id]");
  return wrapper?.getAttribute("data-cui-dropdown-id") ?? "";
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="ctx?.isOpen.value || ctx?.isClosing.value"
      ref="menuRef"
      class="cui-dropdown-menu"
      :class="{ 'cui-dropdown-menu--closing': ctx?.isClosing.value }"
      :data-cui-dropdown-owner="ownerId"
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
  padding: 0.25rem;
  border-radius: var(--cui-button-radius, 0.375rem);
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
