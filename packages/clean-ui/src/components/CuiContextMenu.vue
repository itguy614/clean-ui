<script setup lang="ts">
import { ref, provide, nextTick, onMounted, onUnmounted } from "vue";
import { DropdownContextKey, type DropdownTrigger, type DropdownPlacement } from "./dropdown-context";
import type { HideableProps, DisableableProps } from "../types/common";

/**
 * How the menu can be summoned.
 *
 * `contextmenu` is the default and the only behaviour before #60 — the native
 * event, i.e. right-click or the OS long-press callout.
 *
 * `longpress` adds a pointer hold. It is opt-in because suppressing the iOS
 * callout and native text selection has to be in place *before* the gesture
 * starts, so it is a static property of the target rather than something that
 * can be switched on mid-hold — enabling it makes the slotted content
 * unselectable by touch.
 */
export type CuiContextMenuTrigger = "contextmenu" | "longpress" | "auto";

export interface CuiContextMenuProps extends HideableProps, DisableableProps {
  /** Minimum width of the menu panel */
  minWidth?: string;
  /**
   * Which gestures open the menu. `auto` is both — the native event for mouse
   * and pen, a hold for touch.
   */
  trigger?: CuiContextMenuTrigger;
  /** How long a touch must be held before the menu opens, in ms. */
  longPressDelay?: number;
  /** Movement that cancels a hold, in px — a drag or a scroll, not a press. */
  longPressTolerance?: number;
}

const props = withDefaults(defineProps<CuiContextMenuProps>(), {
  disabled: false,
  minWidth: "12rem",
  hidden: false,
  trigger: "contextmenu",
  longPressDelay: 500,
  longPressTolerance: 10,
});

const emit = defineEmits<{
  /** The menu opened, with the viewport coordinates it was opened at. */
  open: [x: number, y: number];
  /** The menu closed. */
  close: [];
}>();

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
  emit("close");
}

function closeAll() {
  close();
}

/** Gap kept between the panel and the viewport edge. */
const VIEWPORT_PADDING = 16;
/** Tallest the panel gets before it scrolls internally, however much room there is. */
const MAX_PANEL_HEIGHT = 400;

function positionAtCursor(x: number, y: number) {
  // First pass: place the panel at the cursor with NO maxHeight, so it lays out
  // at its natural height and can be measured. It used to be clamped to the
  // space below the cursor here, which made the flip-up check downstream
  // unreachable — `rect.bottom` was at most `vh - padding` by construction, so
  // a menu opened near the bottom edge squashed into the remaining sliver and
  // scrolled instead of flipping (#95).
  //
  // Hidden rather than visible for that one frame: unconstrained, the panel can
  // hang off the bottom of the viewport, and it is the same trick CuiPopover
  // uses to avoid showing an unpositioned panel (#88).
  menuStyle.value = {
    position: "fixed",
    zIndex: "9990",
    left: `${x}px`,
    top: `${y}px`,
    visibility: "hidden",
  };

  nextTick(() => {
    if (!menuRef.value) return;

    // offsetWidth/offsetHeight, not getBoundingClientRect(): the panel animates
    // in with `transform: scale(0.95)` and a rect reports the *transformed* box,
    // so measuring mid-animation reads about 5% small. Offsets are layout
    // values and ignore the transform.
    const height = menuRef.value.offsetHeight;
    const width = menuRef.value.offsetWidth;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const roomBelow = Math.max(0, vh - y - VIEWPORT_PADDING);
    const roomAbove = Math.max(0, y - VIEWPORT_PADDING);
    const fitsBelow = Math.min(roomBelow, MAX_PANEL_HEIGHT);
    const fitsAbove = Math.min(roomAbove, MAX_PANEL_HEIGHT);

    const adjusted: Record<string, string> = {
      position: "fixed",
      zIndex: "9990",
      left: `${x}px`,
      top: `${y}px`,
    };

    if (height <= fitsBelow) {
      adjusted.maxHeight = `${fitsBelow}px`;
    } else if (height <= fitsAbove) {
      // Flip up with the panel's BOTTOM on the cursor, so the first item stays
      // next to the pointer and it still reads as the same control.
      adjusted.top = `${Math.max(VIEWPORT_PADDING, y - height)}px`;
      adjusted.maxHeight = `${fitsAbove}px`;
    } else {
      // Fits neither — scroll on the roomier side, still anchored to the cursor.
      const useAbove = roomAbove > roomBelow;
      const maxHeight = useAbove ? fitsAbove : fitsBelow;
      adjusted.top = useAbove ? `${Math.max(VIEWPORT_PADDING, y - maxHeight)}px` : `${y}px`;
      adjusted.maxHeight = `${maxHeight}px`;
    }

    // Flip left if it would overflow the right edge.
    if (x + width > vw - VIEWPORT_PADDING) {
      adjusted.left = `${Math.max(VIEWPORT_PADDING, x - width)}px`;
    }

    menuStyle.value = adjusted;

    // Focus first item
    const firstItem = menuRef.value?.querySelector<HTMLElement>(
      '[role="menuitem"]:not([aria-disabled="true"])',
    );
    firstItem?.focus();
  });
}

/**
 * Open the menu at viewport coordinates. The public entry point every trigger
 * goes through, and the one #60 asked for: a consumer driving the menu from
 * their own gesture — a kebab button, a long-press on a list row — no longer
 * has to dispatch a synthetic `contextmenu` MouseEvent at a private code path.
 */
function openAt(x: number, y: number) {
  if (props.disabled) return;
  // Re-opening while open: drop straight to closed with no exit animation, so
  // the panel doesn't animate out from the old spot while appearing at the new.
  if (isOpen.value) {
    isOpen.value = false;
    isClosing.value = false;
    if (closeAnimTimer) { clearTimeout(closeAnimTimer); closeAnimTimer = null; }
  }
  positionAtCursor(x, y);
  open();
  emit("open", x, y);
}

const respondsToContextMenu = () => props.trigger === "contextmenu" || props.trigger === "auto";
const respondsToLongPress = () => props.trigger === "longpress" || props.trigger === "auto";

function onContextMenu(e: MouseEvent) {
  if (props.disabled || !respondsToContextMenu()) return;
  // Android fires `contextmenu` after its own long-press, so with `auto` the
  // hold would open the menu and the synthesised event would immediately
  // reopen it. Swallow the event, but keep preventDefault so the OS menu
  // doesn't appear on top of ours either.
  e.preventDefault();
  if (suppressNextContextMenu) {
    suppressNextContextMenu = false;
    return;
  }
  openAt(e.clientX, e.clientY);
}

// --- Long press -----------------------------------------------------------
let longPressTimer: ReturnType<typeof setTimeout> | null = null;
let pressOrigin: { x: number; y: number } | null = null;
let suppressNextContextMenu = false;
let suppressNextClick = false;

function cancelLongPress() {
  if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
  pressOrigin = null;
}

function onPointerDown(e: PointerEvent) {
  if (props.disabled || !respondsToLongPress()) return;
  // Mouse already has `contextmenu`; holding a mouse button should not also
  // arm this, or a slow right-click would fire twice.
  if (e.pointerType === "mouse") return;

  pressOrigin = { x: e.clientX, y: e.clientY };
  longPressTimer = setTimeout(() => {
    longPressTimer = null;
    if (!pressOrigin) return;
    const { x, y } = pressOrigin;
    pressOrigin = null;
    // Both guards are for the gesture we just consumed: the platform may still
    // synthesise a `contextmenu` and a `click` from this same press.
    suppressNextContextMenu = true;
    suppressNextClick = true;
    openAt(x, y);
  }, props.longPressDelay);
}

function onPointerMove(e: PointerEvent) {
  if (!pressOrigin) return;
  const movedBy = Math.hypot(e.clientX - pressOrigin.x, e.clientY - pressOrigin.y);
  // A scroll or a drag is not a press.
  if (movedBy > props.longPressTolerance) cancelLongPress();
}

function onClickCapture(e: MouseEvent) {
  if (!suppressNextClick) return;
  suppressNextClick = false;
  // The press opened a menu; it must not also activate whatever was underneath.
  e.stopPropagation();
  e.preventDefault();
}

// --- Keyboard -------------------------------------------------------------
/**
 * Shift+F10 and the dedicated Menu key are the platform conventions for
 * summoning a context menu from the keyboard. Without them the menu is
 * unreachable without a pointer, which is the same WCAG 2.1.1 gap as the touch
 * one — the menu is positioned at the focused element rather than at a cursor,
 * as the platform does.
 */
function onKeydown(e: KeyboardEvent) {
  if (props.disabled) return;
  const isMenuKey = e.key === "ContextMenu";
  const isShiftF10 = e.key === "F10" && e.shiftKey;
  if (!isMenuKey && !isShiftF10) return;

  e.preventDefault();
  const target = (e.target as HTMLElement | null) ?? wrapperRef.value;
  const rect = target?.getBoundingClientRect();
  if (rect) openAt(rect.left, rect.bottom);
  else openAt(0, 0);
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
  // A scroll that starts under a held finger is a scroll, not a press — and
  // pointermove alone doesn't always fire once the browser takes the gesture.
  cancelLongPress();
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
  cancelLongPress();
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

defineExpose({ open, openAt, close, isOpen });
</script>

<template>
  <div
    ref="wrapperRef"
    v-show="!hidden"
    class="cui-context-menu"
    :class="{ 'cui-context-menu--longpress': respondsToLongPress() }"
    @contextmenu="onContextMenu"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="cancelLongPress"
    @pointercancel="cancelLongPress"
    @pointerleave="cancelLongPress"
    @click.capture="onClickCapture"
    @keydown="onKeydown"
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

/*
  The iOS callout and native text selection have to be suppressed BEFORE the
  gesture begins — they cannot be called off once a hold is under way — so this
  is static for as long as long-press is enabled. That is the whole reason the
  trigger is opt-in: turning it on makes the slotted content unselectable by
  touch, which is not a trade every consumer wants made for them.

  `:deep()` because the wrapper is `display: contents` and the content it
  applies to is slotted, so it carries the parent's scope id, not ours.
*/
.cui-context-menu--longpress > :deep(*) {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

.cui-context-menu__panel {
  padding: calc(0.25rem * var(--cui-density-scale, 1));
  border-radius: var(--cui-button-radius, var(--cui-radius-md, 0.375rem));
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
