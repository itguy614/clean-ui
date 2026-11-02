<script setup lang="ts">
import { computed, useAttrs, useTemplateRef, type Component, type ComponentPublicInstance } from "vue";
import { PhCaretRight } from "@phosphor-icons/vue";
import CuiIcon from "./CuiIcon.vue";
import type { DisableableProps, HideableProps } from "../types/common";
import { useListContext } from "./list-context";
import { disabledLink } from "../utils/disabled-link";

export interface CuiListItemProps extends HideableProps, DisableableProps {
  /** Primary line. Kept to one line, cut off with "…". */
  title?: string;
  /** Secondary line under the title. Kept to one line, cut off with "…". */
  subtitle?: string;
  /** Leading icon: a registered icon name or an icon component. The `#icon` slot replaces it. */
  icon?: string | Component;
  /** Show a trailing chevron, for a row that leads somewhere. The `#trailing` slot replaces it. */
  chevron?: boolean;
  /** Render the row as a link (`<a>`) to this URL. */
  href?: string;
  /** Render the row as a `<router-link>` to this route. */
  to?: string | object;
  /**
   * Render the row as this element instead, e.g. `label` around a control. `href` and `to`
   * take precedence. Without any of the three, a row with a `click` listener is a
   * `<button>` and one without is a plain `<div>`. An `as` element other than `button` is not
   * made focusable: give it a focusable control, or use a click listener without `as`.
   */
  as?: string;
  /**
   * The `click` listener (`@click`). Declared as a prop rather than an emit so the item can
   * tell whether one is attached — that decides whether a plain row is a `<button>`. Not
   * called while disabled.
   */
  onClick?: (event: MouseEvent) => void;
}

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<CuiListItemProps>(), {
  hidden: false,
  disabled: false,
  chevron: false,
});

const list = useListContext();
const attrs = useAttrs();

/**
 * The row's element. A disabled link drops its target (`disabledLink`, shared with
 * CuiButton — #422) rather than staying a link that still navigates under an
 * `aria-disabled` it ignores.
 */
const row = computed((): { is: string; interactive: boolean; attrs: Record<string, unknown> } => {
  const link = disabledLink(props, props.disabled);
  if (link) return { ...link, interactive: false };
  if (props.to) return { is: "router-link", interactive: true, attrs: { to: props.to } };
  if (props.href) return { is: "a", interactive: true, attrs: { href: props.href } };
  // A button row, whether chosen by a click listener or asked for with `as="button"`: never a
  // form's submit button, and natively disabled.
  if ((!props.as && props.onClick) || props.as === "button") {
    return {
      is: "button",
      interactive: !props.disabled,
      attrs: props.disabled ? { type: "button", disabled: "" } : { type: "button" },
    };
  }
  // Any other element renders as asked. With a click listener it gets the hover fill — a
  // `label` round a control, say, whose control is the focusable part. A disabled one is only
  // dimmed: `aria-disabled` is not allowed on a generic element, so it would announce nothing.
  return { is: props.as ?? "div", interactive: Boolean(props.onClick) && !props.disabled, attrs: {} };
});

/**
 * Fallthrough attributes other than `class` and `style`, which stay on the item. The rest —
 * `aria-current`, `target`, `data-*` — belong on the element a user actually reaches. Read
 * during render: `attrs` isn't reactive, but a change to it re-renders this component.
 *
 * The consumer's attributes come last, so they win over the defaults above. While disabled,
 * any click listener that bypassed the `onClick` prop (`@click.once` compiles to
 * `onClickOnce`) is dropped, so nothing fires on a disabled row.
 */
function rowAttrs() {
  const { class: _class, style: _style, ...rest } = attrs;
  if (props.disabled) {
    for (const key of Object.keys(rest)) if (/^onClick/.test(key)) delete rest[key];
  }
  return { ...row.value.attrs, ...rest };
}

function onRowClick(event: MouseEvent) {
  if (props.disabled) {
    event.preventDefault();
    return;
  }
  props.onClick?.(event);
}

/** CuiIcon takes a name and a component as separate props. */
const iconProps = computed(() => (typeof props.icon === "string" ? { name: props.icon } : { icon: props.icon }));

const rowRef = useTemplateRef<HTMLElement | ComponentPublicInstance>("rowRef");
/** The row element itself — a `<router-link>` row's ref is the component, not its `<a>`. */
const el = computed<HTMLElement | undefined>(() => {
  const r = rowRef.value;
  // No `instanceof HTMLElement`: that global doesn't exist during server rendering.
  return r && "$el" in r ? (r.$el as HTMLElement) : (r ?? undefined);
});

function focus(opts?: FocusOptions) {
  el.value?.focus(opts);
}

function blur() {
  el.value?.blur();
}

defineExpose({ el, focus, blur });
</script>

<template>
  <!-- `v-if`, not the usual `v-show`: an item hidden with `display: none` would still be
       its list's `:first-child`/`:last-child`, and an inset list would round the wrong
       corners. -->
  <component
    :is="list.itemTag"
    v-if="!hidden"
    class="cui-list-item"
    :class="[
      attrs.class,
      {
        'cui-list-item--inset': list.variant === 'inset',
        'cui-list-item--divided': list.divided,
      },
    ]"
    :style="attrs.style"
  >
    <component
      :is="row.is"
      ref="rowRef"
      class="cui-list-item__row"
      :class="{
        'cui-list-item__row--interactive': row.interactive,
        'cui-list-item__row--disabled': disabled,
      }"
      v-bind="rowAttrs()"
      @click="onRowClick"
    >
      <span v-if="$slots.icon || icon" class="cui-list-item__icon">
        <slot name="icon">
          <CuiIcon v-bind="iconProps" />
        </slot>
      </span>

      <span class="cui-list-item__content">
        <slot>
          <span v-if="title" class="cui-list-item__title">{{ title }}</span>
          <span v-if="subtitle || $slots['subtitle-prefix']" class="cui-list-item__subtitle">
            <slot name="subtitle-prefix" />
            <span v-if="subtitle" class="cui-list-item__subtitle-text">{{ subtitle }}</span>
          </span>
        </slot>
      </span>

      <span v-if="$slots.trailing" class="cui-list-item__trailing">
        <slot name="trailing" />
      </span>
      <span v-else-if="chevron" class="cui-list-item__trailing cui-list-item__chevron" aria-hidden="true">
        <CuiIcon :icon="PhCaretRight" size="sm" />
      </span>
    </component>
  </component>
</template>

<style scoped>
/* --- Themeable ---
   Zero specificity, so a consumer's plain `.cui-list-item__row { … }` wins without
   `!important`; see the note in CuiButton.vue. The inset defaults read the card's public
   tokens, so an inset list matches the cards around it (#234). */
:where(.cui-list-item__row) {
  /* A `<button>` row loses its native chrome; the hover fill follows the item's corners. */
  border: 0;
  border-radius: inherit;
  background: none;
  gap: var(--cui-list-gap, calc(0.75rem * var(--cui-density-scale, 1)));
  padding: var(--cui-list-py, calc(0.75rem * var(--cui-density-scale, 1)))
    var(--cui-list-px, calc(1rem * var(--cui-density-scale, 1)));
  color: var(--cui-list-color, var(--cui-text-emphasis));
  font-size: var(--cui-list-font-size, 0.9375rem);
}

/* `--cui-text-body` holds 7:1 (AAA) against the list fill and the hover fill, in every theme
   and both modes: see the LIST section of scripts/contrast/clean-ui.mjs and list-subtitle-contrast.test.ts (#234). */
:where(.cui-list-item__subtitle) {
  color: var(--cui-list-subtitle-color, var(--cui-text-body));
  font-size: var(--cui-list-subtitle-font-size, 0.8125rem);
}

/* A row the keyboard crosses: the fill changes with no transition (see "Motion"). */
:where(.cui-list-item__row--interactive:hover) {
  background: var(--cui-list-hover-bg, var(--cui-surface-bg));
}

/* Pressed keeps the hover fill: the next neutral step, --cui-surface-dark-bg, takes the
   subtitle below 7:1 in dark mode. */
:where(.cui-list-item__row--interactive:active) {
  background: var(--cui-list-active-bg, var(--cui-list-hover-bg, var(--cui-surface-bg)));
}

:where(.cui-list-item__row:focus-visible) {
  outline: 2px solid var(--cui-list-focus-ring, var(--cui-primary-focus-ring));
  outline-offset: -2px;
}

:where(.cui-list-item__chevron) {
  color: var(--cui-text-tertiary);
}

/* A plain row's hover fill is square unless the list sets `rounded`. */
:where(.cui-list-item) {
  border-radius: var(--cui-list-radius, var(--_list-radius, 0px));
}

:where(.cui-list-item--inset) {
  background: var(--cui-list-bg, var(--cui-card-bg, var(--cui-surface-base)));
  border: var(--cui-list-border, var(--cui-card-border, 1px solid var(--cui-border)));
  border-radius: 0;
  --_list-corner: var(--cui-list-radius, var(--_list-radius, var(--cui-card-radius, var(--cui-radius-lg, 0.5rem))));
}

/* Position-dependent corners: the first item rounds its top, the last its bottom, and a lone
   item, being both, all four. */
:where(.cui-list-item--inset:first-child) {
  border-start-start-radius: var(--_list-corner);
  border-start-end-radius: var(--_list-corner);
}

:where(.cui-list-item--inset:last-child) {
  border-end-start-radius: var(--_list-corner);
  border-end-end-radius: var(--_list-corner);
}

/* --- Structural --- */
.cui-list-item {
  position: relative;
  min-width: 0;
  /* Keeps the row's z-index inside the item, not competing with the page. */
  isolation: isolate;
}

/* Rows meet at a divider, never at two borders. */
.cui-list-item--inset:not(:first-child) {
  border-top-width: 0;
}

.cui-list-item--inset:not(:last-child) {
  border-bottom-width: 0;
}

/* A pseudo-element, not an element: a divider in the markup would be one more list item to a
   screen reader ("list, 19 items" for 10 rows). Inset to the row padding, so it lines up with
   the icon and the chevron. */
.cui-list-item--divided:not(:first-child)::before {
  content: "";
  position: absolute;
  top: 0;
  inset-inline: var(--cui-list-px, calc(1rem * var(--cui-density-scale, 1)));
  border-top: 1px solid var(--cui-list-divider-color, var(--cui-border));
  pointer-events: none;
  /* Above the row, so a hovered or pressed row keeps the line above it. */
  z-index: 2;
}

.cui-list-item__row {
  display: flex;
  align-items: center;
  width: 100%;
  margin: 0;
  /* Stacked so the divider (z-index 2) draws over a hover fill, and the inset focus ring
     (below) over the divider rather than being crossed by it. */
  position: relative;
  z-index: 1;
  font: inherit;
  text-align: start;
  text-decoration: none;
  cursor: default;
}

.cui-list-item__row--interactive {
  cursor: pointer;
}

.cui-list-item__row:focus-visible {
  z-index: 3;
}

.cui-list-item__row--disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.cui-list-item__icon,
.cui-list-item__trailing {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
}

.cui-list-item__content {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.cui-list-item__title {
  font-weight: 500;
}

.cui-list-item__title,
.cui-list-item__subtitle-text {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.cui-list-item__subtitle {
  display: flex;
  align-items: center;
  gap: calc(0.375rem * var(--cui-density-scale, 1));
  min-width: 0;
}

/* The chevron points along the reading direction. */
.cui-list-item__chevron:dir(rtl) {
  transform: scaleX(-1);
}
</style>
