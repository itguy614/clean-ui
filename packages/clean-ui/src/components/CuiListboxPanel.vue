<script setup lang="ts">
import { computed, nextTick, onScopeDispose, ref, watch } from "vue";
import { computeDropdownPosition } from "../utils/position";
import { useEventListener } from "../composables/useEventListener";

/**
 * The teleported option panel shared by CuiCombobox and CuiTagInput (#137). Internal —
 * not exported, not registered.
 *
 * It owns what the two had copied: the teleport, anchoring to the field
 * (`computeDropdownPosition` with `matchWidth`, #204), repositioning while open, and the
 * panel's paint. Its rows are CuiListboxOption; each component keeps its own input,
 * selection logic and row content.
 *
 * The public tokens stay per component (`--cui-combobox-panel-bg`,
 * `--cui-tag-input-item-padding`, …): `tokenPrefix` names the set, and the panel maps each
 * onto a private `--_listbox-*` property, with the default written once here. The
 * component's own class still goes on the panel (`cui-combobox__dropdown`), so consumer CSS
 * aimed at it still matches.
 */
defineOptions({ inheritAttrs: false });

const props = defineProps<{
  open: boolean;
  /**
   * What the panel anchors to and matches the width of: the field's control, not its
   * wrapper — the wrapper also holds the label above and the error below, and anchoring to
   * it left a label-sized gap.
   */
  anchor: HTMLElement | null | undefined;
  /** The component whose public tokens style the panel. */
  tokenPrefix: "combobox" | "tag-input";
  /** Upper bound for the panel's height, in px. */
  maxHeight: number;
  /**
   * Size-derived defaults for the rows. The panel is teleported to <body>, so it inherits
   * nothing from the component and has to carry them itself (#123).
   */
  fontSize: string;
  itemPadding: string;
}>();

const el = ref<HTMLElement | null>(null);
const position = ref<Record<string, string>>({});

function reposition() {
  if (props.anchor) position.value = computeDropdownPosition(props.anchor, "bottom", { matchWidth: true, maxHeight: props.maxHeight }).styles;
}

// Placed before it renders, so no frame shows at the wrong spot; and again after, since
// the field can change height as the panel opens (chips render, the query replaces the
// display text).
watch(
  () => props.open,
  (open) => {
    if (!open) return;
    reposition();
    nextTick(reposition);
  },
  { immediate: true },
);

// Page scroll and resize move the field; at most once a frame. A scroll inside the panel
// (the list itself, or scrollIntoView from the arrow keys) moves nothing.
let frame = 0;
useEventListener(
  "window",
  ["scroll", "resize"],
  (e) => {
    if (e.target instanceof Node && el.value?.contains(e.target)) return;
    if (!frame) frame = requestAnimationFrame(() => ((frame = 0), reposition()));
  },
  { enabled: () => props.open, capture: true },
);
onScopeDispose(() => cancelAnimationFrame(frame));

const tokens = computed(() => {
  const p = props.tokenPrefix;
  const token = (slot: string, fallback: string) => `var(--cui-${p}-${slot}, ${fallback})`;
  return {
    "--_listbox-panel-bg": token("panel-bg", "var(--cui-surface-base)"),
    "--_listbox-panel-border": token("panel-border", "1px solid var(--cui-border)"),
    "--_listbox-panel-radius": token("panel-radius", "0.5rem"),
    "--_listbox-panel-shadow": token("panel-shadow", "0 8px 24px -4px rgba(0, 0, 0, 0.12), 0 2px 8px -2px rgba(0, 0, 0, 0.08)"),
    "--_listbox-panel-padding": token("panel-padding", "calc(0.25rem * var(--cui-density-scale, 1))"),
    "--_listbox-font-size": token("font-size", props.fontSize),
    "--_listbox-item-padding": token("item-padding", props.itemPadding),
    "--_listbox-item-color": token("item-color", "var(--cui-text-body)"),
    "--_listbox-item-radius": token("item-radius", "0.25rem"),
    "--_listbox-item-selected-bg": token("item-selected-bg", "color-mix(in srgb, var(--cui-primary-bg) 50%, transparent)"),
    "--_listbox-item-focus-bg": token("item-focus-bg", "var(--cui-primary-bg)"),
    "--_listbox-item-disabled-color": token("item-disabled-color", "var(--cui-text-tertiary)"),
  };
});

// One object, changing only with the tokens or the position: the rows render inside this
// panel, so every arrow key re-renders it, and a fresh style object would re-apply every
// property each time.
const style = computed(() => ({ ...tokens.value, ...position.value }));

defineExpose({ el });
</script>

<template>
  <Teleport to="body">
    <div v-if="open" ref="el" v-bind="$attrs" class="cui-listbox-panel" :style="style">
      <slot />
    </div>
  </Teleport>
</template>

<style scoped>
/* --- Themeable: zero specificity, so a consumer's own rule wins (see CuiButton.vue) --- */
:where(.cui-listbox-panel) {
  background: var(--_listbox-panel-bg);
  border: var(--_listbox-panel-border);
  border-radius: var(--_listbox-panel-radius);
  box-shadow: var(--_listbox-panel-shadow);
  padding: var(--_listbox-panel-padding);
}

/* --- Structural --- */
.cui-listbox-panel {
  overflow-y: auto;
}
</style>
