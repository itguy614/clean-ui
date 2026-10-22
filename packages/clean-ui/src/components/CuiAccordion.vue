<script lang="ts">
import { useListNavigation } from "../composables/useListNavigation";

const nav = useListNavigation({ wrap: () => true });
const TRIGGER = "cui-accordion-item__trigger";
</script>

<script setup lang="ts">
import { ref, provide, toRef, watch, computed } from "vue";
import { AccordionContextKey } from "./accordion-context";
import type { CuiColor, HideableProps, ColorableProps } from "../types/common";

export interface CuiAccordionProps extends HideableProps, ColorableProps {
  /** Array of open item values (v-model) */
  modelValue?: string[];
  /** Allow multiple items open at once */
  multiple?: boolean;
  /** Disable expand/collapse animation */
  noAnimation?: boolean;
}

const props = withDefaults(defineProps<CuiAccordionProps>(), {
  modelValue: () => [],
  multiple: false,
  color: "primary",
  noAnimation: false,
  hidden: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: string[]];
}>();

const openItems = ref<string[]>([...props.modelValue]);

// Sync with external v-model
watch(
  () => props.modelValue,
  (val) => {
    openItems.value = [...val];
  },
);

function toggle(value: string) {
  const idx = openItems.value.indexOf(value);
  if (idx >= 0) {
    // Close
    openItems.value.splice(idx, 1);
  } else {
    // Open
    if (props.multiple) {
      openItems.value.push(value);
    } else {
      openItems.value = [value];
    }
  }
  emit("update:modelValue", [...openItems.value]);
}

function isOpen(value: string): boolean {
  return openItems.value.includes(value);
}

provide(AccordionContextKey, {
  openItems,
  multiple: toRef(props, "multiple"),
  color: toRef(props, "color"),
  noAnimation: toRef(props, "noAnimation"),
  toggle,
  isOpen,
});

// Keyboard navigation between the headers: the shared index maths (#289), wrapping
// (`nav`, in the module script below: stateless, so every accordion shares one).

function onKeydown(e: KeyboardEvent) {
  // Only from a header: an arrow key in a panel's own content (a textarea, a list) is its
  // own, and every keystroke typed there bubbles through here. And a nested accordion's own
  // headers have handled it already.
  if (e.defaultPrevented || !(e.target as Element).classList?.contains(TRIGGER)) return;
  const container = e.currentTarget as HTMLElement;
  const triggers = Array.from(container.querySelectorAll<HTMLElement>(`.${TRIGGER}`));
  const from = triggers.indexOf(e.target as HTMLElement);
  if (from < 0) return;
  const to = nav.indexForKey(e, from, {
    count: triggers.length,
    isDisabled: (i) => triggers[i].getAttribute("aria-disabled") === "true",
  });
  // -1: Home or End with every header disabled.
  if (to === null || to < 0) return;
  e.preventDefault();
  triggers[to].focus();
}
</script>

<template>
  <div v-show="!hidden" class="cui-accordion" @keydown="onKeydown">
    <slot />
  </div>
</template>

<style scoped>
.cui-accordion {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--cui-border);
  border-radius: var(--cui-button-radius, var(--cui-radius-md, 0.375rem));
  overflow: hidden;
}
</style>
