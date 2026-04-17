<script setup lang="ts">
import { ref, inject, computed } from "vue";
import CuiIcon from "./CuiIcon.vue";
import { DropdownContextKey, computeDropdownPosition, type DropdownTrigger } from "./dropdown-context";

export interface CuiDropdownSubProps {
  /** Override parent trigger for this sub-menu */
  trigger?: DropdownTrigger;
  /** Disabled state */
  disabled?: boolean;
}

const props = withDefaults(defineProps<CuiDropdownSubProps>(), {
  disabled: false,
});

const parentCtx = inject(DropdownContextKey);
const resolvedTrigger = computed(() => props.trigger ?? parentCtx?.trigger.value ?? "click");

const isOpen = ref(false);
const triggerRef = ref<HTMLElement>();
const menuStyle = ref<Record<string, string>>({});
let showTimer: ReturnType<typeof setTimeout> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

// Register with parent so siblings can close us
const unregister = parentCtx?.registerSubMenu(() => close());
import { onUnmounted } from "vue";
onUnmounted(() => unregister?.());

function open() {
  if (props.disabled) return;
  if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
  // Close sibling sub-menus
  parentCtx?.closeSiblingSubMenus(() => close());
  if (triggerRef.value) {
    const { styles } = computeDropdownPosition(triggerRef.value, "right");
    menuStyle.value = styles;
  }
  isOpen.value = true;
}

function close() {
  if (showTimer) { clearTimeout(showTimer); showTimer = null; }
  isOpen.value = false;
}

function toggle() {
  if (isOpen.value) close(); else open();
}

function onMouseEnter() {
  if (resolvedTrigger.value === "hover" || resolvedTrigger.value === "hover-focus") {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    showTimer = setTimeout(open, 150);
  }
}

function onMouseLeave() {
  if (resolvedTrigger.value === "hover" || resolvedTrigger.value === "hover-focus") {
    if (showTimer) { clearTimeout(showTimer); showTimer = null; }
    hideTimer = setTimeout(close, 200);
  }
}

function onClick() {
  if (resolvedTrigger.value === "click") toggle();
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "ArrowRight" && !isOpen.value) {
    e.preventDefault();
    e.stopPropagation();
    open();
  } else if (e.key === "ArrowLeft" && isOpen.value) {
    e.preventDefault();
    e.stopPropagation();
    close();
  } else if (e.key === "Escape" && isOpen.value) {
    e.stopPropagation();
    close();
  }
}

</script>

<template>
  <div
    class="cui-dropdown-sub"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @keydown="onKeydown"
  >
    <!-- Sub-menu trigger -->
    <div
      ref="triggerRef"
      class="cui-dropdown-sub__trigger"
      :class="{ 'cui-dropdown-sub__trigger--disabled': disabled, 'cui-dropdown-sub__trigger--open': isOpen }"
      role="menuitem"
      aria-haspopup="true"
      :aria-expanded="isOpen"
      :aria-disabled="disabled || undefined"
      :tabindex="disabled ? -1 : 0"
      @click="onClick"
    >
      <span v-if="$slots.icon" class="cui-dropdown-sub__icon">
        <slot name="icon" />
      </span>
      <span class="cui-dropdown-sub__label"><slot /></span>
      <CuiIcon name="caret-right" size="0.75rem" class="cui-dropdown-sub__arrow" />
    </div>

    <!-- Sub-menu panel -->
    <Teleport to="body">
    <div
      v-if="isOpen"
      class="cui-dropdown-sub__menu"
      :style="menuStyle"
      role="menu"
      @mouseenter="onMouseEnter"
      @mouseleave="onMouseLeave"
    >
      <slot name="menu" />
    </div>
    </Teleport>
  </div>
</template>

<style scoped>
.cui-dropdown-sub {
  position: relative;
}

.cui-dropdown-sub__trigger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.625rem;
  border-radius: 0.25rem;
  font-size: 0.8125rem;
  color: var(--cui-text-body);
  cursor: pointer;
  outline: none;
  transition: background 0.1s ease;
}

.cui-dropdown-sub__trigger:hover,
.cui-dropdown-sub__trigger:focus-visible,
.cui-dropdown-sub__trigger--open {
  background: var(--color-surface-100);
}

:where(.dark, .dark *) .cui-dropdown-sub__trigger:hover,
:where(.dark, .dark *) .cui-dropdown-sub__trigger:focus-visible,
:where(.dark, .dark *) .cui-dropdown-sub__trigger--open {
  background: var(--color-surface-800);
}

.cui-dropdown-sub__trigger--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.cui-dropdown-sub__icon {
  display: flex;
  flex-shrink: 0;
  color: var(--cui-text-secondary);
}

.cui-dropdown-sub__label {
  flex: 1;
  line-height: 1.4;
}

.cui-dropdown-sub__arrow {
  flex-shrink: 0;
  color: var(--cui-text-tertiary);
}

/* --- Sub-menu panel --- */
.cui-dropdown-sub__menu {
  min-width: 10rem;
  padding: 0.25rem;
  border-radius: var(--cui-button-radius, 0.375rem);
  border: 1px solid var(--cui-border);
  background: var(--cui-surface-base);
  box-shadow: 0 4px 16px rgb(0 0 0 / 0.1);
  overflow-y: auto;
  animation: cui-dropdown-sub-in 0.15s ease;
}

:where(.dark, .dark *) .cui-dropdown-sub__menu {
  box-shadow: 0 4px 16px rgb(0 0 0 / 0.3);
}

@keyframes cui-dropdown-sub-in {
  from {
    opacity: 0;
    transform: translateX(-4px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
