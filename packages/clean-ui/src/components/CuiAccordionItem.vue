<script setup lang="ts">
import { inject, computed, ref, nextTick, onMounted } from "vue";
import { useCollapsible } from "../composables/useCollapsible";
import { useCuiId } from "../composables/useCuiId";
import CuiIcon from "./CuiIcon.vue";
import { AccordionContextKey } from "./accordion-context";
import type { HideableProps, DisableableProps } from "../types/common";

export interface CuiAccordionItemProps extends HideableProps, DisableableProps {
  /** Unique value for this item */
  value: string;
  /** Header label text (or use #header slot) */
  label?: string;
  /** Start expanded (uncontrolled mode) */
  defaultOpen?: boolean;
}

const props = withDefaults(defineProps<CuiAccordionItemProps>(), {
  defaultOpen: false,
  disabled: false,
  hidden: false,
});

const ctx = inject(AccordionContextKey);

const isOpen = computed(() => ctx?.isOpen(props.value) ?? false);
const noAnimation = computed(() => ctx?.noAnimation.value ?? false);

// Collapsed panels are hidden once the collapse ends (hidden="until-found", else inert) so
// they leave the tab order and the accessibility tree; a find-in-page match opens one (#162).
const { panel, hiddenAttr, inertAttr, onBeforeMatch } = useCollapsible(
  () => isOpen.value,
  () => ctx?.toggle(props.value),
);

// A `defaultOpen` item opens at mount with the transition off: it starts open, it isn't
// opening. The reflow makes the open state count as drawn before the transition returns.
const instant = ref(false);
onMounted(async () => {
  if (props.defaultOpen && ctx && !ctx.isOpen(props.value)) {
    instant.value = true;
    ctx.toggle(props.value);
    await nextTick();
    void panel.value?.offsetHeight;
    instant.value = false;
  }
});

function toggle() {
  if (props.disabled) return;
  ctx?.toggle(props.value);
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    toggle();
  }
}

// Per instance, not keyed on `value`: two accordions sharing item values (e.g. "1", "2")
// rendered duplicate ids and cross-wired aria-controls / aria-labelledby (#272).
const itemId = useCuiId("accordion");
const panelId = `${itemId}-panel`;
const triggerId = `${itemId}-trigger`;
</script>

<template>
  <div
    v-show="!hidden"
    class="cui-accordion-item"
    :class="{ 'cui-accordion-item--open': isOpen, 'cui-accordion-item--disabled': disabled }"
  >
    <!-- Trigger -->
    <button
      :id="triggerId"
      type="button"
      class="cui-accordion-item__trigger"
      :aria-expanded="isOpen"
      :aria-controls="panelId"
      :aria-disabled="disabled || undefined"
      :tabindex="disabled ? -1 : 0"
      @click="toggle"
      @keydown="onKeydown"
    >
      <span class="cui-accordion-item__header">
        <slot name="header">{{ label }}</slot>
      </span>
      <CuiIcon
        name="caret-down"
        size="1rem"
        class="cui-accordion-item__chevron"
        :class="{ 'cui-accordion-item__chevron--open': isOpen }"
      />
    </button>

    <!-- Panel -->
    <div
      :id="panelId"
      ref="panel"
      class="cui-accordion-item__panel"
      :class="{
        'cui-accordion-item__panel--open': isOpen,
        'cui-accordion-item__panel--no-animation': noAnimation || instant,
      }"
      role="region"
      :aria-labelledby="triggerId"
      :hidden.attr="hiddenAttr"
      :inert.attr="inertAttr"
      @beforematch="onBeforeMatch"
    >
      <div class="cui-accordion-item__clip">
        <div class="cui-accordion-item__content">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cui-accordion-item + .cui-accordion-item {
  border-top: 1px solid color-mix(in srgb, var(--cui-border) 50%, transparent);
}

/* --- Trigger --- */
.cui-accordion-item__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: calc(0.875rem * var(--cui-density-scale, 1)) calc(1.125rem * var(--cui-density-scale, 1));
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--cui-text-body);
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: color var(--cui-duration-fast) ease, background var(--cui-duration-fast) ease;
  outline: none;
}

.cui-accordion-item__trigger:hover:not([aria-disabled="true"]) {
  background: var(--cui-surface-bg);
}

.cui-accordion-item__trigger:focus-visible {
  outline: 2px solid var(--cui-primary-focus-ring);
  outline-offset: -2px;
}

.cui-accordion-item--disabled .cui-accordion-item__trigger {
  opacity: 0.5;
  cursor: not-allowed;
}

.cui-accordion-item__header {
  flex: 1;
  min-width: 0;
}

/* --- Chevron --- */
.cui-accordion-item__chevron {
  flex-shrink: 0;
  color: var(--cui-text-tertiary);
  transition: transform var(--cui-duration-slow) var(--cui-ease-in-out);
}

.cui-accordion-item__chevron--open {
  transform: rotate(180deg);
}

/* --- Panel ---
   Collapsed by grid-template-rows (0fr -> 1fr), so no height is measured: the clip shrinks
   (min-height: 0) and hides the overflow. Once shut, the panel is hidden (until-found) or
   inert (see useCollapsible), so nothing inside stays focusable. */
.cui-accordion-item__panel {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--cui-duration-slow) var(--cui-ease-out);
}

.cui-accordion-item__panel--open {
  grid-template-rows: 1fr;
}

.cui-accordion-item__panel--no-animation {
  transition: none;
}

.cui-accordion-item__panel[inert] {
  visibility: hidden;
}

.cui-accordion-item__clip {
  min-height: 0;
  overflow: hidden;
}

.cui-accordion-item__content {
  padding: 0 calc(1.125rem * var(--cui-density-scale, 1)) calc(1rem * var(--cui-density-scale, 1));
  font-size: 0.875rem;
  color: var(--cui-text-secondary);
  line-height: 1.6;
}
</style>
