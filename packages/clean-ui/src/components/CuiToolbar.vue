<script setup lang="ts">
import { computed, onMounted, toRef, useTemplateRef } from "vue";
import CuiScrollArea from "./CuiScrollArea.vue";
import { useRovingFocus } from "../composables/useRovingFocus";
import { useToolbarProvider } from "./toolbar-context";
import { warnOnce } from "../utils/devWarn";
import type { CuiOrientation, HideableProps } from "../types/common";

export type ToolbarOverflow = "wrap" | "scroll";

/**
 * A strip of controls with one tab stop (#190): the ARIA toolbar pattern. Tab enters and
 * leaves it whatever it holds; the arrow keys, Home and End move between its controls.
 * It renders none of them — CuiButton, CuiButtonGroup, CuiSelect and CuiToolbarSeparator
 * go in its slot.
 */
export interface CuiToolbarProps extends HideableProps {
  /** The toolbar's accessible name. A toolbar needs one: this, `ariaLabel` or `ariaLabelledby`. */
  label?: string;
  /** The same as `label`, for `aria-label` passed as an attribute. `label` wins if both are set. */
  ariaLabel?: string;
  /** id(s) of visible text naming the toolbar; takes precedence over `label`. */
  ariaLabelledby?: string;
  /** Which way the controls run, and so which arrow keys move between them. */
  orientation?: CuiOrientation;
  /**
   * A toolbar longer than its container: `wrap` breaks onto another line, `scroll` keeps one
   * line in a CuiScrollArea with edge fades.
   */
  overflow?: ToolbarOverflow;
  /** An arrow past the last control comes round to the first, and back. */
  loop?: boolean;
  /**
   * Which descendants take part in the single tab stop, in document order. The default is
   * every CuiButton and CuiSelect. A text input, or anything else unmatched, keeps its own
   * tab stop and its own arrow keys.
   */
  itemSelector?: string;
}

const props = withDefaults(defineProps<CuiToolbarProps>(), {
  orientation: "horizontal",
  overflow: "wrap",
  loop: false,
  itemSelector: ".cui-button, [role='combobox']:not(input)",
  hidden: false,
});

const OPEN_POPUP = "[aria-expanded='true']:is([role='combobox'], [aria-haspopup]:not([aria-haspopup='false']))";

const root = useTemplateRef<HTMLElement>("rootRef");

useToolbarProvider({ orientation: toRef(props, "orientation") });

const roving = useRovingFocus({
  container: root,
  itemSelector: () => props.itemSelector,
  orientation: () => props.orientation,
  wrap: () => props.loop,
  // The controls are slot content the toolbar never renders, so it can't bind their
  // tabindex: the composable writes the stop onto them, and follows them coming and going.
  manageTabindex: true,
});

onMounted(() => {
  if (!props.label && !props.ariaLabel && !props.ariaLabelledby) {
    warnOnce("[clean-ui] CuiToolbar: a toolbar needs an accessible name. Pass label, aria-label or aria-labelledby.");
  }
});

function onKeydown(e: KeyboardEvent) {
  // An open popup's trigger — an open CuiSelect — owns its arrow keys, even one that doesn't
  // mark them handled. Only a popup: a disclosure button whose panel is open inline keeps
  // nothing. Anything that marks a key handled is skipped by the composable, as is a key on
  // a control that isn't an item (a text input).
  if ((e.target as Element).matches?.(OPEN_POPUP)) return;
  roving.onKeydown(e);
}

// `||`, not `??`: an empty label (a catalogue still loading) is no name.
const name = computed(() => (props.ariaLabelledby ? undefined : props.label || props.ariaLabel || undefined));

/** Focus the control holding the tab stop. */
function focus(opts?: FocusOptions) {
  root.value?.querySelector<HTMLElement>(`:is(${props.itemSelector})[tabindex="0"]`)?.focus(opts);
}
function blur() {
  const active = document.activeElement as HTMLElement | null;
  if (active && root.value?.contains(active)) active.blur();
}

defineExpose({ el: root, focus, blur });
</script>

<template>
  <div
    ref="rootRef"
    v-show="!hidden"
    class="cui-toolbar"
    :class="[`cui-toolbar--${orientation}`, `cui-toolbar--${overflow}`]"
    role="toolbar"
    :aria-orientation="orientation"
    :aria-label="name"
    :aria-labelledby="ariaLabelledby"
    @keydown="onKeydown"
    @focusin="roving.onFocusin"
    @click="roving.onFocusin"
  >
    <!-- Not a region: the controls are the keyboard path, one roving tab stop, and a
         focusable scroller would be a second. -->
    <CuiScrollArea v-if="overflow === 'scroll'" class="cui-toolbar__scroll" :orientation="orientation" :region="false">
      <slot />
    </CuiScrollArea>
    <slot v-else />
  </div>
</template>

<style>
/* --- Structural --- */
.cui-toolbar,
.cui-toolbar--scroll .cui-toolbar__scroll > .cui-scroll-area__scroller {
  display: flex;
  align-items: center;
}

.cui-toolbar--vertical,
.cui-toolbar--vertical.cui-toolbar--scroll .cui-toolbar__scroll > .cui-scroll-area__scroller {
  flex-direction: column;
}

.cui-toolbar--wrap {
  flex-wrap: wrap;
}

/* The scroll area is the flex box in scroll mode; the toolbar only holds it. */
.cui-toolbar--scroll {
  display: block;
}

.cui-toolbar--scroll .cui-toolbar__scroll > .cui-scroll-area__scroller > * {
  flex-shrink: 0;
}

/* --- Themeable: zero specificity, so a consumer's own rule wins (see CuiButton.vue) --- */
:where(.cui-toolbar) {
  background: var(--cui-toolbar-bg, transparent);
  border: var(--cui-toolbar-border, none);
  border-radius: var(--cui-toolbar-radius, 0);
}

/* Spacing reads the public token, then a private default: a component built on the toolbar
   (CuiDataGridToolbar, the editor's) sets `--_toolbar-*` on it, so a public token set on
   any ancestor still wins over that default. */

/* The flex box: the toolbar itself, or its scroller in scroll mode. */
:where(.cui-toolbar--wrap, .cui-toolbar--scroll .cui-toolbar__scroll > .cui-scroll-area__scroller) {
  gap: var(--cui-toolbar-gap, var(--_toolbar-gap, calc(0.25rem * var(--cui-density-scale, 1))));
}

:where(.cui-toolbar--wrap) {
  padding: var(--cui-toolbar-py, var(--_toolbar-py, 0)) var(--cui-toolbar-px, var(--_toolbar-px, 0));
}

/* A scroller clips what overflows it, focus rings included: its padding defaults to the
   ring's 2px width plus its 2px offset, so a focused control's ring draws whole. */
:where(.cui-toolbar--scroll .cui-toolbar__scroll > .cui-scroll-area__scroller) {
  padding: var(--cui-toolbar-py, var(--_toolbar-py, 0.25rem)) var(--cui-toolbar-px, var(--_toolbar-px, 0.25rem));
}
</style>
