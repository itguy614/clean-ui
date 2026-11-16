<script setup lang="ts">
import { computed, useAttrs, useSlots, type Component } from "vue";
import CuiIcon from "./CuiIcon.vue";
import type { DisableableProps, HideableProps } from "../types/common";
import { disabledLink } from "../utils/disabled-link";
import { __DEV__, warnOnce } from "../utils/devWarn";
// Module-scoped: the bundler replaces `process.env.NODE_ENV`, and Node's types stay out of the build.
declare const process: { env: { NODE_ENV?: string } };
import { useNavbarContext } from "./navbar-context";

export interface CuiNavbarLinkProps extends HideableProps, DisableableProps {
  /** Render the link as a `<router-link>` to this route. */
  to?: string | object;
  /** Render the link as an `<a>` to this URL. `to` takes precedence. */
  href?: string;
  /** Leading icon: a registered icon name or an icon component. Decorative: hidden from assistive technology. */
  icon?: string | Component;
  /**
   * Mark this the current page (`aria-current="page"`), or, `false`, not. Left unset, the
   * mark comes from the router link when it is exactly active, as for a plain link.
   */
  active?: boolean;
}

/**
 * A navigation link with an icon and a trailing suffix, for a CuiNavbarNav or a CuiNavbarMenu.
 * One element in every presentation: the bar (a horizontal link), the drawer and a menu's
 * group (a row, the suffix pushed to the end) and the dropdown panel, where the menu gives it
 * `role="menuitem"`. Which is down to where it sits, not to anything it reads, so the nav is
 * still written once. A plain `<a>` works beside it, unchanged.
 */
defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<CuiNavbarLinkProps>(), {
  hidden: false,
  disabled: false,
  // `undefined`, not Vue's boolean `false`: "not given" (the router decides) is not "not current".
  active: undefined,
});

// Fails clearly outside a CuiNavbar.
useNavbarContext();

const slots = useSlots();
const attrs = useAttrs();

// An icon-only link has no text for a screen reader: it needs a name of its own.
if (__DEV__ && process.env.NODE_ENV !== "production" && !slots.default && !attrs["aria-label"] && !attrs["aria-labelledby"]) {
  warnOnce("[clean-ui] CuiNavbarLink: a link with no label needs an accessible name. Pass `aria-label` (or `aria-labelledby`), or give it a default slot.");
}

// A link with no target is a dead `<a>`: not focusable, styled as clickable.
if (__DEV__ && process.env.NODE_ENV !== "production" && !props.to && !props.href && !props.disabled) {
  warnOnce("[clean-ui] CuiNavbarLink: pass `to` (a route) or `href` (a URL), or the link goes nowhere and cannot take focus.");
}

/**
 * The element and its attributes. A disabled link drops its target (`disabledLink`, shared
 * with CuiButton and CuiListItem) rather than staying a link that still navigates. `aria-current`
 * is only set when `active` is given, so an unset one leaves the router's own mark alone.
 */
const link = computed(() => {
  const disabledAs = disabledLink(props, props.disabled);
  const base: Record<string, unknown> = disabledAs
    ? { ...disabledAs.attrs }
    : props.to
      ? { to: props.to }
      : { href: props.href };
  if (props.active !== undefined) base["aria-current"] = props.active ? "page" : "false";
  return { is: disabledAs ? "a" : props.to ? "router-link" : "a", attrs: base };
});

/**
 * The consumer's attributes (`aria-label`, `target`, `@click`). While disabled, their click
 * listeners are dropped (`@click.once` compiles to `onClickOnce`), so nothing fires on a link
 * that does nothing. Read during render: `attrs` isn't reactive, but a change re-renders this.
 */
function boundAttrs() {
  const rest = { ...attrs };
  if (props.disabled) for (const key of Object.keys(rest)) if (/^onClick/.test(key)) delete rest[key];
  return rest;
}

function onClick(event: MouseEvent) {
  // An `<a>` without `href` still fires click: hold it back, so nothing follows a disabled link.
  if (props.disabled) event.preventDefault();
}

/** CuiIcon takes a name and a component as separate props. */
const iconProps = computed(() => (typeof props.icon === "string" ? { name: props.icon } : { icon: props.icon }));
</script>

<template>
  <component
    :is="link.is"
    v-bind="{ ...boundAttrs(), ...link.attrs }"
    v-show="!hidden"
    class="cui-navbar-link"
    :class="{ 'cui-navbar-link--disabled': disabled }"
    @click="onClick"
  >
    <span v-if="icon" class="cui-navbar-link__icon"><CuiIcon v-bind="iconProps" size="1.125rem" aria-hidden="true" /></span>
    <span v-if="$slots.default" class="cui-navbar-link__label"><slot /></span>
    <span v-if="$slots.suffix" class="cui-navbar-link__suffix"><slot name="suffix" /></span>
  </component>
</template>

<style scoped>
/* --- Themeable --- Whole-:where() rules, so a plain consumer rule or a container token wins.
   The same tokens as the nav's plain links, so the two read as one set. A current page is
   raised, never filled with the primary. */
:where(.cui-navbar-link) {
  gap: var(--cui-navbar-link-gap, 0.5rem);
  padding: calc(0.375rem * var(--cui-density-scale, 1)) 0.625rem;
  border: 1px solid transparent;
  border-radius: var(--cui-navbar-radius, var(--cui-radius-md, 0.375rem));
  color: var(--cui-navbar-color, var(--_navbar-link-color, var(--cui-text-secondary)));
  font-size: var(--cui-navbar-font-size, 0.875rem);
}

/* The keyboard crosses these rows, so the fill changes with no transition (see "Motion"). */
:where(.cui-navbar-link:not(.cui-navbar-link--disabled):hover) {
  background: var(--cui-navbar-hover-bg, var(--cui-surface-bg));
  color: var(--cui-navbar-hover-color, var(--cui-text-emphasis));
}

:where(.cui-navbar-link[aria-current="page"]) {
  border-color: var(--cui-navbar-pressed-border, var(--cui-border));
  background: var(--cui-navbar-pressed-bg, var(--cui-surface-bg));
  color: var(--cui-navbar-pressed-color, var(--cui-text-emphasis));
}

:where(.cui-navbar-link:focus-visible) {
  outline: 2px solid var(--cui-navbar-focus-ring, var(--cui-primary-focus-ring));
  outline-offset: -2px;
}

/* --- Structural --- */
.cui-navbar-link {
  display: inline-flex;
  align-items: center;
  box-sizing: border-box;
  line-height: inherit;
  text-decoration: none;
  cursor: pointer;
}

.cui-navbar-link--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.cui-navbar-link__icon,
.cui-navbar-link__suffix {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
}

.cui-navbar-link__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* In a row (the drawer, a menu) the suffix sits at the end. */
.cui-navbar-link__suffix {
  margin-inline-start: auto;
}
</style>
