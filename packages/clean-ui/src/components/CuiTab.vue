<script setup lang="ts">
import { onMounted, onUnmounted, computed, watch, useSlots } from "vue";
import { useTabsContext } from "./tabs-context";
import type { HideableProps, DisableableProps } from "../types/common";

export interface CuiTabProps extends HideableProps, DisableableProps {
  /** Unique tab value (used for v-model matching) */
  value: string;
  /** Tab label text */
  label: string;
  /** Show close button on this tab */
  closeable?: boolean;
}

const props = withDefaults(defineProps<CuiTabProps>(), {
  disabled: false,
  closeable: false,
  hidden: false,
});

const ctx = useTabsContext();

const isActive = computed(() => ctx.activeTab.value === props.value);

const slots = useSlots();

function definition() {
  return {
    value: props.value,
    label: props.label,
    disabled: props.disabled,
    closeable: props.closeable,
    // Call through `slots` rather than capturing the slot function, so the
    // parent's render always invokes the current one — a badge count in the
    // slot updates without re-registering the tab.
    labelSlot: slots.label ? () => slots.label?.() : undefined,
  };
}

// Register with parent
onMounted(() => {
  ctx.register(definition());
});

// Re-register when what the bar renders changes. `register` updates in place,
// so this can't reorder the tab. Slot *presence* is watched too: a tab that
// gains a #label slot later still needs the parent to pick it up.
watch(
  () => [props.label, props.disabled, props.closeable, !!slots.label],
  () => {
    ctx.register(definition());
  },
);

onUnmounted(() => {
  ctx.unregister(props.value);
});

// Transition class
const transitionName = computed(() => {
  // None for a switch from the keyboard (#269): arrowing along the bar is too frequent.
  if (ctx.transition.value === "none" || ctx.keyed?.value) return undefined;
  if (ctx.transition.value === "slide") {
    return ctx.slideDirection?.value === "right" ? "cui-tab-slide-right" : "cui-tab-slide-left";
  }
  return "cui-tab-fade";
});

</script>

<template>
  <!-- Keep alive: show/hide with v-show -->
  <div
    v-if="ctx.keepAlive.value"
    v-show="isActive && !hidden"
    class="cui-tab-panel"
    :class="[isActive ? transitionName : '']"
    role="tabpanel"
    :id="ctx.panelId?.(value)"
    :aria-labelledby="ctx.tabId?.(value)"
  >
    <slot />
  </div>

  <!-- No keep alive: mount/unmount with v-if -->
  <div
    v-else-if="isActive"
    v-show="!hidden"
    class="cui-tab-panel"
    :class="transitionName"
    role="tabpanel"
    :id="ctx.panelId?.(value)"
    :aria-labelledby="ctx.tabId?.(value)"
  >
    <slot />
  </div>
</template>

<style scoped>
.cui-tab-panel {
  padding: calc(1rem * var(--cui-density-scale, 1)) 0;
}

/* --- Fade --- */
.cui-tab-fade {
  animation: cui-tab-fade-in 0.2s ease;
}

@keyframes cui-tab-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* --- Slide left (forward) --- */
.cui-tab-slide-left {
  animation: cui-tab-slide-left-in 0.25s ease;
}

@keyframes cui-tab-slide-left-in {
  from {
    opacity: 0;
    transform: translateX(1rem);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Forward is toward the bar's end: from the left in a right-to-left page, from below in a
   vertical bar (#269). Only the keyframes change; each keeps its rule's duration. */
.cui-tab-slide-left:dir(rtl) {
  animation-name: cui-tab-slide-right-in;
}

.cui-tab-slide-right:dir(rtl) {
  animation-name: cui-tab-slide-left-in;
}

.cui-tabs--vertical .cui-tab-slide-left {
  animation-name: cui-tab-slide-down-in;
}

.cui-tabs--vertical .cui-tab-slide-right {
  animation-name: cui-tab-slide-up-in;
}

@keyframes cui-tab-slide-down-in {
  from {
    opacity: 0;
    transform: translateY(1rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes cui-tab-slide-up-in {
  from {
    opacity: 0;
    transform: translateY(-1rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* --- Slide right (backward) --- */
.cui-tab-slide-right {
  animation: cui-tab-slide-right-in 0.25s ease;
}

@keyframes cui-tab-slide-right-in {
  from {
    opacity: 0;
    transform: translateX(-1rem);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
