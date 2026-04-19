<script setup lang="ts">
import { ref, provide, toRef, watch, computed } from "vue";
import { AccordionContextKey } from "./accordion-context";
import type { ButtonColor } from "./CuiButton.vue";

export interface CuiAccordionProps {
  /** Array of open item values (v-model) */
  modelValue?: string[];
  /** Allow multiple items open at once */
  multiple?: boolean;
  /** Color role for active indicator */
  color?: ButtonColor;
  /** Disable expand/collapse animation */
  noAnimation?: boolean;
  /** Hide the component */
  hidden?: boolean;
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

// Keyboard navigation
function onKeydown(e: KeyboardEvent) {
  const container = e.currentTarget as HTMLElement;
  const triggers = Array.from(
    container.querySelectorAll<HTMLElement>(".cui-accordion-item__trigger:not([aria-disabled='true'])"),
  );
  const currentIdx = triggers.indexOf(document.activeElement as HTMLElement);

  let nextIdx = -1;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    nextIdx = currentIdx < triggers.length - 1 ? currentIdx + 1 : 0;
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    nextIdx = currentIdx > 0 ? currentIdx - 1 : triggers.length - 1;
  } else if (e.key === "Home") {
    e.preventDefault();
    nextIdx = 0;
  } else if (e.key === "End") {
    e.preventDefault();
    nextIdx = triggers.length - 1;
  }

  if (nextIdx >= 0) {
    triggers[nextIdx].focus();
  }
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
  border-radius: var(--cui-button-radius, 0.375rem);
  overflow: hidden;
}
</style>
