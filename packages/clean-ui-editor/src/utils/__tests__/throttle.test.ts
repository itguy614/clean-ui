import { describe, it, expect, vi, afterEach } from "vitest";
import { throttle } from "../throttle";

describe("throttle", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls straight through when wait is 0", () => {
    const fn = vi.fn();
    const t = throttle(fn, 0);
    t.call("a");
    t.call("b");
    expect(fn.mock.calls).toEqual([["a"], ["b"]]);
  });

  it("fires the first call immediately and coalesces the rest into one trailing call", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const t = throttle(fn, 50);
    t.call("a");
    t.call("b");
    t.call("c");
    expect(fn.mock.calls).toEqual([["a"]]);

    vi.advanceTimersByTime(50);
    expect(fn.mock.calls).toEqual([["a"], ["c"]]);
  });

  it("cancel drops a pending trailing call", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const t = throttle(fn, 50);
    t.call("a");
    t.call("b");
    t.cancel();

    vi.advanceTimersByTime(100);
    expect(fn.mock.calls).toEqual([["a"]]);
  });

  it("keeps working after a cancel", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const t = throttle(fn, 50);
    t.call("a");
    t.call("b");
    t.cancel();
    t.call("c");

    vi.advanceTimersByTime(50);
    expect(fn.mock.calls).toEqual([["a"], ["c"]]);
  });

  it("flush runs a pending trailing call immediately, once", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const t = throttle(fn, 50);
    t.call("a");
    t.call("b");
    t.flush();
    expect(fn.mock.calls).toEqual([["a"], ["b"]]);

    vi.advanceTimersByTime(100);
    t.flush();
    expect(fn.mock.calls).toEqual([["a"], ["b"]]);
  });

  it("reads a getter wait on every call, keeping its last-fire time across a change", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    let wait = 50;
    const t = throttle(fn, () => wait);
    t.call("a");
    wait = 100;
    vi.advanceTimersByTime(60);
    // Past the old interval but inside the new one: trailing, not immediate.
    t.call("b");
    expect(fn.mock.calls).toEqual([["a"]]);
    vi.advanceTimersByTime(40);
    expect(fn.mock.calls).toEqual([["a"], ["b"]]);

    wait = 0;
    t.call("c");
    expect(fn.mock.calls).toEqual([["a"], ["b"], ["c"]]);
  });
});
