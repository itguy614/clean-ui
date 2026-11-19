<script setup lang="ts">
/**
 * A labelled section inside CuiListboxPanel (#445). Internal — not exported, not registered.
 *
 * With a `label` it is a `role="group"` named by its heading (`aria-labelledby` on the
 * group, the id on the heading). The heading is not an option: it takes no id from
 * useListbox, is never highlighted and is skipped by the arrow keys, because navigation counts
 * options only. Without a `label` it is a presentational wrapper that adds no box
 * (`display: contents`), so a list can mix ungrouped options with groups and render both
 * through the same element.
 *
 * Painted from the owning component's `--cui-<prefix>-group-*` tokens, which the panel maps
 * onto `--_listbox-group-*`.
 */
defineProps<{
  /** The heading text. Omit for options that belong to no group. */
  label?: string;
  /** The heading's id, for `aria-labelledby`. Required with a label. */
  labelId?: string;
}>();
</script>

<template>
  <div
    class="cui-listbox-group"
    :class="{ 'cui-listbox-group--bare': !label }"
    :role="label ? 'group' : 'presentation'"
    :aria-labelledby="label ? labelId : undefined"
  >
    <div v-if="label" :id="labelId" class="cui-listbox-group__label">{{ label }}</div>
    <slot />
  </div>
</template>

<style scoped>
/* --- Themeable: zero specificity, so a consumer's own rule wins (see CuiButton.vue) --- */
:where(.cui-listbox-group__label) {
  padding: var(--_listbox-group-padding);
  font-size: var(--_listbox-group-font-size);
  color: var(--_listbox-group-color);
}

/* --- Structural --- */
.cui-listbox-group--bare {
  display: contents;
}

.cui-listbox-group__label {
  font-weight: 600;
  line-height: inherit;
  /* Small caps-style label, so a heading never reads as another option. */
  text-transform: uppercase;
  letter-spacing: 0.06em;
  cursor: default;
}

/* A hairline between groups: every labelled group after the first. */
.cui-listbox-group:not(.cui-listbox-group--bare):not(:first-child) > .cui-listbox-group__label {
  margin-top: 0.25rem;
  border-top: 1px solid var(--cui-border);
}
</style>
