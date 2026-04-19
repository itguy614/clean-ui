<script setup lang="ts">
import { ref, provide, nextTick, onMounted, onUnmounted } from "vue";
import { DropdownContextKey, type DropdownTrigger, type DropdownPlacement } from "./dropdown-context";

export interface CuiContextMenuProps {
  /** Prevents the context menu from opening */
  disabled?: boolean;
  /** Minimum width of the menu panel */
  minWidth?: string;
  /** Hide the component */
  hidden?: boolean;
}

const props = withDefaults(defineProps<CuiContextMenuProps>(), {
  disabled: false,
  minWidth: "12rem",
  hidden: false,
});

const isOpen = ref(false);
const isClosing = ref(false);
const wrapperRef = ref<HTMLElement | null>(null);
const menuRef = ref<HTMLElement | null>(null);
const menuStyle = ref<Record<string, string>>({});
let closeAnimTimer: ReturnType<typeof setTimeout> | null = null;

// Unique ID for click-outside detection on teleported menu
const contextMenuId = `cui-ctx-${Math.random().toString(36).slice(2, 8)}`;

function open() {
  if (props.disabled) return;
  if (closeAnimTimer) { clearTimeout(closeAnimTimer); closeAnimTimer = null; }
  isClosing.value = false;
  isOpen.value = true;
}

function close() {
  if (!isOpen.value) return;
  isClosing.value = true;
  closeAnimTimer = setTimeout(() => {
    isOpen.value = false;
    isClosing.value = false;
  }, 150);
}

function closeAll() {
  close();
}

function positionAtCursor(x: number, y: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const padding = 16;

  const styles: Record<string, string> = {
    position: "fixed",
    zIndex: "9990",
  };

  // Default: open rightward and downward from cursor
  styles.left = `${x}px`;
  styles.top = `${y}px`;
  styles.maxHeight = `${Math.min(vh - y - padding, 400)}px`;

  menuStyle.value = styles;

  // After render, check if menu overflows and adjust
  nextTick(() => {
    if (!menuRef.value) return;
    const rect = menuRef.value.getBoundingClientRect();

    const adjusted = { ...styles };

    // Flip left if overflows right edge
    if (rect.right > vw - padding) {
      adjusted.left = `${Math.max(padding, x - rect.width)}px`;
    }

    // Flip up if overflows bottom edge
    if (rect.bottom > vh - padding) {
      const newTop = Math.max(padding, y - rect.height);
      adjusted.top = `${newTop}px`;
      adjusted.maxHeight = `${Math.min(y - padding, 400)}px`;
    }

    menuStyle.value = adjusted;

    // Focus first item
    const firstItem = menuRef.value?.querySelector<HTMLElement>(
      '[role="menuitem"]:not([aria-disabled="true"])',
    );
    firstItem?.focus();
  });
}

function onContextMenu(e: MouseEvent) {
  if (props.disabled) return;
  e.preventDefault();
  // Close any existing open instance first
  if (isOpen.value) {
    isOpen.value = false;
    isClosing.value = false;
    if (closeAnimTimer) { clearTimeout(closeAnimTimer); closeAnimTimer = null; }
  }
  positionAtCursor(e.clientX, e.clientY);
  open();
}

// Keyboard navigation within menu
function onMenuKeydown(e: KeyboardEvent) {
  if (!menuRef.value) return;

  if (e.key === "Escape") {
    e.preventDefault();
    e.stopPropagation();
    close();
    return;
  }

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

// Click outside detection
function onClickOutside(e: MouseEvent) {
  if (!isOpen.value) return;
  const target = e.target as Node;

  if (wrapperRef.value?.contains(target)) return;
  const teleportedMenu = document.querySelector(`[data-cui-context-menu-id="${contextMenuId}"]`);
  if (teleportedMenu?.contains(target)) return;

  close();
}

// Close on scroll
function onScroll() {
  if (isOpen.value) close();
}

onMounted(() => {
  document.addEventListener("mousedown", onClickOutside);
  window.addEventListener("scroll", onScroll, true);
});

onUnmounted(() => {
  document.removeEventListener("mousedown", onClickOutside);
  window.removeEventListener("scroll", onScroll, true);
  if (closeAnimTimer) clearTimeout(closeAnimTimer);
});

// Sub-menu tracking (required by DropdownContext interface)
const subMenuClosers = new Set<() => void>();

function registerSubMenu(closeFn: () => void): () => void {
  subMenuClosers.add(closeFn);
  return () => subMenuClosers.delete(closeFn);
}

function closeSiblingSubMenus(except?: () => void) {
  for (const closeFn of subMenuClosers) {
    if (closeFn !== except) closeFn();
  }
}

// Provide DropdownContext so all dropdown item components work
provide(DropdownContextKey, {
  isOpen,
  isClosing,
  trigger: ref("click" as DropdownTrigger),
  triggerEl: wrapperRef,
  placement: ref("bottom" as DropdownPlacement),
  open,
  close,
  toggle: () => { if (isOpen.value) close(); else open(); },
  closeAll,
  registerSubMenu,
  closeSiblingSubMenus,
  reposition: () => {},
});

defineExpose({ open, close, isOpen });
</script>

<template>
  <div
    ref="wrapperRef"
    v-show="!hidden"
    class="cui-context-menu"
    @contextmenu="onContextMenu"
  >
    <slot />

    <Teleport to="body">
      <div
        v-if="isOpen || isClosing"
        ref="menuRef"
        class="cui-context-menu__panel"
        :class="{ 'cui-context-menu__panel--closing': isClosing }"
        :data-cui-context-menu-id="contextMenuId"
        :style="{ ...menuStyle, minWidth }"
        role="menu"
        @keydown="onMenuKeydown"
      >
        <slot name="menu" />
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.cui-context-menu {
  display: contents;
}

.cui-context-menu__panel {
  padding: 0.25rem;
  border-radius: var(--cui-button-radius, 0.375rem);
  border: 1px solid var(--cui-border);
  background: var(--cui-surface-base);
  box-shadow: 0 4px 16px rgb(0 0 0 / 0.1);
  overflow-y: auto;
  animation: cui-context-menu-in 0.15s ease forwards;
}

.cui-context-menu__panel--closing {
  animation: cui-context-menu-out 0.15s ease forwards;
  pointer-events: none;
}

:where(.dark, .dark *) .cui-context-menu__panel {
  box-shadow: 0 4px 16px rgb(0 0 0 / 0.3);
}

@keyframes cui-context-menu-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes cui-context-menu-out {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.95);
  }
}
</style>
