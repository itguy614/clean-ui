/**
 * The geometry of a stack of same-side slideovers (#41), as plain numbers in px. Panels are
 * listed bottom first (the one opened first, docked to the edge) and an `offset` is the
 * distance from that edge to the panel's own edge on the same side. It is pure and DOM-free,
 * so the rules are testable on their own; `useSlideoverStackLayout` measures, calls this and
 * applies the answer.
 *
 * Attach: panels keep their natural width and sit edge to edge, each beside the one beneath,
 * as one surface from the docked edge. While the group still fits in `viewport - gap` nothing
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
  /** Peek regardless of room (a narrow viewport). */
  forcePeek?: boolean;
}

export interface StackLayout {
  mode: "attach" | "peek";
  panels: { width: number; offset: number }[];
}

export function layoutStack(input: StackLayoutInput): StackLayout {
  const { natural, viewport, gap, minWidth, peekOffset, maxPeek, forcePeek } = input;
  const avail = Math.max(0, viewport - gap);
  const n = natural.length;
  const clamped = natural.map((w) => Math.min(w, avail));

  if (!forcePeek) {
    const total = clamped.reduce((a, b) => a + b, 0);
    const scale = total > avail && total > 0 ? avail / total : 1;
    const widths = clamped.map((w) => w * scale);
    // A lone panel is only ever capped, never "squeezed".
    if (scale === 1 || n === 1 || Math.min(...widths) >= minWidth) {
      let offset = 0;
      return {
        mode: "attach",
        panels: widths.map((width) => {
          const panel = { width, offset };
          offset += width;
          return panel;
        }),
      };
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
