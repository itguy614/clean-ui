/**
 * The geometry of a stack of same-side slideovers (#41), as plain numbers in px. Panels are
 * listed bottom first (the one opened first) and an `offset` is the distance from the docked
 * edge to the panel's own edge on the same side (0 for the panel sitting at the edge: the newest
 * with push inward, the first with push outward). It is pure and DOM-free,
 * so the rules are testable on their own; `useSlideoverStackLayout` measures, calls this and
 * applies the answer.
 *
 * Attach: panels keep their natural width and sit edge to edge, as one surface from the
 * docked edge. `push` says which end the newest panel takes. "inward" (the default): the newest
 * sits at the docked edge and the ones already open are pushed inward to make room, so it
 * reads oldest to newest from the open side to the edge. "outward": the newest attaches on
 * the open side of the group and the older ones stay where they are. While the group still fits in `viewport - gap` nothing
 * changes. Past that, every panel narrows by the same proportion until the group exactly fills
 * it, so the gap a lone slideover leaves is never used and nothing goes off-screen.
 *
 * Peek: below a floor (a panel narrower than `minWidth`) or on a narrow viewport, panels stop
 * narrowing and overlap, each lower one sitting `peekOffset` further out than the one above so
 * its edge shows behind it, like cascading cards. Past `maxPeek` layers the offset stops
 * growing, so the cascade can't run out of room: deeper panels share the last one's edge.
 */
export interface StackLayoutInput {
  /** Natural width of each panel, bottom first. */
  natural: readonly number[];
  viewport: number;
  /** Room kept free beside the stack on the open side. */
  gap: number;
  /** The narrowest a panel may be squeezed to in attach mode. */
  minWidth: number;
  peekOffset: number;
  maxPeek: number;
  /** Which way the older panels move when one is added (attach mode). Default "inward". */
  push?: "inward" | "outward";
  /** Peek regardless of room (a narrow viewport). */
  forcePeek?: boolean;
}

export interface StackLayout {
  mode: "attach" | "peek";
  panels: { width: number; offset: number }[];
}

export function layoutStack(input: StackLayoutInput): StackLayout {
  const { natural, viewport, gap, minWidth, peekOffset, maxPeek, forcePeek, push = "inward" } = input;
  const avail = Math.max(0, viewport - gap);
  const n = natural.length;
  const clamped = natural.map((w) => Math.min(w, avail));

  if (!forcePeek) {
    const total = clamped.reduce((a, b) => a + b, 0);
    const scale = total > avail && total > 0 ? avail / total : 1;
    const widths = clamped.map((w) => w * scale);
    // A lone panel is only ever capped, never "squeezed".
    if (scale === 1 || n === 1 || Math.min(...widths) >= minWidth) {
      const panels = widths.map((width) => ({ width, offset: 0 }));
      // Outward: oldest at the edge, each newer one beside it. Inward: newest at the edge.
      let offset = 0;
      for (let k = 0; k < n; k++) {
        const i = push === "inward" ? n - 1 - k : k;
        panels[i].offset = offset;
        offset += widths[i];
      }
      return { mode: "attach", panels };
    }
  }

  // Peek. The top panel leaves room for the edges that show beside it.
  const visible = Math.min(Math.max(n - 1, 0), Math.max(maxPeek, 0));
  const panels = clamped.map((w) => ({ width: w, offset: 0 }));
  if (n) panels[n - 1].width = Math.min(clamped[n - 1], Math.max(avail - visible * peekOffset, 0));
  let edge = n ? panels[n - 1].width : 0;
  for (let k = 1; k < n; k++) {
    const i = n - 1 - k;
    const step = k <= maxPeek ? peekOffset : 0;
    edge = Math.min(avail, Math.max(panels[i].width, edge + step));
    panels[i].offset = edge - panels[i].width;
  }
  return { mode: "peek", panels };
}
