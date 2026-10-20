<script setup lang="ts">
import { ref, shallowRef, provide, toRef, onUnmounted } from "vue";
import { useCuiId } from "../composables/useCuiId";
import { useClickOutside } from "../composables/useClickOutside";
import { useEventListener } from "../composables/useEventListener";
import { useLayerStack } from "../composables/useLayerStack";
import { inMenuPanels, menuPanels, restoreMenuFocus, type MenuEdge } from "../utils/menu";
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
const focusRequest = shallowRef<{ edge: MenuEdge } | null>(null);
let showTimer: ReturnType<typeof setTimeout> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;
let closeAnimTimer: ReturnType<typeof setTimeout> | null = null;

// Focus moves in when the menu actually opens, or when asked for an edge explicitly (Arrow
// Up/Down on the trigger) — not on a hover or focus re-entering an open menu, which would
// pull a keyboard user back to the first item. `edge` is checked rather than trusted: open
// is also a slot prop and an exposed method, and `@click="open"` hands it a MouseEvent.
function open(edge?: MenuEdge) {
  if (props.disabled) return;
  if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
  if (closeAnimTimer) { clearTimeout(closeAnimTimer); closeAnimTimer = null; }
  const explicit = edge === "first" || edge === "last";
  const opening = !isOpen.value || isClosing.value;
  isClosing.value = false;
  isOpen.value = true;
  if (opening || explicit) focusRequest.value = { edge: edge === "last" ? "last" : "first" };
}

/** Where focus goes back to on close: the trigger's own focusable element (#160). */
function triggerTarget() {
  const wrap = triggerEl.value;
  return wrap?.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? wrap?.firstElementChild;
}

function close() {
  if (showTimer) { clearTimeout(showTimer); showTimer = null; }
  if (!isOpen.value || isClosing.value) return;
  // Before the menu starts animating out: it is still in the DOM, and still holds focus
  // after Escape or a chosen item.
  restoreMenuFocus(triggerTarget(), dropdownId);
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

function onFocusIn(e: FocusEvent) {
  // Focus coming back from this dropdown's own menu (a close handing it to the trigger,
  // Shift+Tab) is not a fresh focus-in.
  if (props.trigger === "hover-focus" && !inMenuPanels(dropdownId, e.relatedTarget as Node | null)) open();
}

function onFocusOut(e: FocusEvent) {
  if (props.trigger === "hover-focus") {
    const related = e.relatedTarget as Node | null;
    const el = (e.currentTarget as HTMLElement);
    // Focus moving into the teleported menu, which open() itself does, is still inside.
    if (related && (el.contains(related) || inMenuPanels(dropdownId, related))) return;
    hideTimer = setTimeout(close, 150);
  }
}

// Escape through the shared layer stack (#278): the menu is teleported to <body>, so a
// wrapper keydown never saw an Escape pressed on a menu item, and an enclosing modal
// closed instead.
useLayerStack({ active: () => isOpen.value && !isClosing.value, onEscape: close });

const dropdownId = useCuiId("dropdown");

// Only while open, so a closed dropdown holds no document listener (#203). Inside means
// the wrapper and the teleported panels it owns: the menu and any open sub-menu.
const wrapperRef = ref<HTMLElement | null>(null);
useClickOutside(
  () => [wrapperRef.value, ...menuPanels(dropdownId)],
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
  ownerId: dropdownId,
  focusRequest,
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
