import { ref, readonly, type Ref } from "vue";
import type { TailwindBreakpoint } from "../types/grid";

const BREAKPOINTS: Record<TailwindBreakpoint, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

const BREAKPOINT_ORDER: TailwindBreakpoint[] = ["sm", "md", "lg", "xl", "2xl"];

export type ActiveBreakpoint = TailwindBreakpoint | "base";

function detectBreakpoint(): ActiveBreakpoint {
  if (typeof window === "undefined") return "base";
  const width = window.innerWidth;
  for (let i = BREAKPOINT_ORDER.length - 1; i >= 0; i--) {
    if (width >= BREAKPOINTS[BREAKPOINT_ORDER[i]]) {
      return BREAKPOINT_ORDER[i];
    }
  }
  return "base";
}

// Shared singleton so all components share one set of listeners
let shared: Ref<ActiveBreakpoint> | null = null;
const cleanups: (() => void)[] = [];

function init() {
  shared = ref<ActiveBreakpoint>(detectBreakpoint());

  for (const bp of BREAKPOINT_ORDER) {
    const mql = window.matchMedia(`(min-width: ${BREAKPOINTS[bp]}px)`);
    const handler = () => {
      shared!.value = detectBreakpoint();
    };
    mql.addEventListener("change", handler);
    cleanups.push(() => mql.removeEventListener("change", handler));
  }
}

export function useBreakpoint() {
  if (!shared) init();
  return { breakpoint: readonly(shared!) as Readonly<Ref<ActiveBreakpoint>> };
}

export { BREAKPOINTS, BREAKPOINT_ORDER };
