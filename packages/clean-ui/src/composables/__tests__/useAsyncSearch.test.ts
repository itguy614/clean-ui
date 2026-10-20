import { describe, it, expect, vi, afterEach } from "vitest";
import { effectScope, nextTick, ref } from "vue";
import { useAsyncSearch, type SearchFn } from "../useAsyncSearch";

afterEach(() => vi.useRealTimers());

/** A fetch whose responses resolve when the test says, per query. */
function controllable() {
  const pending = new Map<string, { resolve: (v: string[]) => void; signal: AbortSignal }>();
  const fetch = vi.fn<SearchFn<string>>((q, { signal }) => new Promise((resolve) => pending.set(q, { resolve, signal })));
  return { fetch, pending };
}

function setup(fetch: SearchFn<string>, minChars = 0) {
  const query = ref("");
  const scope = effectScope();
  const s = scope.run(() =>
    useAsyncSearch<string>({ fetch: () => fetch, query: () => query.value, debounce: () => 100, minChars: () => minChars }),
  )!;
  const type = (q: string) => {
    query.value = q;
    s.search(q);
  };
  return { s, scope, type };
}

// #245
describe("useAsyncSearch", () => {
  it("never lets an older, slower response replace a newer one", async () => {
    vi.useFakeTimers();
    const { fetch, pending } = controllable();
    const { s, type } = setup(fetch);
    type("ab");
    vi.advanceTimersByTime(100);
    type("abc");
    vi.advanceTimersByTime(100);
    expect(pending.get("ab")!.signal.aborted).toBe(true); // superseded and aborted
    pending.get("abc")!.resolve(["abc-result"]);
    await nextTick();
    pending.get("ab")!.resolve(["ab-result"]); // lands late
    await nextTick();
    expect(s.results.value).toEqual(["abc-result"]);
    expect(s.answered.value).toBe(true);
    expect(s.pending.value).toBe(false);
  });

  it("is pending from the moment a search is scheduled — the debounce counts", () => {
    vi.useFakeTimers();
    const { fetch } = controllable();
    const { s, type } = setup(fetch);
    type("ab");
    expect(s.pending.value).toBe(true);
    expect(s.answered.value).toBe(false);
  });

  it("dropping below minChars cancels the pending search and clears the results", () => {
    vi.useFakeTimers();
    const { fetch } = controllable();
    const { s, type } = setup(fetch, 3);
    type("abc");
    type("a"); // within the debounce
    vi.advanceTimersByTime(200);
    expect(fetch).not.toHaveBeenCalled();
    expect(s.results.value).toEqual([]);
    expect(s.pending.value).toBe(false);
  });

  it("dropping below minChars also discards a search already in flight", async () => {
    vi.useFakeTimers();
    const { fetch, pending } = controllable();
    const { s, type } = setup(fetch, 3);
    type("abc");
    vi.advanceTimersByTime(100);
    type("a");
    pending.get("abc")!.resolve(["late"]);
    await nextTick();
    expect(s.results.value).toEqual([]);
  });

  it("writes nothing after its scope is disposed (unmount), and aborts the search", async () => {
    vi.useFakeTimers();
    const { fetch, pending } = controllable();
    const { s, scope, type } = setup(fetch);
    type("abc");
    vi.advanceTimersByTime(100);
    scope.stop();
    expect(pending.get("abc")!.signal.aborted).toBe(true);
    pending.get("abc")!.resolve(["late"]);
    await nextTick();
    expect(s.results.value).toEqual([]);
  });

  it("doesn't abort a search that already finished", async () => {
    vi.useFakeTimers();
    const { fetch, pending } = controllable();
    const { type } = setup(fetch);
    type("ab");
    vi.advanceTimersByTime(100);
    pending.get("ab")!.resolve(["x"]);
    await nextTick();
    type("abc");
    expect(pending.get("ab")!.signal.aborted).toBe(false);
  });

  it("reset() forgets the results and cancels", async () => {
    vi.useFakeTimers();
    const { fetch, pending } = controllable();
    const { s, type } = setup(fetch);
    type("ab");
    vi.advanceTimersByTime(100);
    pending.get("ab")!.resolve(["x"]);
    await nextTick();
    s.reset();
    expect(s.results.value).toEqual([]);
    expect(s.pending.value).toBe(false);
  });

  it("a failed search clears stale results, records the error, and doesn't reject unhandled", async () => {
    vi.useFakeTimers();
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    let fail = false;
    const fetch: SearchFn<string> = async (q) => {
      if (fail) throw new Error("offline");
      return [`${q}-result`];
    };
    const { s, type } = setup(fetch);
    type("ab");
    await vi.advanceTimersByTimeAsync(100);
    expect(s.results.value).toEqual(["ab-result"]);
    fail = true;
    type("abc");
    await vi.advanceTimersByTimeAsync(100);
    expect(s.results.value).toEqual([]); // not ab's results left showing for abc
    expect((s.error.value as Error).message).toBe("offline");
    expect(s.answered.value).toBe(true);
    expect(errorLog).toHaveBeenCalled();
    errorLog.mockRestore();
  });
});
