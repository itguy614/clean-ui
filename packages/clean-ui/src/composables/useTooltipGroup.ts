import { onScopeDispose, watch } from "vue";

/**
 * The "warm" state CuiTooltips share (#264), on the useLayerStack pattern. The first
 * tooltip waits out its `showDelay`, so a pointer crossing a toolbar doesn't set them all
 * off. But once one has been open, the next one opened soon after — moving along a row of
 * icon buttons, by pointer or by Tab — shows at once with no entry animation, and the one
 * it replaces goes at once, whether it is still open or already fading out, rather than
 * fading beside it. Warm while any member is open, and for that member's `skipDelay` ms
 * after the last one closes. One group for the page (decided on #264).
 *
 * Only a tooltip its user opened by hover or focus is a member: one opened through
 * `visible` or by a click is the consumer's or the user's to close, and neither warms the
 * group nor is replaced. A tooltip with `skipDelay` 0 stays out too.
 *
 * Internal. Registers nothing under server rendering, where unmount never runs.
 */
interface Member {
  open: boolean;
  skipDelay: number;
  replace: () => void;
}

const members = new Set<Member>();
let warmUntil = 0;

export interface UseTooltipGroupOptions {
  /** Whether this tooltip is open. */
  active: () => boolean;
  /** Whether it is rendered at all — open, or playing its exit. */
  present: () => boolean;
  /** Whether, opening now, it joins the group. Read once, as it opens. */
  joins: () => boolean;
  skipDelay: () => number;
  /** Close at once, or cut an exit short: another tooltip is taking this one's place. */
  replace: () => void;
}

export function useTooltipGroup({ active, present, joins, skipDelay, replace }: UseTooltipGroupOptions) {
  const member: Member = { open: false, skipDelay: 0, replace };
  const isOpen = () => [...members].some((m) => m.open);

  function close() {
    if (!member.open) return;
    member.open = false;
    if (!isOpen()) warmUntil = Date.now() + member.skipDelay;
  }

  if (typeof document !== "undefined") {
    // Sync, so the window starts the moment this one closes, not a flush later.
    watch(
      active,
      (now) => {
        if (!now) return close();
        if (!joins() || skipDelay() <= 0) return;
        member.open = true;
        member.skipDelay = skipDelay();
        members.add(member);
      },
      { flush: "sync", immediate: true },
    );
    watch(present, (now) => {
      if (!now) members.delete(member);
    });
    onScopeDispose(() => {
      close();
      members.delete(member);
    });
  }

  return {
    /** Whether this tooltip, opening now, should skip its delay and its entry animation. */
    isWarm: () => joins() && skipDelay() > 0 && (isOpen() || Date.now() < warmUntil),
    /** Opening warm: take the place of every other member, open or on its way out. */
    handOff: () => {
      for (const other of [...members]) if (other !== member) other.replace();
    },
  };
}

/** Test seam: back to cold. */
export function __resetTooltipGroup(): void {
  members.clear();
  warmUntil = 0;
}
