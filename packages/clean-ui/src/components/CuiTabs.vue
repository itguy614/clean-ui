<script setup lang="ts">
import { ref, toRef, computed, nextTick, onMounted, onBeforeUnmount, watch } from "vue";
import CuiIcon from "./CuiIcon.vue";
import {
  useTabsProvider,
  type TabDefinition,
  type TabVariant,
  type TabOrientation,
  type TabTransition,
} from "./tabs-context";
import type { HideableProps, ColorableProps } from "../types/common";
import { useMessages } from "../composables/useMessages";
import { useCuiId } from "../composables/useCuiId";
import { scrollIntoViewWithin } from "../utils/scroll";

export interface CuiTabsProps extends HideableProps, ColorableProps {
  /** Active tab value */
  modelValue?: string;
  /** Tab bar style */
  variant?: TabVariant;
  /** Layout orientation */
  orientation?: TabOrientation;
  /** Keep inactive tab panels in DOM */
  keepAlive?: boolean;
  /** Panel transition animation */
  transition?: TabTransition;
}

const props = withDefaults(defineProps<CuiTabsProps>(), {
  variant: "underline",
  orientation: "horizontal",
  color: "primary",
  keepAlive: true,
  transition: "fade",
  hidden: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
  close: [value: string];
}>();

const activeTab = ref(props.modelValue ?? "");
const previousTab = ref("");
const tabs = ref<TabDefinition[]>([]);
const barRef = ref<HTMLElement | null>(null);

// Sync external v-model
watch(
  () => props.modelValue,
  (val) => {
    if (val !== undefined && val !== activeTab.value) {
      previousTab.value = activeTab.value;
      activeTab.value = val;
    }
  },
);

function register(tab: TabDefinition) {
  const idx = tabs.value.findIndex((t) => t.value === tab.value);
  if (idx >= 0) {
    // Update in place — re-pushing would jump the tab to the end of the bar
    // whenever one of its props changed.
    tabs.value[idx] = tab;
  } else {
    tabs.value.push(tab);
  }
  // Auto-activate first tab
  if (!activeTab.value && !tab.disabled) {
    activeTab.value = tab.value;
    emit("update:modelValue", tab.value);
  }
}

function unregister(value: string) {
  tabs.value = tabs.value.filter((t) => t.value !== value);
}

function activate(value: string) {
  const tab = tabs.value.find((t) => t.value === value);
  if (tab?.disabled) return;
  previousTab.value = activeTab.value;
  activeTab.value = value;
  emit("update:modelValue", value);
}

function close(value: string) {
  emit("close", value);
}

// Per tab set; the value is encoded, since an id reference can't hold whitespace (#271).
// Every character outside [A-Za-z0-9-] becomes _<hex>_ — a code unit, so a lone surrogate
// encodes too (encodeURIComponent throws on one, mid-render).
const tabsId = useCuiId("tabs");
const encodeValue = (value: string) => value.replace(/[^A-Za-z0-9-]/g, (c) => `_${c.charCodeAt(0).toString(16)}_`);
const tabId = (value: string) => `${tabsId}-tab-${encodeValue(value)}`;
const panelId = (value: string) => `${tabsId}-panel-${encodeValue(value)}`;

// From the registered tab order — the panels read it through the context.
const slideDirection = computed<"left" | "right">(() => {
  const prevIdx = tabs.value.findIndex((t) => t.value === previousTab.value);
  const currIdx = tabs.value.findIndex((t) => t.value === activeTab.value);
  return currIdx >= prevIdx ? "left" : "right";
});

useTabsProvider({
  activeTab,
  variant: toRef(props, "variant"),
  orientation: toRef(props, "orientation"),
  color: toRef(props, "color"),
  keepAlive: toRef(props, "keepAlive"),
  transition: toRef(props, "transition"),
  previousTab,
  register,
  unregister,
  activate,
  close,
  tabId,
  panelId,
  slideDirection,
});

// Keyboard navigation
function onKeydown(e: KeyboardEvent) {
  const enabledTabs = tabs.value.filter((t) => !t.disabled);
  const currentIdx = enabledTabs.findIndex((t) => t.value === activeTab.value);
  if (currentIdx < 0) return;

  const isHorizontal = props.orientation === "horizontal";
  const nextKey = isHorizontal ? "ArrowRight" : "ArrowDown";
  const prevKey = isHorizontal ? "ArrowLeft" : "ArrowUp";

  let nextIdx = -1;

  if (e.key === nextKey) {
    e.preventDefault();
    nextIdx = currentIdx < enabledTabs.length - 1 ? currentIdx + 1 : 0;
  } else if (e.key === prevKey) {
    e.preventDefault();
    nextIdx = currentIdx > 0 ? currentIdx - 1 : enabledTabs.length - 1;
  } else if (e.key === "Home") {
    e.preventDefault();
    nextIdx = 0;
  } else if (e.key === "End") {
    e.preventDefault();
    nextIdx = enabledTabs.length - 1;
  }

  if (nextIdx >= 0) {
    const target = enabledTabs[nextIdx].value;
    const changed = target !== activeTab.value;
    activate(target);
    nextTick(() => {
      // focus() would do its own instant scroll-into-view, interrupting the
      // activeTab watcher's smooth one mid-animation and stopping with the tab
      // half clipped (#235). So focus without scrolling, and leave the scroll
      // to the watcher — which only fires on a change, so an already-active
      // tab (Home on the first, End on the last) scrolls here instead.
      tabElement(target)?.focus({ preventScroll: true });
      if (!changed) scrollActiveIntoView();
    });
  }
}

// --- Overflow scrolling ---
// The bar scrolls when the tabs don't fit; without this the trailing tabs are
// clipped by any `overflow: hidden` ancestor (Modal/Slideover) and unreachable.

/**
 * Within this set's own bar, by its id: a document-wide lookup can't see into a shadow root,
 * and could find another app's tab with the same id.
 */
function tabElement(value: string): HTMLElement | null {
  const id = tabId(value);
  return [...(barRef.value?.children ?? [])].find((el): el is HTMLElement => el.id === id) ?? null;
}

/** Which edges have content scrolled out of view — drives the edge fade mask. */
const overflowEdges = ref<"none" | "start" | "end" | "both">("none");

function updateOverflow() {
  const el = barRef.value;
  if (!el) return;
  const horizontal = props.orientation === "horizontal";
  const viewport = horizontal ? el.clientWidth : el.clientHeight;
  const content = horizontal ? el.scrollWidth : el.scrollHeight;
  // Math.abs: RTL scrollLeft is negative in some engines
  const pos = Math.abs(horizontal ? el.scrollLeft : el.scrollTop);

  // 1px tolerance absorbs sub-pixel layout rounding
  if (content - viewport <= 1) {
    overflowEdges.value = "none";
    return;
  }
  const atStart = pos <= 1;
  const atEnd = pos >= content - viewport - 1;
  overflowEdges.value = atStart ? "end" : atEnd ? "start" : "both";
}

// The one way the bar brings the active tab into view — keyboard nav, v-model
// changes and mount all land here. The bar's scroll-padding keeps the tab clear
// of the edge fade rather than flush under it. The bar only: scrollIntoView would
// scroll the page to a tab bar below the fold too (#243).
function scrollActiveIntoView() {
  const tab = tabElement(activeTab.value);
  if (tab && barRef.value) scrollIntoViewWithin(barRef.value, tab);
}

let resizeObserver: ResizeObserver | undefined;

onMounted(() => {
  nextTick(() => {
    scrollActiveIntoView();
    updateOverflow();
  });
  if (typeof ResizeObserver !== "undefined" && barRef.value) {
    resizeObserver = new ResizeObserver(updateOverflow);
    resizeObserver.observe(barRef.value);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = undefined;
});

watch(activeTab, () => {
  scrollActiveIntoView();
  updateOverflow();
}, { flush: "post" });

// Tabs registering/unregistering changes the scrollable width
watch(() => tabs.value.length, updateOverflow, { flush: "post" });
watch(() => props.orientation, updateOverflow, { flush: "post" });

// Slide direction

const messages = useMessages();
</script>

<template>
  <div
    v-show="!hidden"
    class="cui-tabs"
    :class="[
      `cui-tabs--${variant}`,
      `cui-tabs--${orientation}`,
    ]"
  >
    <!-- Tab bar -->
    <div class="cui-tabs__bar-outer">
      <div
        ref="barRef"
        class="cui-tabs__bar"
        role="tablist"
        :aria-orientation="orientation"
        :data-overflow="overflowEdges"
        @keydown="onKeydown"
        @scroll="updateOverflow"
      >
        <button
          v-for="tab in tabs"
          :key="tab.value"
          type="button"
          :data-cui-tab-value="tab.value"
          class="cui-tabs__tab"
          :class="{
            'cui-tabs__tab--active': activeTab === tab.value,
            'cui-tabs__tab--disabled': tab.disabled,
          }"
          :style="{
            '--_tab-color': `var(--cui-${color})`,
            '--_tab-hover': `var(--cui-${color}-hover)`,
            '--_tab-bg': `var(--cui-${color}-bg)`,
          }"
          role="tab"
          :id="tabId(tab.value)"
          :aria-controls="keepAlive || activeTab === tab.value ? panelId(tab.value) : undefined"
          :aria-selected="activeTab === tab.value"
          :aria-disabled="tab.disabled || undefined"
          :tabindex="activeTab === tab.value ? 0 : -1"
          @click="activate(tab.value)"
        >
          <span class="cui-tabs__tab-content">
            <component :is="tab.labelSlot" v-if="tab.labelSlot" />
            <template v-else>{{ tab.label }}</template>
          </span>
          <button
            v-if="tab.closeable"
            type="button"
            class="cui-tabs__tab-close"
            :aria-label="messages.tabs.closeTab"
            tabindex="-1"
            @click.stop="close(tab.value)"
          >
            <CuiIcon name="x" size="0.75rem" />
          </button>
        </button>
      </div>
    </div>

    <!-- Panels -->
    <div class="cui-tabs__panels">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.cui-tabs {
  display: flex;
  /* allow shrinking inside a flex parent instead of forcing overflow */
  min-width: 0;
}

.cui-tabs--horizontal {
  flex-direction: column;
}

.cui-tabs--vertical {
  flex-direction: row;
  gap: calc(1rem * var(--cui-density-scale, 1));
}

/* --- Tab bar ---
   Two elements on purpose: the outer holds the static chrome (underline border,
   segmented track) while the inner is the scroll viewport, so the chrome neither
   scrolls away nor gets caught by the inner's edge-fade mask. */
.cui-tabs__bar-outer {
  display: flex;
  flex-shrink: 0;
  min-width: 0;
}

.cui-tabs__bar {
  /* Width of the edge fade, and the scroll padding that keeps a tab clear of it. */
  --_tab-fade-size: 1.5rem;
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 0;
  scroll-behavior: smooth;
  /* Native bar is hidden — the edge fade is the overflow affordance. Consumers
     wanting a visible one can add `.cui-scrollbar` and override these. */
  scrollbar-width: none;
  -webkit-mask-image: var(--_tab-fade, none);
  mask-image: var(--_tab-fade, none);
}

.cui-tabs__bar::-webkit-scrollbar {
  display: none;
}

@media (prefers-reduced-motion: reduce) {
  .cui-tabs__bar {
    scroll-behavior: auto;
  }
}

.cui-tabs--horizontal .cui-tabs__bar {
  flex-direction: row;
  gap: 0;
  overflow-x: auto;
  overflow-y: hidden;
  /* So a tab scrolled into view clears the fade instead of landing under it. */
  scroll-padding-inline: var(--_tab-fade-size);
}

.cui-tabs--vertical .cui-tabs__bar-outer {
  min-width: 10rem;
  min-height: 0;
}

.cui-tabs--vertical .cui-tabs__bar {
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-padding-block: var(--_tab-fade-size);
}

/* Edge fade — set by the `data-overflow` state, which tracks scroll position */
.cui-tabs--horizontal .cui-tabs__bar[data-overflow="end"] {
  --_tab-fade: linear-gradient(to right, #000 calc(100% - var(--_tab-fade-size)), transparent 100%);
}

.cui-tabs--horizontal .cui-tabs__bar[data-overflow="start"] {
  --_tab-fade: linear-gradient(to left, #000 calc(100% - var(--_tab-fade-size)), transparent 100%);
}

.cui-tabs--horizontal .cui-tabs__bar[data-overflow="both"] {
  --_tab-fade: linear-gradient(
    to right,
    transparent 0,
    #000 var(--_tab-fade-size),
    #000 calc(100% - var(--_tab-fade-size)),
    transparent 100%
  );
}

.cui-tabs--vertical .cui-tabs__bar[data-overflow="end"] {
  --_tab-fade: linear-gradient(to bottom, #000 calc(100% - var(--_tab-fade-size)), transparent 100%);
}

.cui-tabs--vertical .cui-tabs__bar[data-overflow="start"] {
  --_tab-fade: linear-gradient(to top, #000 calc(100% - var(--_tab-fade-size)), transparent 100%);
}

.cui-tabs--vertical .cui-tabs__bar[data-overflow="both"] {
  --_tab-fade: linear-gradient(
    to bottom,
    transparent 0,
    #000 var(--_tab-fade-size),
    #000 calc(100% - var(--_tab-fade-size)),
    transparent 100%
  );
}

/* Underline variant */
.cui-tabs--underline.cui-tabs--horizontal .cui-tabs__bar-outer {
  border-bottom: 1px solid var(--cui-border);
}

.cui-tabs--underline.cui-tabs--vertical .cui-tabs__bar-outer {
  border-right: 1px solid var(--cui-border);
}

/* Segmented variant — track lives on the outer; the 0.25rem inset is split
   across both so the active pill's drop shadow isn't clipped by the scroller. */
.cui-tabs--segmented .cui-tabs__bar-outer {
  background: var(--cui-surface-bg);
  border-radius: var(--cui-button-radius, var(--cui-radius-md, 0.375rem));
  padding: calc(0.125rem * var(--cui-density-scale, 1));
}

.cui-tabs--segmented .cui-tabs__bar {
  padding: calc(0.125rem * var(--cui-density-scale, 1));
  gap: calc(0.25rem * var(--cui-density-scale, 1));
}

/* --- Tab button --- */
.cui-tabs__tab {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: calc(0.375rem * var(--cui-density-scale, 1));
  padding: calc(0.625rem * var(--cui-density-scale, 1)) calc(1rem * var(--cui-density-scale, 1));
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--cui-text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  position: relative;
}

.cui-tabs__tab:hover:not(.cui-tabs__tab--disabled) {
  color: var(--cui-text-body);
}

.cui-tabs__tab--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.cui-tabs__tab:focus-visible {
  outline: 2px solid var(--_tab-color);
  outline-offset: -2px;
  border-radius: 0.25rem;
}

/* --- Underline active --- */
.cui-tabs--underline .cui-tabs__tab--active {
  color: var(--_tab-color);
}

.cui-tabs--underline.cui-tabs--horizontal .cui-tabs__tab--active {
  box-shadow: inset 0 -2px 0 0 var(--_tab-color);
}

.cui-tabs--underline.cui-tabs--vertical .cui-tabs__tab--active {
  box-shadow: inset -2px 0 0 0 var(--_tab-color);
}

/* --- Segmented active --- */
.cui-tabs--segmented .cui-tabs__tab {
  border-radius: calc(var(--cui-button-radius, var(--cui-radius-md, 0.375rem)) - 0.125rem);
}

.cui-tabs--segmented .cui-tabs__tab--active {
  background: var(--cui-surface-base);
  color: var(--_tab-color);
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.08);
}

/* --- Tab close button --- */
.cui-tabs__tab-close {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--cui-text-tertiary);
  padding: calc(0.125rem * var(--cui-density-scale, 1));
  border-radius: 0.25rem;
  margin: calc(-0.125rem * var(--cui-density-scale, 1)) calc(-0.25rem * var(--cui-density-scale, 1)) calc(-0.125rem * var(--cui-density-scale, 1)) 0;
  transition: color 0.15s ease, background 0.15s ease;
}

.cui-tabs__tab-close:hover {
  color: var(--cui-text-body);
  background: var(--cui-surface-dark-bg);
}

.cui-tabs__tab-content {
  display: flex;
  align-items: center;
  gap: calc(0.375rem * var(--cui-density-scale, 1));
}

/* --- Panels --- */
.cui-tabs__panels {
  flex: 1;
  min-width: 0;
  min-height: 0;
}

.cui-tabs--vertical .cui-tabs__panels {
  padding-left: 0;
}
</style>
