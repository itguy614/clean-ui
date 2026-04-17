import { ref, computed, watch, type Ref, type MaybeRefOrGetter, toValue } from "vue";
import {
  useFloating,
  autoUpdate,
  flip,
  shift,
  offset,
  arrow as arrowMiddleware,
  type Placement,
  type Strategy,
} from "@floating-ui/vue";

export type PopoverPlacement = "top" | "bottom" | "left" | "right" | "auto";

export interface UsePopoverOptions {
  /** Preferred placement */
  placement?: MaybeRefOrGetter<PopoverPlacement>;
  /** Offset distance from the reference (px) */
  offsetDistance?: MaybeRefOrGetter<number>;
  /** Enable arrow positioning */
  arrow?: boolean;
  /** Positioning strategy */
  strategy?: Strategy;
}

/**
 * Shared composable for floating element positioning.
 * Used by CuiTooltip, CuiSelect, CuiDropdownMenu, CuiPopover.
 */
export function usePopover(options: UsePopoverOptions = {}) {
  const referenceRef = ref<HTMLElement | null>(null);
  const floatingRef = ref<HTMLElement | null>(null);
  const arrowRef = ref<HTMLElement | null>(null);

  const placementProp = options.placement ?? "top";
  const offsetDistance = options.offsetDistance ?? 8;

  // Convert our simplified placement to Floating UI placement
  const floatingPlacement = computed<Placement | undefined>(() => {
    const p = toValue(placementProp);
    if (p === "auto") return undefined;
    return p as Placement;
  });

  // Build middleware list
  const middleware = computed(() => {
    const mw = [
      offset(toValue(offsetDistance)),
      flip({ fallbackAxisSideDirection: "start" }),
      shift({ padding: 8 }),
    ];
    if (options.arrow && arrowRef.value) {
      mw.push(arrowMiddleware({ element: arrowRef.value, padding: 4 }));
    }
    return mw;
  });

  const { floatingStyles, placement, middlewareData, isPositioned, update } = useFloating(
    referenceRef,
    floatingRef,
    {
      placement: floatingPlacement,
      middleware,
      strategy: options.strategy ?? "absolute",
      whileElementsMounted: autoUpdate,
    },
  );

  // Arrow positioning
  const arrowStyle = computed(() => {
    if (!options.arrow || !middlewareData.value.arrow) return {};

    const { x, y } = middlewareData.value.arrow;
    const side = placement.value.split("-")[0] as "top" | "bottom" | "left" | "right";

    const staticSide: Record<string, string> = {
      top: "bottom",
      bottom: "top",
      left: "right",
      right: "left",
    };

    return {
      position: "absolute" as const,
      left: x != null ? `${x}px` : "",
      top: y != null ? `${y}px` : "",
      [staticSide[side]]: "-4px",
    };
  });

  // Which side the floating element is on (after flip)
  const currentSide = computed(() => placement.value.split("-")[0] as "top" | "bottom" | "left" | "right");

  return {
    referenceRef,
    floatingRef,
    arrowRef,
    floatingStyles,
    arrowStyle,
    placement,
    currentSide,
    isPositioned,
    update,
  };
}
