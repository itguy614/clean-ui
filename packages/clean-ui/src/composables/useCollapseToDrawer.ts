import { computed, onMounted, ref, watch, type ComputedRef, type Ref } from "vue";
import type { TailwindBreakpoint } from "../types/grid";
import { useBreakpoint, BREAKPOINTS } from "./useBreakpoint";
import { useCuiId } from "./useCuiId";
import { useMessages } from "./useMessages";

/**
 * The viewport below which a navigation collapses into a `CuiSlideover`: a Tailwind
 * breakpoint, or `never` to keep it inline at every width (a sidebar nested in a container
 * or a drawer of its own).
 */
export type CuiCollapseBelow = TailwindBreakpoint | "never";

export interface CollapseToDrawerOptions {
  /** Where it collapses. A getter, so a changed prop is followed. */
  collapseBelow: () => CuiCollapseBelow;
  /** The drawer's visibility: pass the `v-model:open` ref, or leave it out for local state. */
  open?: Ref<boolean | undefined>;
}

export interface CollapseToDrawer {
  /** True while the viewport is below the breakpoint: the content belongs in the drawer. */
  collapsed: ComputedRef<boolean>;
  /** Whether the drawer is open. Only ever true while `collapsed`. */
  open: Ref<boolean>;
  /** The id to put on the drawer's panel, which the toggle's `aria-controls` names. */
  drawerId: string;
  toggle: () => void;
  close: () => void;
  /**
   * `aria-expanded`, `aria-controls` and an accessible name for the button that opens the
   * drawer. The name is constant (the state is `aria-expanded`'s to announce) and comes from
   * the catalogue, so `CuiConfigProvider` translates it.
   */
  toggleAttrs: ComputedRef<{ "aria-expanded": boolean; "aria-controls": string; "aria-label": string }>;
}

/**
 * The one mechanism by which a navigation moves into a `CuiSlideover` on a narrow viewport
 * (CuiSidebar; CuiNavbar reuses it). Internal: it owns the decision, the drawer's state and
 * its ids, and the component renders the `CuiSlideover` itself, so what lands in the drawer
 * is its own business (a whole sidebar, or only a navbar's nav).
 *
 * `collapsed` is false until the component has mounted, so server rendering and the first
 * client render agree on the inline layout (the server has no viewport); a narrow viewport
 * switches to the drawer in the same tick, before paint.
 *
 * A slideover mounts its panel only while open, so a collapsed navigation is not merely
 * invisible: its links are out of the tab order.
 */
export function useCollapseToDrawer(options: CollapseToDrawerOptions): CollapseToDrawer {
  const { breakpoint } = useBreakpoint();
  const messages = useMessages();

  const mounted = ref(false);
  onMounted(() => {
    mounted.value = true;
  });

  const collapsed = computed(() => {
    const below = options.collapseBelow();
    if (!mounted.value || below === "never") return false;
    const width = breakpoint.value === "base" ? 0 : BREAKPOINTS[breakpoint.value];
    return width < BREAKPOINTS[below];
  });

  const local = ref(false);
  const state = options.open ?? local;
  const open = computed({
    get: () => Boolean(state.value) && collapsed.value,
    set: (v: boolean) => {
      state.value = v;
    },
  });

  // Back to the inline layout: an open drawer must not still be open when the viewport grows
  // and shrinks again.
  watch([collapsed, state, mounted], () => {
    if (mounted.value && !collapsed.value && state.value) state.value = false;
  });

  const drawerId = useCuiId("drawer");
  const toggleAttrs = computed(() => ({
    "aria-expanded": open.value,
    "aria-controls": drawerId,
    "aria-label": messages.value.navigation?.menu ?? "Navigation menu",
  }));

  return {
    collapsed,
    open,
    drawerId,
    toggle: () => {
      open.value = !open.value;
    },
    close: () => {
      open.value = false;
    },
    toggleAttrs,
  };
}
