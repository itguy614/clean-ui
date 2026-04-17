<script setup lang="ts">
import { ref, provide, toRef, computed, nextTick } from "vue";
import CuiIcon from "./CuiIcon.vue";
import {
  TabsContextKey,
  type TabDefinition,
  type TabVariant,
  type TabOrientation,
  type TabTransition,
} from "./tabs-context";
import type { ButtonColor } from "./CuiButton.vue";

export interface CuiTabsProps {
  /** Active tab value */
  modelValue?: string;
  /** Tab bar style */
  variant?: TabVariant;
  /** Layout orientation */
  orientation?: TabOrientation;
  /** Color role for active indicator */
  color?: ButtonColor;
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
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
  close: [value: string];
}>();

const activeTab = ref(props.modelValue ?? "");
const previousTab = ref("");
const tabs = ref<TabDefinition[]>([]);

// Sync external v-model
import { watch } from "vue";
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
  if (!tabs.value.find((t) => t.value === tab.value)) {
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

provide(TabsContextKey, {
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
    activate(enabledTabs[nextIdx].value);
    nextTick(() => {
      const tabEl = document.querySelector<HTMLElement>(
        `[data-cui-tab-value="${enabledTabs[nextIdx].value}"]`,
      );
      tabEl?.focus();
    });
  }
}

// Slide direction
const slideDirection = computed(() => {
  const prevIdx = tabs.value.findIndex((t) => t.value === previousTab.value);
  const currIdx = tabs.value.findIndex((t) => t.value === activeTab.value);
  return currIdx >= prevIdx ? "left" : "right";
});
</script>

<template>
  <div
    class="cui-tabs"
    :class="[
      `cui-tabs--${variant}`,
      `cui-tabs--${orientation}`,
    ]"
  >
    <!-- Tab bar -->
    <div
      class="cui-tabs__bar"
      role="tablist"
      :aria-orientation="orientation"
      @keydown="onKeydown"
    >
      <button
        v-for="tab in tabs"
        :key="tab.value"
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
        :aria-selected="activeTab === tab.value"
        :aria-disabled="tab.disabled || undefined"
        :tabindex="activeTab === tab.value ? 0 : -1"
        @click="activate(tab.value)"
      >
        <span class="cui-tabs__tab-content">{{ tab.label }}</span>
        <button
          v-if="tab.closeable"
          type="button"
          class="cui-tabs__tab-close"
          aria-label="Close tab"
          tabindex="-1"
          @click.stop="close(tab.value)"
        >
          <CuiIcon name="x" size="0.75rem" />
        </button>
      </button>
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
}

.cui-tabs--horizontal {
  flex-direction: column;
}

.cui-tabs--vertical {
  flex-direction: row;
  gap: 1rem;
}

/* --- Tab bar --- */
.cui-tabs__bar {
  display: flex;
  flex-shrink: 0;
}

.cui-tabs--horizontal .cui-tabs__bar {
  flex-direction: row;
  gap: 0;
}

.cui-tabs--vertical .cui-tabs__bar {
  flex-direction: column;
  gap: 0;
  min-width: 10rem;
}

/* Underline variant */
.cui-tabs--underline.cui-tabs--horizontal .cui-tabs__bar {
  border-bottom: 1px solid var(--cui-border);
}

.cui-tabs--underline.cui-tabs--vertical .cui-tabs__bar {
  border-right: 1px solid var(--cui-border);
  padding-right: 0;
}

/* Segmented variant */
.cui-tabs--segmented .cui-tabs__bar {
  background: var(--color-surface-100);
  border-radius: var(--cui-button-radius, 0.375rem);
  padding: 0.25rem;
  gap: 0.25rem;
}

:where(.dark, .dark *) .cui-tabs--segmented .cui-tabs__bar {
  background: var(--color-surface-800);
}

/* --- Tab button --- */
.cui-tabs__tab {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.625rem 1rem;
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
  border-radius: calc(var(--cui-button-radius, 0.375rem) - 0.125rem);
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
  padding: 0.125rem;
  border-radius: 0.25rem;
  margin: -0.125rem -0.25rem -0.125rem 0;
  transition: color 0.15s ease, background 0.15s ease;
}

.cui-tabs__tab-close:hover {
  color: var(--cui-text-body);
  background: var(--color-surface-200);
}

:where(.dark, .dark *) .cui-tabs__tab-close:hover {
  background: var(--color-surface-700);
}

.cui-tabs__tab-content {
  display: flex;
  align-items: center;
  gap: 0.375rem;
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
