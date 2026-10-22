<script setup lang="ts">
import { computed, type Component } from "vue";
import { PhCaretDown, PhCaretLeft, PhCaretRight, PhCaretUp } from "@phosphor-icons/vue";
import CuiIcon from "./CuiIcon.vue";
import { useScrollArea } from "../composables/useScrollArea";
import type { HideableProps } from "../types/common";

/**
 * A scroll container with edge fades and optional overflow indicators (#143). A thin shell
 * over `useScrollArea`, which owns the arrangement; this adds the indicators.
 */
export interface CuiScrollAreaProps extends HideableProps {
  /** Which axis scrolls. One per scroll area. */
  orientation?: "horizontal" | "vertical";
  /** Fade the content out at an edge that has more past it. */
  fade?: boolean;
  /**
   * An arrow at each edge with more content: `arrow` is decorative, `button` scrolls by about
   * three-quarters of the visible size when clicked. Neither is focusable — a keyboard
   * scrolls the region itself.
   */
  indicator?: "none" | "arrow" | "button";
  /** `auto` shows an indicator only where there is more; `always` shows both, the spent one disabled. */
  indicatorVisibility?: "auto" | "always";
  /** The start edge's icon: a registered name or an icon component. */
  startIcon?: string | Component;
  /** The end edge's icon. */
  endIcon?: string | Component;
  /**
   * Whether an overflowing scroll area is a named, focusable region. Turn it off when the
   * content is itself keyboard-navigable (a toolbar's buttons), which would make it a second
   * tab stop.
   */
  region?: boolean;
  /** The region's name. Defaults to "Scrollable content" (`scrollArea.region`). */
  ariaLabel?: string;
  /** id(s) of an element naming the region; takes precedence over `ariaLabel`. */
  ariaLabelledby?: string;
}

const props = withDefaults(defineProps<CuiScrollAreaProps>(), {
  orientation: "vertical",
  fade: true,
  indicator: "none",
  indicatorVisibility: "auto",
  region: true,
  hidden: false,
});

const INDICATOR_SIZE = "var(--cui-scroll-area-indicator-size, 2rem)";

const area = useScrollArea({
  orientation: () => props.orientation,
  fade: () => (props.fade ? "mask" : "none"),
  // An item scrolled into view stops clear of the indicator as well as the fade.
  edgeInset: () => (props.indicator === "none" ? undefined : INDICATOR_SIZE),
  region: () => props.region,
  ariaLabel: () => props.ariaLabel,
  ariaLabelledby: () => props.ariaLabelledby,
});

type Edge = "start" | "end";
const EDGES: Edge[] = ["start", "end"];
const hasMore = (edge: Edge) => (edge === "start" ? area.canScrollStart.value : area.canScrollEnd.value);
const shown = (edge: Edge) => props.indicatorVisibility === "always" || hasMore(edge);

// The carets point at their edge: in a right-to-left page a horizontal start is on the right.
const defaultIcons = computed<Record<Edge, Component>>(() =>
  props.orientation === "vertical"
    ? { start: PhCaretUp, end: PhCaretDown }
    : area.rtl.value
      ? { start: PhCaretRight, end: PhCaretLeft }
      : { start: PhCaretLeft, end: PhCaretRight },
);

/** CuiIcon takes a name and a component as separate props. */
function iconProps(edge: Edge) {
  const icon = (edge === "start" ? props.startIcon : props.endIcon) ?? defaultIcons.value[edge];
  return typeof icon === "string" ? { name: icon } : { icon };
}

function focus(opts?: FocusOptions) {
  area.scroller.value?.focus(opts);
}
function blur() {
  area.scroller.value?.blur();
}

defineExpose({ el: area.scroller, focus, blur, update: area.update, scrollByPage: area.scrollByPage });
</script>

<template>
  <div
    v-show="!hidden"
    class="cui-scroll-area"
:class="[`cui-scroll-area--${orientation}`, { 'cui-scroll-area--reserve': indicator !== 'none' && indicatorVisibility === 'always' }]"
    :style="area.wrapperStyle"
  >
    <div :ref="area.setScroller" class="cui-scroll-area__scroller" v-bind="area.scrollerAttrs.value">
      <slot />
    </div>

    <!-- Siblings of the scroller, never inside it: inside, they'd scroll away with the content
         (#125), and inside a role=tablist they'd break its ownership rules (#236). Pointer
         affordances only — not focusable, hidden from assistive tech. A click doesn't take
         focus either (mousedown.prevent): it would land inside aria-hidden, and leave the
         tablist or toolbar whose keys the user was on. -->
    <template v-if="indicator !== 'none'">
      <div
        v-for="edge in EDGES"
        :key="edge"
        class="cui-scroll-area__edge"
        :class="[`cui-scroll-area__edge--${edge}`, { 'cui-scroll-area__edge--hidden': !shown(edge) }]"
        aria-hidden="true"
      >
        <slot :name="`indicator-${edge}`" :edge="edge" :has-more="hasMore(edge)" :scroll="() => area.scrollByPage(edge)">
          <button
            v-if="indicator === 'button'"
            type="button"
            class="cui-scroll-area__indicator"
            tabindex="-1"
            :disabled="!hasMore(edge)"
            @mousedown.prevent
            @click="area.scrollByPage(edge)"
          >
            <CuiIcon v-bind="iconProps(edge)" size="1rem" />
          </button>
          <span v-else class="cui-scroll-area__indicator cui-scroll-area__indicator--decorative">
            <CuiIcon v-bind="iconProps(edge)" size="1rem" />
          </span>
        </slot>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* --- Themeable: zero specificity, so a consumer's own rule wins (see CuiButton.vue) --- */
/* The ring is drawn on the wrapper: on the scroller, its own mask would fade the ring out at
   each edge with more content. */
:where(.cui-scroll-area:has(> .cui-scroll-area__scroller:focus-visible)) {
  outline: 2px solid var(--cui-scroll-area-focus-ring, var(--cui-primary-focus-ring));
  outline-offset: -2px;
}

:where(.cui-scroll-area, .cui-scroll-area__scroller) {
  border-radius: inherit;
}

:where(.cui-scroll-area__indicator) {
  background: var(--cui-scroll-area-indicator-bg, var(--cui-surface-base));
  color: var(--cui-scroll-area-indicator-color, var(--cui-text-secondary));
}

/* --- Structural --- */
.cui-scroll-area {
  display: flex;
  min-width: 0;
  min-height: 0;
}

.cui-scroll-area--vertical {
  flex-direction: column;
}

.cui-scroll-area__scroller {
  flex: 1 1 auto;
  outline: none;
  min-width: 0;
  min-height: 0;
}

.cui-scroll-area--vertical > .cui-scroll-area__scroller {
  overflow-x: hidden;
  overflow-y: auto;
}

.cui-scroll-area--horizontal > .cui-scroll-area__scroller {
  overflow-x: auto;
  overflow-y: hidden;
}

/* The indicators overlay the scroller's edges; logical sides, so they follow the page's
   direction. */
.cui-scroll-area__edge {
  position: absolute;
  z-index: 6;
  display: flex;
  /* The strip spans the edge; only the indicator in it takes the pointer, so content under
     the rest of the strip stays clickable. */
  pointer-events: none;
  transition: opacity 0.15s ease;
}

.cui-scroll-area__edge > * {
  pointer-events: auto;
}

/* Indicators that never hide sit over the first and last items for good: keep the content
   clear of them. */
.cui-scroll-area--reserve.cui-scroll-area--horizontal > .cui-scroll-area__scroller {
  padding-inline: var(--cui-scroll-area-indicator-size, 2rem);
}

.cui-scroll-area--reserve.cui-scroll-area--vertical > .cui-scroll-area__scroller {
  padding-block: var(--cui-scroll-area-indicator-size, 2rem);
}

.cui-scroll-area--horizontal > .cui-scroll-area__edge {
  inset-block: 0;
  align-items: center;
}

.cui-scroll-area--horizontal > .cui-scroll-area__edge--start {
  inset-inline-start: 0;
}

.cui-scroll-area--horizontal > .cui-scroll-area__edge--end {
  inset-inline-end: 0;
}

.cui-scroll-area--vertical > .cui-scroll-area__edge {
  inset-inline: 0;
  justify-content: center;
}

.cui-scroll-area--vertical > .cui-scroll-area__edge--start {
  top: 0;
}

.cui-scroll-area--vertical > .cui-scroll-area__edge--end {
  bottom: 0;
}

.cui-scroll-area__edge--hidden {
  opacity: 0;
}

.cui-scroll-area__edge--hidden > * {
  pointer-events: none;
}

.cui-scroll-area__indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--cui-scroll-area-indicator-size, 2rem);
  height: var(--cui-scroll-area-indicator-size, 2rem);
  border: 0;
  padding: 0;
  border-radius: var(--cui-radius-sm, 0.25rem);
}

button.cui-scroll-area__indicator {
  cursor: pointer;
}

button.cui-scroll-area__indicator:disabled {
  cursor: default;
  opacity: 0.4;
}

.cui-scroll-area__indicator--decorative {
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .cui-scroll-area__edge {
    transition: none;
  }
}
</style>
