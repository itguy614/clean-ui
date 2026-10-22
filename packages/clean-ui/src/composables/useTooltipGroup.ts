import { onScopeDispose, watch } from "vue";

/**
 * The "warm" state every CuiTooltip shares (#264), on the useLayerStack pattern. The first
 * tooltip waits out its `showDelay`, so a pointer crossing a toolbar doesn't set them all
 * off. But once one has been open, the next one opened soon after — moving along a row of
 * icon buttons, by pointer or by Tab — shows at once with no entry animation, and the one
 * it replaces closes at once rather than waiting out its hideDelay and fading over it.
 * Warm while any member is open, and for `skipDelay` ms after the last one closes. One
 * group for the page (decided on #264); a tooltip with `skipDelay` 0 stays out of it.
 *
 * Internal. Registers nothing under server rendering, where unmount never runs.
 */
interface Member {
  closeNow: () => void;
}

const members = new Set<Member>();
let warmUntil = 0;

export interface UseTooltipGroupOptions {
  /** Whether this tooltip is open. */
  active: () => boolean;
  skipDelay: () => number;
  /** Close this tooltip at once, with no exit: another is taking its place. */
  closeNow: () => void;
}

export function useTooltipGroup({ active, skipDelay, closeNow }: UseTooltipGroupOptions) {
  const member: Member = { closeNow };
  const inGroup = () => skipDelay() > 0;

  function leave() {
    if (members.delete(member) && members.size === 0) warmUntil = Date.now() + skipDelay();
  }

  if (typeof document !== "undefined") {
    // Sync, so the window starts the moment this one closes, not a flush later.
    watch(
      active,
      (now) => {
        if (now && inGroup()) members.add(member);
        else if (!now) leave();
      },
      { flush: "sync", immediate: true },
    );
    onScopeDispose(leave);
  }

  return {
    /** Whether this tooltip, opening now, should skip its delay and its entry animation. */
    isWarm: () => inGroup() && (members.size > 0 || Date.now() < warmUntil),
    /** Opening warm: close the tooltip(s) this one replaces, at once. */
    handOff: () => {
      for (const other of [...members]) if (other !== member) other.closeNow();
    },
  };
}

/** Test seam: back to cold. */
export function __resetTooltipGroup(): void {
  members.clear();
  warmUntil = 0;
}
