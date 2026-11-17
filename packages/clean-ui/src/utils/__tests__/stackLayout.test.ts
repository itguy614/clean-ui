import { describe, it, expect } from "vitest";
import { layoutStack, type StackLayoutInput } from "../stackLayout";

const base: StackLayoutInput = { natural: [], viewport: 1280, gap: 32, minWidth: 320, peekOffset: 32, maxPeek: 3 };
const run = (o: Partial<StackLayoutInput>) => layoutStack({ ...base, ...o });
const widths = (l: ReturnType<typeof layoutStack>) => l.panels.map((p) => p.width);
const offsets = (l: ReturnType<typeof layoutStack>) => l.panels.map((p) => p.offset);

describe("layoutStack: attach", () => {
  it("a lone panel keeps its width, docked at the edge", () => {
    const l = run({ natural: [448] });
    expect(l.mode).toBe("attach");
    expect(l.panels).toEqual([{ width: 448, offset: 0 }]);
  });

  it("panels that fit sit edge to edge at their natural widths", () => {
    const l = run({ natural: [576, 448] });
    expect(l.mode).toBe("attach");
    expect(widths(l)).toEqual([576, 448]);
    expect(offsets(l)).toEqual([0, 576]);
  });

  it("past the room, every panel narrows so the group exactly fills viewport minus gap", () => {
    const l = run({ natural: [576, 448, 448] });
    expect(l.mode).toBe("attach");
    expect(widths(l).reduce((a, b) => a + b, 0)).toBeCloseTo(1280 - 32, 6);
    // Equal proportion: the ratios between panels survive.
    expect(widths(l)[0] / widths(l)[1]).toBeCloseTo(576 / 448, 6);
    // Still edge to edge, and never past the gap.
    expect(offsets(l)[2] + widths(l)[2]).toBeCloseTo(1248, 6);
  });

  it("a lone panel wider than the room is capped, not treated as squeezed", () => {
    const l = run({ natural: [2000], viewport: 600 });
    expect(l.mode).toBe("attach");
    expect(widths(l)).toEqual([568]);
  });
});

describe("layoutStack: peek", () => {
  it("falls back to peek once narrowing would take a panel under the floor", () => {
    // 3 x 448 in a 700 viewport: each would be 222 < 320.
    const l = run({ natural: [448, 448, 448], viewport: 700 });
    expect(l.mode).toBe("peek");
  });

  it("does not fall back while the narrowed panels are still above the floor", () => {
    const l = run({ natural: [448, 448, 448], viewport: 1100 });
    expect(l.mode).toBe("attach");
  });

  it("forcePeek peeks even with room to spare", () => {
    const l = run({ natural: [448, 448], forcePeek: true });
    expect(l.mode).toBe("peek");
  });

  it("each lower panel's edge shows peekOffset beyond the one above, to the cap", () => {
    const l = run({ natural: [448, 448, 448, 448, 448], forcePeek: true, maxPeek: 3, peekOffset: 32 });
    // Left edges from the docked side: top 448, then +32 per layer for 3 layers, then shared.
    const edges = l.panels.map((p) => p.offset + p.width);
    expect(edges.at(-1)).toBe(448);
    expect(edges.slice().reverse()).toEqual([448, 480, 512, 544, 544]);
  });

  it("a lower panel narrower than the one above still shows its edge", () => {
    const l = run({ natural: [320, 576], forcePeek: true });
    const [low, top] = l.panels;
    expect(low.offset + low.width).toBe(top.width + 32);
  });

  it("the cascade never leaves the room: the top panel leaves space for the edges", () => {
    const l = run({ natural: [800, 800, 800], viewport: 700, forcePeek: true });
    const avail = 700 - 32;
    for (const p of l.panels) expect(p.offset + p.width).toBeLessThanOrEqual(avail);
    expect(l.panels[2].width).toBe(avail - 2 * 32);
  });

  it("an empty stack lays out nothing", () => {
    expect(run({ natural: [] }).panels).toEqual([]);
    expect(run({ natural: [], forcePeek: true }).panels).toEqual([]);
  });
});
