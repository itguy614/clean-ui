<script setup lang="ts">
import { inject, computed, ref, watch, nextTick, onMounted } from "vue";
import CuiIcon from "./CuiIcon.vue";
import { AccordionContextKey } from "./accordion-context";

export interface CuiAccordionItemProps {
  /** Unique value for this item */
  value: string;
  /** Header label text (or use #header slot) */
  label?: string;
  /** Start expanded (uncontrolled mode) */
  defaultOpen?: boolean;
  /** Disabled — can't toggle */
  disabled?: boolean;
  /** Hide the component */
  hidden?: boolean;
}

const props = withDefaults(defineProps<CuiAccordionItemProps>(), {
  defaultOpen: false,
  disabled: false,
  hidden: false,
});

const ctx = inject(AccordionContextKey);

const isOpen = computed(() => ctx?.isOpen(props.value) ?? false);
const noAnimation = computed(() => ctx?.noAnimation.value ?? false);

// Smooth height animation
const contentRef = ref<HTMLElement>();
let initialized = false;

// Register default open on mount + set initial height for pre-opened items
onMounted(() => {
  if (props.defaultOpen && ctx && !ctx.isOpen(props.value)) {
    ctx.toggle(props.value);
  }

  // Set initial height without animation
  nextTick(() => {
    if (ctx?.isOpen(props.value) && contentRef.value) {
      contentRef.value.style.maxHeight = "none";
    }
    // Mark as initialized so the watcher starts animating
    initialized = true;
  });
});

watch(isOpen, (open) => {
  if (!initialized) return;
  if (noAnimation.value) {
    if (contentRef.value) {
      contentRef.value.style.maxHeight = open ? "none" : "0px";
    }
    return;
  }

  const el = contentRef.value;
  if (!el) return;

  if (open) {
    // Expand: set to 0 first, then animate to measured height
    el.style.maxHeight = "0px";
    el.offsetHeight;
    el.style.maxHeight = `${el.scrollHeight}px`;
    const onEnd = () => {
      el.style.maxHeight = "none";
      el.removeEventListener("transitionend", onEnd);
    };
    el.addEventListener("transitionend", onEnd);
  } else {
    // Collapse: snap from none to explicit height, then animate to 0
    el.style.maxHeight = `${el.scrollHeight}px`;
    el.offsetHeight;
    el.style.maxHeight = "0px";
  }
}, { flush: "post" });

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

const panelId = `cui-accordion-panel-${props.value}`;
const triggerId = `cui-accordion-trigger-${props.value}`;
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
      ref="contentRef"
      class="cui-accordion-item__panel"
      :class="{
        'cui-accordion-item__panel--open': isOpen,
        'cui-accordion-item__panel--no-animation': noAnimation,
      }"
      role="region"
      :aria-labelledby="triggerId"
    >
      <div class="cui-accordion-item__content">
        <slot />
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
  padding: 0.875rem 1.125rem;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--cui-text-body);
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: color 0.15s ease, background 0.15s ease;
  outline: none;
}

.cui-accordion-item__trigger:hover:not([aria-disabled="true"]) {
  background: var(--color-surface-100);
}

:where(.dark, .dark *) .cui-accordion-item__trigger:hover:not([aria-disabled="true"]) {
  background: var(--color-surface-800);
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
  transition: transform 0.25s ease;
}

.cui-accordion-item__chevron--open {
  transform: rotate(180deg);
}

/* --- Panel --- */
.cui-accordion-item__panel {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.cui-accordion-item__panel--no-animation {
  transition: none;
}

.cui-accordion-item__panel--no-animation.cui-accordion-item__panel--open {
  max-height: none;
}

.cui-accordion-item__content {
  padding: 0 1.125rem 1rem;
  font-size: 0.875rem;
  color: var(--cui-text-secondary);
  line-height: 1.6;
}
</style>
