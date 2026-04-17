<script setup lang="ts">
import { inject, onMounted, onUnmounted, computed, watch } from "vue";
import { TabsContextKey } from "./tabs-context";

export interface CuiTabProps {
  /** Unique tab value (used for v-model matching) */
  value: string;
  /** Tab label text */
  label: string;
  /** Disable this tab */
  disabled?: boolean;
  /** Show close button on this tab */
  closeable?: boolean;
}

const props = withDefaults(defineProps<CuiTabProps>(), {
  disabled: false,
  closeable: false,
});

const ctx = inject(TabsContextKey);

if (!ctx) {
  throw new Error("[CuiTab] must be used inside a <CuiTabs> component.");
}

const isActive = computed(() => ctx.activeTab.value === props.value);

// Register/unregister with parent
onMounted(() => {
  ctx.register({
    value: props.value,
    label: props.label,
    disabled: props.disabled,
    closeable: props.closeable,
  });
});

// Update registration when props change
watch(
  () => ({ label: props.label, disabled: props.disabled, closeable: props.closeable }),
  () => {
    ctx.unregister(props.value);
    ctx.register({
      value: props.value,
      label: props.label,
      disabled: props.disabled,
      closeable: props.closeable,
    });
  },
);

onUnmounted(() => {
  ctx.unregister(props.value);
});

// Transition class
const transitionName = computed(() => {
  if (ctx.transition.value === "none") return undefined;
  if (ctx.transition.value === "slide") {
    const prevIdx = findTabIndex(ctx.previousTab.value);
    const currIdx = findTabIndex(props.value);
    return currIdx >= prevIdx ? "cui-tab-slide-left" : "cui-tab-slide-right";
  }
  return "cui-tab-fade";
});

function findTabIndex(value: string): number {
  // Approximate index from DOM order
  const el = document.querySelector(`[data-cui-tab-value="${value}"]`);
  if (!el?.parentElement) return 0;
  return Array.from(el.parentElement.children).indexOf(el);
}
</script>

<template>
  <!-- Keep alive: show/hide with v-show -->
  <div
    v-if="ctx.keepAlive.value"
    v-show="isActive"
    class="cui-tab-panel"
    :class="[isActive ? transitionName : '']"
    role="tabpanel"
    :aria-labelledby="value"
  >
    <slot />
  </div>

  <!-- No keep alive: mount/unmount with v-if -->
  <div
    v-else-if="isActive"
    class="cui-tab-panel"
    :class="transitionName"
    role="tabpanel"
    :aria-labelledby="value"
  >
    <slot />
  </div>
</template>

<style scoped>
.cui-tab-panel {
  padding: 1rem 0;
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
