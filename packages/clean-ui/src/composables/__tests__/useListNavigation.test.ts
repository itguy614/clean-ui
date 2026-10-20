import { describe, it, expect, vi, afterEach } from "vitest";
import { firstIndex, lastIndex, useListNavigation, type ListItems, type ListNavigationOptions } from "../useListNavigation";

const key = (k: string, mods: Partial<KeyboardEventInit> = {}) => new KeyboardEvent("keydown", { key: k, ...mods });
const list = (count: number, extra: Partial<ListItems> = {}): ListItems => ({ count, ...extra });
const nav = (opts: ListNavigationOptions = {}) => useListNavigation(opts);

afterEach(() => vi.useRealTimers());

describe("useListNavigation", () => {
  it("steps forward and back, stopping at the ends without wrap", () => {
    const n = nav();
    expect(n.indexForKey(key("ArrowDown"), 0, list(3))).toBe(1);
    expect(n.indexForKey(key("ArrowDown"), 2, list(3))).toBe(2);
    expect(n.indexForKey(key("ArrowUp"), 0, list(3))).toBe(0);
  });

  it("wraps when asked", () => {
    const n = nav({ wrap: () => true });
    expect(n.indexForKey(key("ArrowDown"), 2, list(3))).toBe(0);
    expect(n.indexForKey(key("ArrowUp"), 0, list(3))).toBe(2);
  });

  it("skips disabled items, and finds the enabled ends", () => {
    const disabled = new Set([0, 2, 4]);
    const items = list(5, { isDisabled: (i) => disabled.has(i) });
    const n = nav();
    expect(firstIndex(items)).toBe(1);
    expect(lastIndex(items)).toBe(3);
    expect(n.indexForKey(key("ArrowDown"), 1, items)).toBe(3);
    expect(n.indexForKey(key("ArrowDown"), 3, items)).toBe(3); // nothing enabled beyond: stays
  });

  it("returns -1 for an empty or all-disabled list", () => {
    expect(firstIndex(list(0))).toBe(-1);
    expect(lastIndex(list(2, { isDisabled: () => true }))).toBe(-1);
    expect(nav().indexForKey(key("ArrowDown"), 0, list(0))).toBe(-1);
  });

  it("maps keys by orientation, and ignores the cross axis", () => {
    const items = list(3);
    expect(nav().indexForKey(key("ArrowDown"), 0, items)).toBe(1);
    expect(nav().indexForKey(key("ArrowRight"), 0, items)).toBeNull();
    const h = nav({ orientation: () => "horizontal" });
    expect(h.indexForKey(key("ArrowRight"), 0, items)).toBe(1);
    expect(h.indexForKey(key("ArrowDown"), 0, items)).toBeNull();
    const both = nav({ orientation: () => "both" });
    expect(both.indexForKey(key("ArrowDown"), 0, items)).toBe(1);
    expect(both.indexForKey(key("ArrowLeft"), 1, items)).toBe(0);
  });

  it("swaps left and right in right-to-left, reading direction only for those keys", () => {
    const rtl = vi.fn(() => true);
    const n = nav({ orientation: () => "both", rtl });
    expect(n.indexForKey(key("ArrowDown"), 0, list(3))).toBe(1);
    expect(rtl).not.toHaveBeenCalled();
    expect(n.indexForKey(key("ArrowLeft"), 0, list(3))).toBe(1);
    expect(n.indexForKey(key("ArrowRight"), 1, list(3))).toBe(0);
  });

  it("Home and End reach the enabled ends", () => {
    const items = list(4, { isDisabled: (i) => i === 3 });
    expect(nav().indexForKey(key("Home"), 2, items)).toBe(0);
    expect(nav().indexForKey(key("End"), 0, items)).toBe(2);
  });

  it("returns null for keys that aren't navigation", () => {
    const n = nav();
    expect(n.indexForKey(key("Enter"), 0, list(3))).toBeNull();
    expect(n.indexForKey(key("a"), 0, list(3, { label: () => "apple" }))).toBeNull(); // type-ahead off
  });

  describe("type-ahead", () => {
    const labels = ["Apple", "Banana", "Blueberry", "Cherry", "Avocado"];
    const items = list(labels.length, { label: (i) => labels[i] });
    const ta = () => nav({ typeahead: () => true });

    it("moves to the next item starting with the letter, cycling on repeats", () => {
      vi.useFakeTimers();
      const n = ta();
      expect(n.indexForKey(key("b"), 0, items)).toBe(1);
      expect(n.indexForKey(key("b"), 1, items)).toBe(2); // "bb" cycles
      expect(n.indexForKey(key("b"), 2, items)).toBe(1); // and comes round
    });

    it("refines with more letters typed quickly, and starts over after a pause", () => {
      vi.useFakeTimers();
      const n = ta();
      expect(n.indexForKey(key("b"), 0, items)).toBe(1);
      expect(n.indexForKey(key("l"), 1, items)).toBe(2); // "bl"
      vi.advanceTimersByTime(600);
      expect(n.indexForKey(key("a"), 2, items)).toBe(4); // fresh "a", after the current item
    });

    it("returns null when nothing matches, and ignores modified keys and space", () => {
      vi.useFakeTimers();
      const n = ta();
      expect(n.indexForKey(key("z"), 0, items)).toBeNull();
      expect(n.indexForKey(key("c", { ctrlKey: true }), 0, items)).toBeNull();
      expect(n.indexForKey(key(" "), 0, items)).toBeNull();
    });
  });
});
