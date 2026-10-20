<script setup lang="ts">
import { ref, provide, toRef, onUnmounted } from "vue";
import { useClickOutside } from "../composables/useClickOutside";
import { useEventListener } from "../composables/useEventListener";
import { useLayerStack } from "../composables/useLayerStack";
import { DropdownContextKey, type DropdownTrigger, type DropdownPlacement } from "./dropdown-context";
import type { HideableProps, DisableableProps } from "../types/common";

export interface CuiDropdownProps extends HideableProps, DisableableProps {
  /** How the dropdown is triggered */
  trigger?: DropdownTrigger;
  /** Preferred placement */
  placement?: DropdownPlacement;
  /** Keep dropdown anchored to trigger on scroll instead of closing */
  pinned?: boolean;
}

const props = withDefaults(defineProps<CuiDropdownProps>(), {
  trigger: "click",
  placement: "bottom",
  pinned: false,
  disabled: false,
  hidden: false,
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

// Escape through the shared layer stack (#278): the menu is teleported to <body>, so a
// wrapper keydown never saw an Escape pressed on a menu item, and an enclosing modal
// closed instead. Focus handling on close is #160.
useLayerStack({ active: () => isOpen.value && !isClosing.value, onEscape: close });

const dropdownId = `cui-dd-${Math.random().toString(36).slice(2, 8)}`;

// Only while open, so a closed dropdown holds no document listener (#203). Inside means
// the wrapper, the teleported menu it owns, and any open sub-menu panel: those exist only
// while a menu is open, and opening another dropdown closes this one.
const wrapperRef = ref<HTMLElement | null>(null);
useClickOutside(
  () => [
    wrapperRef.value,
    ...document.querySelectorAll<HTMLElement>(`[data-cui-dropdown-owner="${dropdownId}"], .cui-dropdown-sub__menu`),
  ],
  close,
  { enabled: isOpen },
);

function reposition() {
  // Menu handles its own repositioning via scroll listener
}

// A scroll closes an unpinned dropdown; a pinned one's menu repositions itself instead.
useEventListener("window", "scroll", close, { enabled: () => isOpen.value && !props.pinned, capture: true });

onUnmounted(() => {
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
    ref="wrapperRef"
    v-show="!hidden"
    class="cui-dropdown"
    :data-cui-dropdown-id="dropdownId"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
  >
    <slot :is-open="isOpen" :toggle="toggle" :open="open" :close="close" />
  </div>
</template>

<style scoped>
.cui-dropdown {
  display: inline-flex;
}
</style>
