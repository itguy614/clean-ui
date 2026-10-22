<script setup lang="ts">
import { ref, toRef, computed, nextTick, onMounted, watch } from "vue";
import CuiIcon from "./CuiIcon.vue";
import CuiScrollArea from "./CuiScrollArea.vue";
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
import { useListNavigation } from "../composables/useListNavigation";

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
  /**
   * Buttons at the ends of an overflowing bar that scroll it, for a mouse with no
   * horizontal wheel (#236). `auto` shows one on each side with more tabs; `always` shows
   * both whenever there's room for them, the spent one disabled; `never` leaves only the
   * edge fade. Pointer affordances only: the keyboard has the tablist's arrow keys.
   */
  scrollButtons?: "auto" | "always" | "never";
}

const props = withDefaults(defineProps<CuiTabsProps>(), {
  variant: "underline",
  orientation: "horizontal",
  color: "primary",
  keepAlive: true,
  transition: "fade",
  scrollButtons: "auto",
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
// The last switch came from the keyboard (#269): no panel transition, and the bar scrolls
// at once. A click or a v-model change animates as before. Changed only by a switch: on the
// panel already showing, a change would add the animation class and replay it.
const keyed = ref(false);
// The tab buttons' own colour and underline, which a pointer back over the bar fades again.
const keyedButtons = ref(false);

/** A click that switches tabs animates; one on the active or a disabled tab changes nothing. */
function onTabClick(tab: TabDefinition) {
  if (tab.disabled || tab.value === activeTab.value) return;
  keyed.value = keyedButtons.value = false;
  activate(tab.value);
}
const areaRef = ref<InstanceType<typeof CuiScrollArea> | null>(null);

// Sync external v-model
watch(
  () => props.modelValue,
  (val) => {
    if (val !== undefined && val !== activeTab.value) {
      // A change from outside, not the echo of our own switch (that equals activeTab).
      keyed.value = false;
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
  keyed,
});

// Keyboard navigation: the shared index maths (#289), wrapping at the ends as tabs always
// have. In a right-to-left page ArrowLeft goes on to the next tab, the way the bar reads.
const nav = useListNavigation({
  wrap: () => true,
  orientation: () => props.orientation,
  rtl: () => !!barRef.value && getComputedStyle(barRef.value).direction === "rtl",
});

function onKeydown(e: KeyboardEvent) {
  const list = tabs.value;
  const from = list.findIndex((t) => t.value === activeTab.value);
  if (from < 0) return;
  const to = nav.indexForKey(e, from, { count: list.length, isDisabled: (i) => !!list[i].disabled });
  // -1: Home or End with every tab disabled.
  if (to === null || to < 0) return;
  e.preventDefault();
  const target = list[to].value;
  const changed = target !== activeTab.value;
  keyed.value = keyedButtons.value = true;
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

// --- Overflow scrolling ---
// The bar scrolls when the tabs don't fit; without this the trailing tabs are
// clipped by any `overflow: hidden` ancestor (Modal/Slideover) and unreachable.
// CuiScrollArea (#143) is the scroller: its edge fades, its scroll buttons (#236) and
// the scroll padding that keeps a tab clear of both. The tablist is a row inside it.

/**
 * Within this set's own bar, by its id: a document-wide lookup can't see into a shadow root,
 * and could find another app's tab with the same id.
 */
function tabElement(value: string): HTMLElement | null {
  const id = tabId(value);
  return [...(barRef.value?.children ?? [])].find((el): el is HTMLElement => el.id === id) ?? null;
}

// The one way the bar brings the active tab into view — keyboard nav, v-model
// changes and mount all land here. The scroll padding keeps the tab clear of the
// edge fade and the scroll buttons rather than under them. The bar only:
// scrollIntoView would scroll the page to a tab bar below the fold too (#243).
function scrollActiveIntoView() {
  const tab = tabElement(activeTab.value);
  const scroller = areaRef.value?.el;
  if (tab && scroller) scrollIntoViewWithin(scroller, tab, keyed.value ? "instant" : undefined);
}

onMounted(() => nextTick(scrollActiveIntoView));

watch(activeTab, scrollActiveIntoView, { flush: "post" });


const messages = useMessages();
</script>

<template>
  <div
    v-show="!hidden"
    class="cui-tabs"
    :data-keyed="keyedButtons || undefined"
    :class="[
      `cui-tabs--${variant}`,
      `cui-tabs--${orientation}`,
    ]"
  >
    <!-- Tab bar -->
    <div class="cui-tabs__bar-outer">
      <CuiScrollArea
        ref="areaRef"
        class="cui-tabs__scroll"
        :orientation="orientation"
        :region="false"
        :indicator="scrollButtons === 'never' ? 'none' : 'button'"
        :indicator-visibility="scrollButtons === 'always' ? 'always' : 'auto'"
      >
      <div
        ref="barRef"
        class="cui-tabs__bar"
        role="tablist"
        :aria-orientation="orientation"
        @keydown="onKeydown"
        @pointermove="keyedButtons = false"
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
          @click="onTabClick(tab)"
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
      </CuiScrollArea>
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
   The outer holds the static chrome (underline border, segmented track); the scroll
   viewport is CuiScrollArea's scroller inside it, so the chrome neither scrolls away nor
   gets caught by the scroller's edge-fade mask. */
.cui-tabs__bar-outer {
  display: flex;
  flex-shrink: 0;
  min-width: 0;
}

/* The scroll area fills the outer's track; the tablist is a row (or column) inside its
   scroller, at least as long as the track and growing past it when the tabs don't fit. */
.cui-tabs__scroll {
  flex: 1 1 auto;
}

.cui-tabs__scroll > :deep(.cui-scroll-area__scroller) {
  scroll-behavior: smooth;
  /* No native bar: the edge fade and the scroll buttons are the overflow affordance.
     Consumers wanting one can add `.cui-scrollbar` and override these. */
  scrollbar-width: none;
}

.cui-tabs__scroll > :deep(.cui-scroll-area__scroller)::-webkit-scrollbar {
  display: none;
}

.cui-tabs__bar {
  display: flex;
}

.cui-tabs--horizontal .cui-tabs__bar {
  flex-direction: row;
  width: max-content;
  min-width: 100%;
}

.cui-tabs--vertical .cui-tabs__bar-outer {
  min-width: 10rem;
  min-height: 0;
}

.cui-tabs--vertical .cui-tabs__bar {
  flex-direction: column;
}

/* --- Scroll buttons (#236): CuiScrollArea's indicators, in the tab bar's own tokens.
   Opaque, since they sit over the tabs: the surface the bar is on by default, the
   track's own colour on a segmented bar. Declared here, so inside a tab bar these win
   over a --cui-scroll-area-indicator-* set further up. --- */
:where(.cui-tabs__scroll) {
  --cui-scroll-area-indicator-bg: var(--cui-tabs-scroll-button-bg, var(--cui-surface-base));
  --cui-scroll-area-indicator-color: var(--cui-tabs-scroll-button-color, var(--cui-text-secondary));
  --cui-scroll-area-indicator-size: var(--cui-tabs-scroll-button-size, 2rem);
}

:where(.cui-tabs--segmented .cui-tabs__scroll) {
  --cui-scroll-area-indicator-bg: var(--cui-tabs-scroll-button-bg, var(--cui-surface-bg));
}

/* The full depth of the bar, so no tab shows above or below a button. */
.cui-tabs--horizontal .cui-tabs__scroll :deep(.cui-scroll-area__indicator) {
  height: 100%;
}

.cui-tabs--vertical .cui-tabs__scroll :deep(.cui-scroll-area__indicator) {
  width: 100%;
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

/* Arrowing along the bar moves the selection at once (#269): a colour or underline fading
   behind each key press leaves a trail of half-selected tabs. A pointer moving over the bar
   brings the fade back. */
.cui-tabs[data-keyed] .cui-tabs__tab {
  transition: none;
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
