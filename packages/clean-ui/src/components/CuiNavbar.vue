<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from "vue";
import CuiButton from "./CuiButton.vue";
import CuiIcon from "./CuiIcon.vue";
import { useCollapseToDrawer, type CuiCollapseBelow } from "../composables/useCollapseToDrawer";
import { useEventListener } from "../composables/useEventListener";
import { __DEV__, warnOnce } from "../utils/devWarn";
// Module-scoped: the bundler replaces `process.env.NODE_ENV`, and Node's types stay out of the build.
declare const process: { env: { NODE_ENV?: string } };
import { useMessages } from "../composables/useMessages";
import type { HideableProps } from "../types/common";
import { useNavbarProvider } from "./navbar-context";
import { IconList } from "../icons/generated/list";

export interface CuiNavbarProps extends HideableProps {
  /**
   * The accessible name of the `<nav>` landmark inside the header. A page with a navbar and a
   * sidebar has two navigations, and they must be told apart. Defaults to the catalogue's "Main".
   */
  label?: string;
  /**
   * The viewport below which the navigation (CuiNavbarNav) leaves the bar for a
   * `CuiSlideover`, behind a menu button: a Tailwind breakpoint, or `never` to keep it in the
   * bar at every width. Brand and actions always stay in the bar.
   */
  collapseBelow?: CuiCollapseBelow;
  /**
   * Stick to the top of the page. Once the page has scrolled it gains a border and a shadow,
   * and the bar sets `--cui-navbar-height` on the document and a `scroll-padding-top` to match,
   * so a focused element is never left under it (WCAG 2.4.11). Off by default.
   */
  sticky?: boolean;
  /**
   * A frosted bar: the background is `--cui-navbar-bg` at about 80% over a blur
   * (`--cui-navbar-blur`), so the page scrolling under a sticky bar shows through. Only
   * meaningful with `sticky`; without it the bar stays solid. Off by default: the solid bar is
   * the most legible. It goes solid again where `backdrop-filter` is unsupported, under
   * `prefers-reduced-transparency` and in forced-colors mode. Text contrast over scrolling
   * content is not covered by the library's contrast audit: check yours.
   */
  translucent?: boolean;
  /**
   * Show the menu button that opens the drawer while collapsed. Turn it off to open the drawer
   * from your own button through `v-model:open`.
   */
  toggle?: boolean;
}

const props = withDefaults(defineProps<CuiNavbarProps>(), {
  collapseBelow: "lg",
  sticky: false,
  translucent: false,
  toggle: true,
  hidden: false,
});

// `translucent` is the frost of a bar that sticks: alone it changes nothing, so say so.
if (__DEV__ && process.env.NODE_ENV !== "production" && props.translucent && !props.sticky) {
  warnOnce("[clean-ui] CuiNavbar: `translucent` only has an effect together with `sticky`; the bar stays solid.");
}

/** Whether the drawer is open (`v-model:open`). Only meaningful while collapsed. */
const openModel = defineModel<boolean>("open");

const messages = useMessages();
const { collapsed, open, drawerId, toggle: toggleDrawer, close, toggleAttrs } = useCollapseToDrawer({
  collapseBelow: () => props.collapseBelow,
  open: openModel,
});

// How many CuiNavbarNav are mounted: the menu button has something to open only with one.
const navs = ref(0);

useNavbarProvider({
  collapsed,
  open,
  drawerId,
  label: computed(() => props.label ?? messages.value.navigation?.navbar ?? "Main"),
  drawerName: computed(() => toggleAttrs.value["aria-label"]),
  close,
  registerNav() {
    navs.value++;
    return () => {
      navs.value--;
    };
  },
});

const showToggle = computed(() => props.toggle && collapsed.value && navs.value > 0);

// --- Sticky ---
const elRef = useTemplateRef<HTMLElement>("rootEl");
const scrolled = ref(false);
useEventListener("window", "scroll", () => (scrolled.value = window.scrollY > 0), { enabled: () => props.sticky });

// The bar's height is published for what must clear it: a sticky CuiSidebar (`top`) and the
// page's own focus targets (`scroll-padding-top`). Both go on the document element, since the
// things that read them are not inside this bar. What was there is put back afterwards.
const root = () => document.documentElement;
let observer: ResizeObserver | undefined;
let saved: { height: string; padding: string } | undefined;

function publish() {
  const el = elRef.value;
  if (el) root().style.setProperty("--cui-navbar-height", `${el.offsetHeight}px`);
}

function track(on: boolean) {
  observer?.disconnect();
  observer = undefined;
  if (!on) {
    if (saved) {
      if (saved.height) root().style.setProperty("--cui-navbar-height", saved.height);
      else root().style.removeProperty("--cui-navbar-height");
      root().style.scrollPaddingTop = saved.padding;
      saved = undefined;
    }
    return;
  }
  scrolled.value = window.scrollY > 0;
  saved ??= { height: root().style.getPropertyValue("--cui-navbar-height"), padding: root().style.scrollPaddingTop };
  root().style.scrollPaddingTop = "var(--cui-navbar-height, 0px)";
  publish();
  if (typeof ResizeObserver !== "undefined" && elRef.value) {
    observer = new ResizeObserver(publish);
    observer.observe(elRef.value);
  }
}

onMounted(() => {
  scrolled.value = window.scrollY > 0;
  watch(() => props.sticky, track, { immediate: true });
});
onBeforeUnmount(() => track(false));

// `toggleAttrs` (aria-expanded, aria-controls, the catalogue's menu name) lets a button of your
// own drive the drawer with the library's labelling: `v-bind` it on the button.
defineExpose({ el: elRef, open, toggle: toggleDrawer, toggleAttrs });
</script>

<template>
  <header
    v-show="!hidden"
    ref="rootEl"
    class="cui-navbar"
    :class="{ 'cui-navbar--sticky': sticky, 'cui-navbar--scrolled': sticky && scrolled, 'cui-navbar--translucent': sticky && translucent }"
  >
    <CuiButton v-if="showToggle" class="cui-navbar__toggle" variant="ghost" size="sm" v-bind="toggleAttrs" @click="toggleDrawer">
      <template #prefix><CuiIcon :icon="IconList" size="1.25rem" /></template>
    </CuiButton>
    <slot />
  </header>
</template>

<style scoped>
/* --- Themeable --- Whole-:where() rules, so a plain consumer rule or a container token wins. */
:where(.cui-navbar) {
  gap: var(--cui-navbar-gap, 0.75rem);
  padding: calc(0.5rem * var(--cui-density-scale, 1)) var(--cui-navbar-px, 1.5rem);
  background: var(--cui-navbar-bg, var(--cui-surface-base));
  border-bottom: 1px solid var(--cui-navbar-border, var(--cui-border));
  color: var(--cui-text-body);
  --_navbar-blur: 8px;
}

/* A frosted bar (translucent + sticky): the tint is the background mixed with transparent, the
   blur sits on the backdrop. The blur reads the public token over a private default. */
:where(.cui-navbar--translucent) {
  background: color-mix(in srgb, var(--cui-navbar-bg, var(--cui-surface-base)) 80%, transparent);
  -webkit-backdrop-filter: blur(var(--cui-navbar-blur, var(--_navbar-blur)));
  backdrop-filter: blur(var(--cui-navbar-blur, var(--_navbar-blur)));
}

/* Solid again where a frosted bar can't be drawn or isn't wanted. */
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  :where(.cui-navbar--translucent) {
    background: var(--cui-navbar-bg, var(--cui-surface-base));
  }
}

@media (prefers-reduced-transparency: reduce), (forced-colors: active) {
  :where(.cui-navbar--translucent) {
    background: var(--cui-navbar-bg, var(--cui-surface-base));
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}

/* A bar that sticks keeps its border for when the page has moved under it. */
:where(.cui-navbar--sticky:not(.cui-navbar--scrolled)) {
  border-bottom-color: transparent;
}

/* --- Structural --- */
.cui-navbar {
  position: relative;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  min-width: 0;
}

.cui-navbar--sticky {
  position: sticky;
  top: 0;
  /* Just under the overlays (modals, panels), above the page. */
  z-index: calc(var(--cui-z-overlay, 9990) - 1);
}

/* The shadow is drawn once and faded in: an opacity change, not a repainted box-shadow. */
.cui-navbar--sticky::after {
  content: "";
  position: absolute;
  inset-inline: 0;
  top: 100%;
  height: 0;
  box-shadow: var(--cui-shadow-sm);
  pointer-events: none;
  opacity: 0;
  transition: opacity var(--cui-duration-fast) var(--cui-ease-out);
}

.cui-navbar--scrolled::after {
  opacity: 1;
}
</style>
