<script setup lang="ts">
import { ref, provide, toRef, onMounted, onUnmounted } from "vue";
import { DropdownContextKey, type DropdownTrigger, type DropdownPlacement } from "./dropdown-context";

export interface CuiDropdownProps {
  /** How the dropdown is triggered */
  trigger?: DropdownTrigger;
  /** Preferred placement */
  placement?: DropdownPlacement;
  /** Keep dropdown anchored to trigger on scroll instead of closing */
  pinned?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

const props = withDefaults(defineProps<CuiDropdownProps>(), {
  trigger: "click",
  placement: "bottom",
  pinned: false,
  disabled: false,
});

const isOpen = ref(false);
const isClosing = ref(false);
const triggerEl = ref<HTMLElement | null>(null);
let showTimer: ReturnType<typeof setTimeout> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;
let closeAnimTimer: ReturnType<typeof setTimeout> | null = null;

function open() {
  if (props.disabled) return;
  if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
  if (closeAnimTimer) { clearTimeout(closeAnimTimer); closeAnimTimer = null; }
  isClosing.value = false;
  isOpen.value = true;
}

function close() {
  if (showTimer) { clearTimeout(showTimer); showTimer = null; }
  if (!isOpen.value) return;
  isClosing.value = true;
  closeAnimTimer = setTimeout(() => {
    isOpen.value = false;
    isClosing.value = false;
  }, 150);
}

function toggle() {
  if (isOpen.value) close(); else open();
}

function closeAll() {
  close();
}

function onMouseEnter() {
  if (props.trigger === "hover" || props.trigger === "hover-focus") {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    showTimer = setTimeout(open, 100);
  }
}

function onMouseLeave() {
  if (props.trigger === "hover" || props.trigger === "hover-focus") {
    if (showTimer) { clearTimeout(showTimer); showTimer = null; }
    hideTimer = setTimeout(close, 150);
  }
}

function onFocusIn() {
  if (props.trigger === "hover-focus") open();
}

function onFocusOut(e: FocusEvent) {
  if (props.trigger === "hover-focus") {
    const related = e.relatedTarget as Node | null;
    const el = (e.currentTarget as HTMLElement);
    if (related && el.contains(related)) return;
    hideTimer = setTimeout(close, 150);
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape" && isOpen.value) {
    e.stopPropagation();
    close();
  }
}

// Click outside -- check both the wrapper and any teleported menus
const dropdownId = `cui-dd-${Math.random().toString(36).slice(2, 8)}`;

function onClickOutside(e: MouseEvent) {
  const wrapper = document.querySelector(`[data-cui-dropdown-id="${dropdownId}"]`);
  const menus = document.querySelectorAll(`[data-cui-dropdown-owner="${dropdownId}"]`);
  const target = e.target as Node;

  if (wrapper?.contains(target)) return;
  for (const menu of menus) {
    if (menu.contains(target)) return;
  }
  close();
}

function reposition() {
  // Menu handles its own repositioning via scroll listener
}

function onScroll() {
  if (!isOpen.value) return;
  if (!props.pinned) {
    close();
  }
  // When pinned, the menu repositions itself via its own scroll listener
}

onMounted(() => {
  document.addEventListener("mousedown", onClickOutside);
  window.addEventListener("scroll", onScroll, true);
});

onUnmounted(() => {
  document.removeEventListener("mousedown", onClickOutside);
  window.removeEventListener("scroll", onScroll, true);
  if (showTimer) clearTimeout(showTimer);
  if (hideTimer) clearTimeout(hideTimer);
  if (closeAnimTimer) clearTimeout(closeAnimTimer);
});

// Track sub-menu close callbacks so siblings can close each other
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

provide(DropdownContextKey, {
  isOpen,
  isClosing,
  trigger: toRef(props, "trigger"),
  triggerEl,
  placement: toRef(props, "placement"),
  open,
  close,
  toggle,
  closeAll,
  registerSubMenu,
  closeSiblingSubMenus,
  reposition,
});

defineExpose({ open, close, toggle, isOpen });
</script>

<template>
  <div
    class="cui-dropdown"
    :data-cui-dropdown-id="dropdownId"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
    @keydown="onKeydown"
  >
    <slot :is-open="isOpen" :toggle="toggle" :open="open" :close="close" />
  </div>
</template>

<style scoped>
.cui-dropdown {
  display: inline-flex;
}
</style>
