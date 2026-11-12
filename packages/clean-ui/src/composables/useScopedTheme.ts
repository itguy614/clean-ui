import {
  getCurrentInstance,
  inject,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  watch,
  type ComponentInternalInstance,
  type InjectionKey,
  type Ref,
} from "vue";
// Not from ./useTheme: that module is the composable, which an overlay-only page must not
// bundle (#463).
import { THEME_CLASS_PREFIX as CLASS_PREFIX } from "../ssr-constants";
import { DARK_CLASS } from "./useColorScheme";

/**
 * The scoped theme around a teleporting component (#418). Internal.
 *
 * A panel teleported to `<body>` leaves the subtree it was opened from, so a
 * `<div class="cui-theme-violet">` or a scoped `<div class="dark">` around the component no
 * longer reaches it: since #329 the semantic tokens resolve on the theme scope, and the
 * panel rendered in the page's theme. This reads the nearest `cui-theme-*` class and any
 * `dark` class around the component's in-place anchor (the element, comment or text node
 * that stays where the component is used), for the component to put on the root it
 * teleports.
 *
 * - **Only below `<body>`.** A theme or `dark` on `<html>` or `<body>` already reaches the
 *   panel, so it isn't copied.
 * - **Live while `active`.** A MutationObserver watches the class attribute of every element
 *   in the chain, so changing the theme or toggling `dark` on the scope while a panel is open
 *   repaints it. Pass `active` (the panel's presence), so a closed panel observes nothing.
 * - **Nested.** A panel opened from inside another teleported panel finds the outer one's
 *   copied classes on its way up. An app mounted outside the host's tree continues the walk
 *   from the host component through `useCleanUIContext().provideTo()` (`ThemeScopeKey`).
 *
 * Only these classes carry: a token override on a container (`.brand { --cui-primary: … }`)
 * or a scoped density setting does not reach a teleported panel.
 */
export function useScopedTheme(active: () => boolean): Readonly<Ref<string[]>> {
  const instance = getCurrentInstance();
  const outer = inject(ThemeScopeKey, null);
  const classes = shallowRef<string[]>([]);
  let observer: MutationObserver | null = null;

  function stop() {
    observer?.disconnect();
    observer = null;
  }

  function start() {
    stop();
    const chain = componentScopeChain(instance, outer);
    const read = () => {
      const next = scopedThemeClasses(chain);
      const now = classes.value;
      if (next.length !== now.length || next.some((name, i) => name !== now[i])) classes.value = next;
    };
    read();
    if (!chain.length) return;
    observer = new MutationObserver(read);
    for (const el of chain) observer.observe(el, { attributes: true, attributeFilter: ["class"] });
  }

  // After mount, so the anchor is in the document; never on the server.
  onMounted(() => {
    watch(active, (on) => (on ? start() : stop()), { immediate: true });
  });
  onBeforeUnmount(stop);
  return classes;
}

/**
 * Provided by `useCleanUIContext().provideTo()`: the elements whose classes scope the host
 * component, nearest first, for an app it mounts outside its own tree (#418).
 */
export const ThemeScopeKey: InjectionKey<() => Element[]> = Symbol("CuiThemeScope");

/**
 * The component's in-place anchor and its ancestors below `<body>`, nearest first, then
 * `outer`'s chain: a component in an app mounted outside the host's tree continues from the
 * host. The anchor is `$el`: the root element, or the placeholder a `<Teleport>` or fragment
 * root leaves where the component is used.
 */
export function componentScopeChain(
  instance: ComponentInternalInstance | null,
  outer: (() => Element[]) | null,
): Element[] {
  const chain: Element[] = [];
  const start = (instance?.proxy?.$el as Node | null) ?? null;
  let el = start instanceof Element ? start : (start?.parentElement ?? null);
  for (; el && el !== el.ownerDocument.body && el !== el.ownerDocument.documentElement; el = el.parentElement) {
    chain.push(el);
  }
  return outer ? chain.concat(outer()) : chain;
}

/** The nearest `cui-theme-*` class in `chain`, and `dark` if any element in it is dark. */
function scopedThemeClasses(chain: Element[]): string[] {
  let theme: string | undefined;
  let dark = false;
  for (const el of chain) {
    if (theme === undefined) {
      for (const name of el.classList) {
        if (name.startsWith(CLASS_PREFIX)) {
          theme = name;
          break;
        }
      }
    }
    dark ||= el.classList.contains(DARK_CLASS);
    if (theme !== undefined && dark) break;
  }
  const out = theme === undefined ? [] : [theme];
  if (dark) out.push(DARK_CLASS);
  return out;
}
