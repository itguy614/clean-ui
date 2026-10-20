<script setup lang="ts">
/**
 * One option row inside CuiListboxPanel (#137). Internal — not exported, not registered.
 *
 * The rows' markup differs per component (a create row, a check mark, an `#option` slot),
 * so the content is a slot; what every row shares lives here once: the state classes, the
 * index the keyboard handling scrolls to, and select/hover. The listbox ARIA — role,
 * id, aria-selected — goes here too, in #205. A component's own row classes
 * (`cui-combobox__option--focused`, …) fall through onto the root, so consumer CSS aimed at
 * them still matches.
 */
const props = defineProps<{
  index: number;
  /** The keyboard-highlighted row. */
  active?: boolean;
  selected?: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{ select: []; hover: [] }>();

function onClick() {
  if (!props.disabled) emit("select");
}
</script>

<template>
  <div
    class="cui-listbox-option"
    :class="{
      'cui-listbox-option--active': active,
      'cui-listbox-option--selected': selected,
      'cui-listbox-option--disabled': disabled,
    }"
    :data-index="index"
    @click.stop="onClick"
    @mouseenter="emit('hover')"
  >
    <slot />
  </div>
</template>

<style scoped>
/* --- Themeable: zero specificity, so a consumer's own rule wins (see CuiButton.vue). The
   --_listbox-* values come from the panel, mapped from the component's public tokens. --- */
:where(.cui-listbox-option) {
  padding: var(--_listbox-item-padding);
  font-size: var(--_listbox-font-size);
  color: var(--_listbox-item-color);
  border-radius: var(--_listbox-item-radius);
}

:where(.cui-listbox-option--selected) {
  background: var(--_listbox-item-selected-bg);
}

:where(.cui-listbox-option--active) {
  background: var(--_listbox-item-focus-bg);
}

:where(.cui-listbox-option--disabled) {
  color: var(--_listbox-item-disabled-color);
}

/* --- Structural --- */
.cui-listbox-option {
  display: flex;
  align-items: center;
  gap: calc(0.5rem * var(--cui-density-scale, 1));
  cursor: pointer;
  transition: background 0.1s ease;
}

.cui-listbox-option--disabled {
  cursor: default;
  opacity: 0.5;
}
</style>
