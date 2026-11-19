<script setup lang="ts" generic="T">
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, useTemplateRef, watch } from "vue";
import CuiButton from "./CuiButton.vue";
import CuiIcon from "./CuiIcon.vue";
import type { CuiOrientation, DisableableProps, HideableProps } from "../types/common";
import { useCuiId } from "../composables/useCuiId";
import { useLayerStack } from "../composables/useLayerStack";
import { useMessages } from "../composables/useMessages";
import { usePointerDrag } from "../composables/usePointerDrag";
import { useRovingFocus } from "../composables/useRovingFocus";
import { useListNavigation } from "../composables/useListNavigation";
import { sortableKey, warnNoLabel } from "./sortable-list-key";
import { motionDuration, prefersReducedMotion } from "../utils/motion";
import { IconCaretDown } from "../icons/generated/caret-down";
import { IconCaretLeft } from "../icons/generated/caret-left";
import { IconCaretRight } from "../icons/generated/caret-right";
import { IconCaretUp } from "../icons/generated/caret-up";
import { IconDotsSixVertical } from "../icons/generated/dots-six-vertical";

export interface CuiSortableListProps<T = unknown> extends HideableProps, DisableableProps {
  /** The items, in order (v-model). Replaced, never mutated: a move emits the new array. */
  modelValue: T[];
  /**
   * What identifies an item across reorders: the name of its key property (default `id`; a
   * primitive item is its own key), or a function returning it. Keys must be unique and
   * stable: they keep an item's DOM, focus and state with it as it moves.
   */
  itemKey?: string | ((item: T) => string | number);
  /**
   * An item's name for assistive tech: the handle, the move buttons and every announcement.
   * Unset, an object's `label`, `name`, `title` or `text`, or the item itself if it is a string.
   */
  itemLabel?: (item: T) => string;
  /** The list's accessible name. Default `messages.sortableList.label`. */
  label?: string;
  /** The axis the items lie along, which the arrow keys follow. */
  orientation?: CuiOrientation;
  /**
   * Show Move up / Move down buttons on each item (default `true`): the single-pointer
   * alternative to dragging that WCAG 2.5.7 asks for. Turn them off only where another
   * non-drag way to reorder is offered.
   */
  moveButtons?: boolean;
  /** Items that stay put: no handle, no move buttons. They can still be passed by a neighbor's move. */
  itemDisabled?: (item: T) => boolean;
  /**
   * Show a placeholder at this index (`rows.length` for the end), the others sliding aside: how a
   * parent previews an item dragged in from elsewhere. The parent owns the drag and the drop.
   */
  insertAt?: number | null;
  /** The placeholder's size along the list, in px: the dragged item's. */
  insertSize?: number;
}

const props = withDefaults(defineProps<CuiSortableListProps<T>>(), {
  orientation: "vertical",
  moveButtons: true,
  disabled: false,
  hidden: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: T[]];
  /** An item was moved: dropped after a drag or a keyboard grab, or moved by a button. */
  reorder: [event: { item: T; from: number; to: number }];
}>();

defineSlots<{
  /** An item's content, beside the handle and the move buttons. */
  item?(props: { item: T; index: number; grabbed: boolean; dragging: boolean }): unknown;
  /** The drag handle's content (its grip icon). The button around it stays. */
  handle?(props: { item: T; index: number }): unknown;
}>();

const messages = useMessages();
const m = computed(() => messages.value.sortableList);
const helpId = useCuiId("sortable-list-help");

// ---- identity -------------------------------------------------------------------------

const keyOf = (item: T, i: number) => sortableKey(item, i, props.itemKey);

function labelOf(item: T, i: number): string {
  if (props.itemLabel) return props.itemLabel(item);
  if (item !== null && typeof item === "object") {
    for (const name of ["label", "name", "title", "text"]) {
      const v = (item as Record<string, unknown>)[name];
      if (typeof v === "string") return v;
    }
    warnNoLabel();
    return String(i + 1);
  }
  return String(item);
}

// ---- state ----------------------------------------------------------------------------

/** The order while a grab or drag is under way; the committed `modelValue` otherwise. */
const draft = shallowRef<T[] | null>(null);
const rows = computed(() => draft.value ?? props.modelValue);
/** The key of the item held by the keyboard, or the one dragged by the pointer. */
const grabbedKey = ref<string | number | null>(null);
const dragKey = ref<string | number | null>(null);
const settling = ref(false);
const activeKey = computed(() => dragKey.value ?? grabbedKey.value);
const announcement = ref("");
/** The order when the grab or drag began, which Escape restores. */
let origin: T[] = [];

const rootEl = useTemplateRef<HTMLElement>("rootRef");
const listEl = useTemplateRef<HTMLElement>("listRef");
const itemEls = new Map<string | number, HTMLElement>();
let placeholderEl: HTMLElement | null = null;
const setItemEl = (key: string | number, el: unknown) => {
  if (el instanceof HTMLElement) itemEls.set(key, el);
  else itemEls.delete(key);
};
const setPlaceholder = (el: unknown) => {
  placeholderEl = el instanceof HTMLElement ? el : null;
};

const announce = (text: string) => (announcement.value = text);
const keys = computed(() => rows.value.map(keyOf));
const positionOf = (key: string | number, list?: T[]) => (list ? list.map(keyOf) : keys.value).indexOf(key);

function commit(next: T[], item: T, from: number, to: number) {
  if (from === to) return;
  emit("update:modelValue", next);
  emit("reorder", { item, from, to });
}

// ---- focus: one tab stop on the handles ----------------------------------------------------

const activeIndex = ref(0);
const roving = useRovingFocus({
  container: listEl,
  itemSelector: ".cui-sortable-list__handle",
  orientation: () => props.orientation,
  activeIndex,
});
const nav = useListNavigation({ orientation: () => props.orientation, rtl: () => !!rootEl.value && getComputedStyle(rootEl.value).direction === "rtl" });

const handleOf = (key: string | number) => itemEls.get(key)?.querySelector<HTMLElement>(".cui-sortable-list__handle");

// ---- FLIP: the items that make room slide into place, on transform only ----------------------

const PLACEHOLDER = Symbol("placeholder");
let before = new Map<string | number | symbol, DOMRect>();
let hadFocus: HTMLElement | null = null;
/** True from before a reorder patches the DOM until focus is back: a moved node may blur. */
let reordering = false;

function measure() {
  const out = new Map<string | number | symbol, DOMRect>();
  // Not the ghost, found by its class: at the end of a drag `dragKey` is already null, and the
  // ghost is by then where it settled, not where the layout will put it.
  for (const [key, el] of itemEls) if (!el.classList.contains("cui-sortable-list__item--dragging")) out.set(key, el.getBoundingClientRect());
  if (placeholderEl) out.set(PLACEHOLDER, placeholderEl.getBoundingClientRect());
  return out;
}

watch([rows, () => props.insertAt], () => {
  reordering = true;
  before = measure();
  const active = document.activeElement;
  hadFocus = active instanceof HTMLElement && listEl.value?.contains(active) ? active : null;
}, { flush: "pre" });

watch([rows, () => props.insertAt], () => {
  // Moving a node in the DOM can drop its focus; put it back.
  if (hadFocus?.isConnected && document.activeElement !== hadFocus) hadFocus.focus({ preventScroll: true });
  hadFocus = null;
  reordering = false;
  if (prefersReducedMotion()) return;
  const after = measure();
  for (const [key, from] of before) {
    const to = after.get(key);
    const el = key === PLACEHOLDER ? placeholderEl : itemEls.get(key as string | number);
    if (!to || !el || typeof el.animate !== "function") continue;
    const dx = from.left - to.left;
    const dy = from.top - to.top;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;
    el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], {
      duration: motionDuration("base", el),
      easing: getComputedStyle(el).getPropertyValue("--cui-ease-out").trim() || "ease-out",
    });
  }
}, { flush: "post" });

// ---- finishing a grab or drag -------------------------------------------------------------

function finish(save: boolean) {
  const key = activeKey.value;
  const next = draft.value;
  if (key === null || !next) return;
  const from = positionOf(key, origin);
  const to = positionOf(key);
  const item = next[to];
  const total = next.length;
  const position = (save ? to : from) + 1;
  grabbedKey.value = null;
  dragKey.value = null;
  settling.value = false;
  draft.value = null;
  if (save) {
    commit(next, item, from, to);
    announce(m.value.dropped(labelOf(item, to), position, total));
  } else {
    announce(m.value.cancelled(labelOf(item, from), position, total));
  }
}

function cancel() {
  if (settling.value) return;
  if (dragKey.value !== null) {
    drag.end();
    session = null;
    cancelDrag();
  } else if (grabbedKey.value !== null) {
    finish(false);
  }
}

// Escape cancels a grab or drag, and only that: the shared stack hands it to the newest layer,
// so an enclosing modal stays open.
useLayerStack({ active: () => activeKey.value !== null, onEscape: cancel });

// ---- keyboard ---------------------------------------------------------------------------

function grab(item: T, i: number) {
  origin = [...rows.value];
  draft.value = [...origin];
  grabbedKey.value = keyOf(item, i);
  announce(m.value.grabbed(labelOf(item, i), i + 1, origin.length));
}

/** `list` with the item at `from` taken out and put back at `to`. */
function reordered(list: T[], from: number, to: number) {
  const next = [...list];
  next.splice(to, 0, ...next.splice(from, 1));
  return next;
}

function moveDraft(from: number, to: number) {
  const next = reordered(rows.value, from, to);
  draft.value = next;
  return next[to];
}

function onHandleKeydown(e: KeyboardEvent, item: T, i: number) {
  if (props.disabled || e.ctrlKey || e.altKey || e.metaKey || dragKey.value !== null) return;
  const key = keyOf(item, i);
  if (grabbedKey.value !== key) {
    if ((e.key === " " || e.key === "Enter") && grabbedKey.value === null && !e.repeat) {
      e.preventDefault();
      grab(item, i);
    }
    return; // Arrows, Home and End fall through to the list's roving focus.
  }
  if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    // A held key repeats: the grab's own press must not drop it again.
    if (!e.repeat) finish(true);
  } else if (e.key !== "Escape" && e.key !== "Tab") {
    const to = nav.indexForKey(e, i, { count: rows.value.length });
    if (to === null) return;
    e.preventDefault();
    if (to === i) return;
    const moved = moveDraft(i, to);
    announce(m.value.moved(labelOf(moved, to), to + 1, rows.value.length));
  }
}

/** Tabbing away from a grabbed item drops the grab: it can no longer be moved. */
function onFocusout(e: FocusEvent) {
  const key = grabbedKey.value;
  if (key === null || reordering || e.target !== handleOf(key)) return;
  // The window losing focus (alt-tab, a dialog) is not the user leaving the item.
  if (!e.relatedTarget && !document.hasFocus()) return;
  finish(false);
}

// ---- buttons ---------------------------------------------------------------------------

function moveBy(item: T, i: number, delta: 1 | -1) {
  const to = i + delta;
  const list = props.modelValue;
  if (props.disabled || to < 0 || to >= list.length) return;
  commit(reordered(list, i, to), item, i, to);
  announce(m.value.moved(labelOf(item, to), to + 1, list.length));
}

// ---- pointer drag ---------------------------------------------------------------------------

interface Session {
  key: string | number;
  x0: number;
  y0: number;
  started: boolean;
}
const drag = usePointerDrag();
let session: Session | null = null;
let pointer = { x: 0, y: 0 };
/** The dragged item's box inside the list element when the drag began, and its size. */
const box = ref({ left: 0, top: 0, width: 0, height: 0 });
/** Pixels the pointer moves before a press becomes a drag, so a click on the handle isn't one. */
const DRAG_SLOP = 4;
const horizontal = () => props.orientation === "horizontal";

function onHandlePointerdown(e: PointerEvent, item: T, i: number) {
  if (props.disabled || grabbedKey.value !== null || settling.value) return;
  const key = keyOf(item, i);
  if (!drag.start(e, onMove, onEnd)) return;
  session = { key, x0: e.clientX, y0: e.clientY, started: false };
  pointer = { x: e.clientX, y: e.clientY };
}

function beginDrag(s: Session, i: number) {
  const el = itemEls.get(s.key);
  const root = rootEl.value;
  if (!el || !root) return false;
  const r = el.getBoundingClientRect();
  const rr = root.getBoundingClientRect();
  box.value = { left: r.left - rr.left - root.clientLeft, top: r.top - rr.top - root.clientTop, width: r.width, height: r.height };
  origin = [...rows.value];
  draft.value = [...origin];
  dragKey.value = s.key;
  s.started = true;
  announce(m.value.grabbed(labelOf(origin[i], i), i + 1, origin.length));
  return true;
}

function onMove(e: PointerEvent) {
  const s = session;
  if (!s) return;
  pointer = { x: e.clientX, y: e.clientY };
  if (!s.started) {
    if (Math.hypot(pointer.x - s.x0, pointer.y - s.y0) < DRAG_SLOP) return;
    if (!beginDrag(s, positionOf(s.key))) return;
  }
  // Written straight onto the element: no render, no custom property on an ancestor.
  const el = itemEls.get(s.key);
  if (el) el.style.transform = `translate3d(${pointer.x - s.x0}px, ${pointer.y - s.y0}px, 0)`;
  void reslot();
}

const center = (el: HTMLElement) =>
  horizontal() ? el.offsetLeft + el.offsetWidth / 2 : el.offsetTop + el.offsetHeight / 2;

/**
 * Moves the placeholder one slot when the ghost's center passes a neighbor's center, then
 * looks again once the DOM has caught up, so a fast drag takes several steps. Layout offsets,
 * not rects: a neighbor mid-slide would otherwise read as being somewhere it is not.
 */
async function reslot() {
  const s = session;
  if (!s?.started || dragKey.value === null || !placeholderEl) return;
  const d = positionOf(s.key);
  const ghostCenter = (horizontal() ? box.value.left + pointer.x - s.x0 + box.value.width / 2 : box.value.top + pointer.y - s.y0 + box.value.height / 2);
  const here = center(placeholderEl);
  for (const to of [d + 1, d - 1]) {
    const neighbor = rows.value[to] !== undefined ? itemEls.get(keys.value[to]) : undefined;
    if (!neighbor) continue;
    const at = center(neighbor);
    const toward = Math.sign(at - here);
    if (toward !== 0 && (ghostCenter - at) * toward >= 0) {
      const moved = moveDraft(d, to);
      announce(m.value.moved(labelOf(moved, to), to + 1, rows.value.length));
      await nextTick();
      return reslot();
    }
  }
}

function onEnd(e: PointerEvent) {
  const s = session;
  session = null;
  if (!s?.started) return;
  if (e.type === "pointercancel") {
    cancelDrag();
  } else {
    void settle(true);
  }
}

/** Puts the placeholder back in the item's first slot, and the ghost glides home. */
function cancelDrag() {
  draft.value = [...origin];
  void settle(false);
}

/** The ghost glides into the placeholder's slot, then the order is committed (or restored). */
async function settle(save: boolean) {
  const key = dragKey.value;
  const el = key === null ? undefined : itemEls.get(key);
  settling.value = true;
  await nextTick();
  if (el && placeholderEl && !prefersReducedMotion()) {
    el.style.transform = `translate3d(${placeholderEl.offsetLeft - box.value.left}px, ${placeholderEl.offsetTop - box.value.top}px, 0)`;
    // Only wait for a transition that began: with none (display: none, no CSS) there is nothing to wait for.
    void getComputedStyle(el).transform;
    const running = typeof el.getAnimations === "function" ? el.getAnimations() : [];
    await Promise.allSettled(running.map((a) => a.finished));
  }
  if (gone) return;
  finish(save);
  // After the render has taken the settling class off, in the same frame: cleared before, it
  // would start a transition back from the slot the ghost just reached.
  await nextTick();
  if (el) el.style.transform = "";
}

/** The list is no more: a glide that ends now must not emit into the parent. */
let gone = false;

/**
 * The parent replaced the items under a grab or drag. Its list wins: the draft would commit a
 * stale copy of it (resurrecting a deleted item), so the grab or drag is dropped without a word.
 */
watch(
  () => props.modelValue,
  () => {
    if (activeKey.value === null || settling.value) return;
    drag.end();
    session = null;
    const el = dragKey.value === null ? undefined : itemEls.get(dragKey.value);
    if (el) el.style.transform = "";
    grabbedKey.value = null;
    dragKey.value = null;
    draft.value = null;
  },
);

onBeforeUnmount(() => {
  gone = true;
  drag.end();
  session = null;
  itemEls.clear();
});

// The dragged item's box, as private properties the stylesheet places the ghost and sizes the
// placeholder with (geometry from the pointer, not a themeable slot).
const insertStyle = computed(() => ({
  "--_sortable-list-box-width": `${props.insertSize ?? 0}px`,
  "--_sortable-list-box-height": `${props.insertSize ?? 0}px`,
}));

const boxStyle = computed(() => ({
  "--_sortable-list-box-left": `${box.value.left}px`,
  "--_sortable-list-box-top": `${box.value.top}px`,
  "--_sortable-list-box-width": `${box.value.width}px`,
  "--_sortable-list-box-height": `${box.value.height}px`,
}));

/** Focuses the list's tab stop: the handle of the item last focused, or the first. */
function focus() {
  const handles = listEl.value?.querySelectorAll<HTMLElement>(".cui-sortable-list__handle");
  (handles?.[Math.min(activeIndex.value, (handles?.length ?? 1) - 1)] ?? handles?.[0])?.focus();
}

function blur() {
  const active = document.activeElement;
  if (active instanceof HTMLElement && listEl.value?.contains(active)) active.blur();
}

defineExpose({ el: rootEl, focus, blur });
</script>

<template>
  <div
    v-show="!hidden"
    ref="rootRef"
    class="cui-sortable-list"
    :class="{
      'cui-sortable-list--horizontal': orientation === 'horizontal',
      'cui-sortable-list--dragging': dragKey !== null,
      'cui-sortable-list--disabled': disabled,
    }"
  >
    <ul
      ref="listRef"
      class="cui-sortable-list__list"
      role="list"
      :aria-label="label ?? m.label"
      @keydown="roving.onKeydown"
      @focusin="roving.onFocusin"
      @focusout="onFocusout"
    >
      <template v-for="(item, i) in rows" :key="keys[i]">
        <li v-if="insertAt === i" class="cui-sortable-list__placeholder" aria-hidden="true" :style="insertStyle" />
        <li
          v-if="dragKey === keys[i]"
          :ref="setPlaceholder"
          class="cui-sortable-list__placeholder"
          aria-hidden="true"
          :style="boxStyle"
        />
        <li
          :ref="(el) => setItemEl(keys[i], el)"
          class="cui-sortable-list__item"
          :class="{
            'cui-sortable-list__item--grabbed': grabbedKey === keys[i],
            'cui-sortable-list__item--dragging': dragKey === keys[i],
            'cui-sortable-list__item--settling': settling && dragKey === keys[i],
          }"
          :style="dragKey === keys[i] ? boxStyle : undefined"
        >
          <button
            type="button"
            class="cui-sortable-list__handle"
            :tabindex="roving.tabIndex(i)"
            :disabled="disabled || itemDisabled?.(item)"
            :aria-label="m.handle(labelOf(item, i))"
            :aria-pressed="grabbedKey === keys[i]"
            :aria-describedby="helpId"
            @keydown="onHandleKeydown($event, item, i)"
            @pointerdown="onHandlePointerdown($event, item, i)"
          >
            <slot name="handle" :item="item" :index="i">
              <CuiIcon :icon="IconDotsSixVertical" />
            </slot>
          </button>
          <div class="cui-sortable-list__content">
            <slot
              name="item"
              :item="item"
              :index="i"
              :grabbed="grabbedKey === keys[i]"
              :dragging="dragKey === keys[i]"
            >
              {{ labelOf(item, i) }}
            </slot>
          </div>
          <div v-if="moveButtons" class="cui-sortable-list__actions">
            <CuiButton
              icon
              size="xs"
              variant="ghost"
              color="surface"
              tabindex="-1"
              focusable-when-disabled
              :disabled="disabled || i === 0 || itemDisabled?.(item)"
              :aria-label="horizontal() ? m.moveStart(labelOf(item, i)) : m.moveUp(labelOf(item, i))"
              @click="moveBy(item, i, -1)"
            >
              <CuiIcon :icon="horizontal() ? IconCaretLeft : IconCaretUp" />
            </CuiButton>
            <CuiButton
              icon
              size="xs"
              variant="ghost"
              color="surface"
              tabindex="-1"
              focusable-when-disabled
              :disabled="disabled || i === rows.length - 1 || itemDisabled?.(item)"
              :aria-label="horizontal() ? m.moveEnd(labelOf(item, i)) : m.moveDown(labelOf(item, i))"
              @click="moveBy(item, i, 1)"
            >
              <CuiIcon :icon="horizontal() ? IconCaretRight : IconCaretDown" />
            </CuiButton>
          </div>
        </li>
      </template>
      <li v-if="insertAt != null && insertAt >= rows.length" class="cui-sortable-list__placeholder" aria-hidden="true" :style="insertStyle" />
    </ul>
    <span :id="helpId" class="cui-sr-only">{{ m.instructions }}</span>
    <div class="cui-sr-only" role="status" aria-live="polite" aria-atomic="true">{{ announcement }}</div>
  </div>
</template>

<style scoped>
/* --- Themeable: zero specificity, so a consumer's own rule wins (see CuiButton.vue) --- */
:where(.cui-sortable-list__list) {
  gap: var(--cui-sortable-list-gap, calc(0.5rem * var(--cui-density-scale, 1)));
}

:where(.cui-sortable-list__item) {
  gap: calc(0.5rem * var(--cui-density-scale, 1));
  padding: var(--cui-sortable-list-py, calc(0.5rem * var(--cui-density-scale, 1)))
    var(--cui-sortable-list-px, calc(0.5rem * var(--cui-density-scale, 1)));
  background: var(--cui-sortable-list-bg, var(--cui-surface-base));
  border: var(--cui-sortable-list-border, 1px solid var(--cui-border));
  border-radius: var(--cui-sortable-list-radius, var(--cui-radius-md, 0.375rem));
  color: var(--cui-sortable-list-color, var(--cui-text-body));
  font-size: var(--cui-sortable-list-font-size, inherit);
}

/* A grabbed item reads as pressed: the tinted fill and edge, never a solid hero fill. */
:where(.cui-sortable-list__item--grabbed) {
  background: var(--cui-sortable-list-pressed-bg, var(--cui-primary-bg));
  border: var(--cui-sortable-list-pressed-border, 1px solid var(--cui-primary-border));
}

:where(.cui-sortable-list__handle:focus-visible) {
  outline: 2px solid var(--cui-sortable-list-focus-ring, var(--cui-primary-focus-ring));
  outline-offset: 2px;
}

/* The dragged item floats: tilted, lifted and a little see-through, over a placeholder that
   holds its slot. Rotation, scale and opacity are motion-like tokens (like --cui-press-scale),
   not paint: set one to its neutral value (0deg, 1, 1) to drop that part of the lift. */
:where(.cui-sortable-list__item--dragging) {
  rotate: var(--cui-sortable-list-drag-rotate, 2deg);
  scale: var(--cui-sortable-list-drag-scale, 1.02);
  opacity: var(--cui-sortable-list-drag-opacity, 0.9);
}

/* --- Structural --- */
.cui-sortable-list {
  position: relative;
}

.cui-sortable-list__list {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
}

.cui-sortable-list--horizontal > .cui-sortable-list__list {
  flex-direction: row;
}

.cui-sortable-list__item {
  display: flex;
  align-items: center;
  min-width: 0;
  margin: 0;
}

.cui-sortable-list--horizontal .cui-sortable-list__item {
  flex: none;
}

.cui-sortable-list__content {
  flex: 1;
  min-width: 0;
}

.cui-sortable-list__actions {
  display: flex;
  flex: none;
  align-items: center;
}

.cui-sortable-list--horizontal .cui-sortable-list__actions {
  flex-direction: row;
}

.cui-sortable-list__handle {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: var(--cui-radius-sm, 0.25rem);
  background: none;
  color: var(--cui-text-secondary);
  cursor: grab;
  /* The pointer, not the browser, owns a drag that starts here: no panning, no selection. */
  touch-action: none;
  user-select: none;
}

.cui-sortable-list__handle:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.cui-sortable-list--dragging,
.cui-sortable-list--dragging * {
  cursor: grabbing;
  user-select: none;
}

/* The dragged item leaves the flow, still in its row of the list; the transform that follows
   the pointer is written onto it directly. */
.cui-sortable-list__item--dragging {
  position: absolute;
  inset: var(--_sortable-list-box-top) auto auto var(--_sortable-list-box-left);
  width: var(--_sortable-list-box-width);
  height: var(--_sortable-list-box-height);
  z-index: 1;
  box-sizing: border-box;
  box-shadow: var(--cui-shadow-md);
  pointer-events: none;
  /* The lift eases in; following the pointer (transform) never does. */
  transition: rotate var(--cui-duration-fast) var(--cui-ease-out), scale var(--cui-duration-fast) var(--cui-ease-out);
}

.cui-sortable-list__item--settling {
  transition:
    transform var(--cui-duration-fast) var(--cui-ease-out),
    rotate var(--cui-duration-fast) var(--cui-ease-out),
    scale var(--cui-duration-fast) var(--cui-ease-out),
    opacity var(--cui-duration-fast) var(--cui-ease-out);
  rotate: 0deg;
  scale: 1;
  opacity: 1;
}

.cui-sortable-list__placeholder {
  flex: none;
  box-sizing: border-box;
  margin: 0;
  border: 1px dashed var(--cui-border);
  border-radius: var(--cui-sortable-list-radius, var(--cui-radius-md, 0.375rem));
  background: var(--cui-surface-bg);
  opacity: 0.6;
}

/* It takes the dragged item's size along the list; across it, the list's own. */
.cui-sortable-list__placeholder {
  height: var(--_sortable-list-box-height);
}

.cui-sortable-list--horizontal .cui-sortable-list__placeholder {
  width: var(--_sortable-list-box-width);
  height: auto;
  align-self: stretch;
}

/* Reduced motion removes the lift: no tilt, no scale; the dragged item still follows the
   pointer (that is direct manipulation) and stays a little see-through. */
@media (prefers-reduced-motion: reduce) {
  .cui-sortable-list__item--dragging,
  .cui-sortable-list__item--settling {
    rotate: none;
    scale: none;
  }
}
</style>
