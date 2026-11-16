<script setup lang="ts">
import { computed, nextTick, onMounted } from "vue";
import { useCollapsible } from "../composables/useCollapsible";
import { useCuiId } from "../composables/useCuiId";
import CuiIcon from "./CuiIcon.vue";
import type { HideableProps } from "../types/common";
import { IconCaretRight } from "../icons/generated/caret-right";

export interface CuiSidebarGroupProps extends HideableProps {
  /** The group's heading, shown in capitals. The `#label` slot replaces it. */
  label?: string;
  /**
   * Open at first render. Without it (and without a `v-model:expanded`) the group opens on
   * mount if it holds the current page: a link marked `aria-current` (a `router-link` that is
   * exactly active sets it). Persisting what the user then opens or closes is the app's job.
   */
  defaultExpanded?: boolean;
}

/**
 * A collapsible section of links, for CuiSidebar or anywhere else a navigation wants one
 * (CuiNavbarMenu renders it in its drawer). Self-contained: it reads nothing from a sidebar,
 * and its links come through the default slot, typically a `CuiList`.
 */
const props = withDefaults(defineProps<CuiSidebarGroupProps>(), {
  defaultExpanded: false,
  hidden: false,
});

/**
 * `v-model:expanded`. Left unbound, the group keeps its own state. The explicit `undefined`
 * default is what keeps "not given" apart from `false`: Vue casts an absent boolean prop to
 * `false`, which would read as a parent choosing shut.
 */
const expanded = defineModel<boolean>("expanded", { default: undefined });
if (expanded.value === undefined && props.defaultExpanded) expanded.value = true;

const isOpen = computed(() => expanded.value ?? false);

function toggle() {
  expanded.value = !isOpen.value;
}

// A shut group is hidden once its collapse ends (hidden="until-found", else inert), so its
// links leave the tab order and the accessibility tree, yet a find-in-page match inside it
// still opens it (#270).
const { panel, hiddenAttr, inertAttr, onBeforeMatch } = useCollapsible(() => isOpen.value, toggle);

// The group that holds the current page opens at mount, with the transition off: it starts
// open, it isn't opening. The reflow makes the open state count as drawn first.
// A data attribute rather than a class: the template never binds it, so Vue leaves it alone.
onMounted(async () => {
  const el = panel.value;
  if (expanded.value !== undefined || !el?.querySelector('[aria-current]:not([aria-current="false"])')) return;
  el.dataset.instant = "";
  expanded.value = true;
  await nextTick();
  void el.offsetHeight;
  delete el.dataset.instant;
});

const id = useCuiId("sidebar-group");
const triggerId = `${id}-trigger`;
const panelId = `${id}-panel`;
</script>

<template>
  <div v-show="!hidden" class="cui-sidebar-group" :class="{ 'cui-sidebar-group--open': isOpen }">
    <button
      :id="triggerId"
      type="button"
      class="cui-sidebar-group__trigger"
      :aria-expanded="isOpen"
      :aria-controls="panelId"
      @click="toggle"
    >
      <span class="cui-sidebar-group__label"><slot name="label">{{ label }}</slot></span>
      <CuiIcon :icon="IconCaretRight" size="sm" class="cui-sidebar-group__chevron" />
    </button>

    <div
      :id="panelId"
      ref="panel"
      class="cui-sidebar-group__panel"
      role="group"
      :aria-labelledby="triggerId"
      :hidden.attr="hiddenAttr"
      :inert.attr="inertAttr"
      @beforematch="onBeforeMatch"
    >
      <div class="cui-sidebar-group__clip">
        <div class="cui-sidebar-group__content">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* --- Themeable ---
   Whole-:where() rules, so a consumer's plain rule or a container token wins. */
:where(.cui-sidebar-group) {
  /* The links inside are a CuiList: tighten its rows to a navigation's scale, through its
     own public tokens. */
  --cui-list-py: calc(0.375rem * var(--cui-density-scale, 1));
  --cui-list-px: 0.625rem;
  --cui-list-font-size: 0.875rem;
  --cui-list-color: var(--cui-text-body);
}

:where(.cui-sidebar-group__trigger) {
  padding: calc(0.375rem * var(--cui-density-scale, 1)) 0.625rem;
  color: var(--cui-sidebar-group-color, var(--cui-text-tertiary));
  font-size: var(--cui-sidebar-group-font-size, 0.75rem);
  border-radius: var(--cui-sidebar-radius, var(--cui-radius-md, 0.375rem));
}

/* The keyboard crosses these, so the fill changes with no transition (see "Motion"). */
:where(.cui-sidebar-group__trigger:hover) {
  background: var(--cui-sidebar-group-hover-bg, var(--cui-surface-bg));
}

:where(.cui-sidebar-group__trigger:focus-visible) {
  outline: 2px solid var(--cui-sidebar-group-focus-ring, var(--cui-primary-focus-ring));
  outline-offset: -2px;
}

:where(.cui-sidebar-group__content) {
  border-inline-start: 1px solid var(--cui-sidebar-group-border, var(--cui-border));
}

/* --- Structural --- */
.cui-sidebar-group__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  border: 0;
  background: none;
  font: inherit;
  font-size: var(--cui-sidebar-group-font-size, 0.75rem);
  font-weight: 600;
  letter-spacing: 0.05em;
  text-align: start;
  text-transform: uppercase;
  cursor: pointer;
}

.cui-sidebar-group__label {
  flex: 1;
  min-width: 0;
}

/* Right when shut, down when open: a quarter turn, a transform on its own element. */
.cui-sidebar-group__chevron {
  flex-shrink: 0;
  transition: transform var(--cui-duration-slow) var(--cui-ease-in-out);
}

.cui-sidebar-group--open .cui-sidebar-group__chevron {
  transform: rotate(90deg);
}

/* Collapsed by grid-template-rows (0fr -> 1fr), so no height is measured. Once shut the
   panel is hidden (until-found) or inert (see useCollapsible): nothing inside stays focusable. */
.cui-sidebar-group__panel {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--cui-duration-slow) var(--cui-ease-out);
}

.cui-sidebar-group--open > .cui-sidebar-group__panel {
  grid-template-rows: 1fr;
}

.cui-sidebar-group__panel[data-instant] {
  transition: none;
}

.cui-sidebar-group__panel[inert] {
  visibility: hidden;
}

.cui-sidebar-group__clip {
  min-height: 0;
  overflow: hidden;
}

/* Indented, with a thin guide rule down the left of the links. */
.cui-sidebar-group__content {
  margin-inline-start: 0.875rem;
  padding-inline-start: 0.375rem;
}

/* The links (a CuiList's rows) keep a transparent border, so the current page's border
   takes no room, and a subtle raised fill marks it: never the solid primary colour. */
.cui-sidebar-group :deep(.cui-list-item__row) {
  border: 1px solid transparent;
  border-radius: var(--cui-sidebar-radius, var(--cui-radius-md, 0.375rem));
}

.cui-sidebar-group :deep(.cui-list-item__row[aria-current="page"]) {
  border-color: var(--cui-sidebar-pressed-border, var(--cui-border));
  background: var(--cui-sidebar-pressed-bg, var(--cui-surface-bg));
  color: var(--cui-sidebar-pressed-color, var(--cui-text-emphasis));
}
</style>
