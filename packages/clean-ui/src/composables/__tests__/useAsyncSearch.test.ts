import { describe, it, expect, vi, afterEach } from "vitest";
import { effectScope, nextTick } from "vue";
import { useAsyncSearch, type SearchFn } from "../useAsyncSearch";

afterEach(() => vi.useRealTimers());

/** A fetch whose responses resolve when the test says, per query. */
function controllable() {
  const pending = new Map<string, { resolve: (v: string[]) => void; signal?: AbortSignal }>();
  const fetch = vi.fn<SearchFn<string>>((q, { signal }) => new Promise((resolve) => pending.set(q, { resolve, signal })));
  return { fetch, pending };
}

function setup(fetch: SearchFn<string>, minChars = 0) {
  const scope = effectScope();
  const s = scope.run(() => useAsyncSearch<string>({ fetch: () => fetch, debounce: () => 100, minChars: () => minChars }))!;
  return { s, scope };
}

// #245
describe("useAsyncSearch", () => {
  it("never lets an older, slower response replace a newer one", async () => {
    vi.useFakeTimers();
    const { fetch, pending } = controllable();
    const { s } = setup(fetch);
    s.search("ab");
    vi.advanceTimersByTime(100);
    s.search("abc");
    vi.advanceTimersByTime(100);
    expect(pending.get("ab")!.signal?.aborted).toBe(true); // superseded and aborted
    pending.get("abc")!.resolve(["abc-result"]);
    await nextTick();
    pending.get("ab")!.resolve(["ab-result"]); // lands late
    await nextTick();
    expect(s.results.value).toEqual(["abc-result"]);
    expect(s.answered.value).toBe("abc");
    expect(s.loading.value).toBe(false);
  });

  it("dropping below minChars cancels the pending search and clears the results", async () => {
    vi.useFakeTimers();
    const { fetch } = controllable();
    const { s } = setup(fetch, 3);
    s.search("abc");
    s.search("a"); // within the debounce
    vi.advanceTimersByTime(200);
    expect(fetch).not.toHaveBeenCalled();
    expect(s.results.value).toEqual([]);
    expect(s.answered.value).toBeNull();
  });

  it("dropping below minChars also discards a search already in flight", async () => {
    vi.useFakeTimers();
    const { fetch, pending } = controllable();
    const { s } = setup(fetch, 3);
    s.search("abc");
    vi.advanceTimersByTime(100);
    s.search("a");
    pending.get("abc")!.resolve(["late"]);
    await nextTick();
    expect(s.results.value).toEqual([]);
    expect(s.loading.value).toBe(false);
  });

  it("writes nothing after its scope is disposed (unmount), and aborts the search", async () => {
    vi.useFakeTimers();
    const { fetch, pending } = controllable();
    const { s, scope } = setup(fetch);
    s.search("abc");
    vi.advanceTimersByTime(100);
    scope.stop();
    expect(pending.get("abc")!.signal?.aborted).toBe(true);
    pending.get("abc")!.resolve(["late"]);
    await nextTick();
    expect(s.results.value).toEqual([]);
  });

  it("is answered only once a search for the query has come back", async () => {
    vi.useFakeTimers();
    const { fetch, pending } = controllable();
    const { s } = setup(fetch);
    s.search("ab");
    expect(s.answered.value).toBeNull(); // the debounce
    vi.advanceTimersByTime(100);
    expect(s.loading.value).toBe(true);
    pending.get("ab")!.resolve([]);
    await nextTick();
    expect(s.answered.value).toBe("ab");
  });

  it("a failed search clears stale results, records the error, and doesn't reject unhandled", async () => {
    vi.useFakeTimers();
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    let fail = false;
    const fetch: SearchFn<string> = async (q) => {
      if (fail) throw new Error("offline");
      return [`${q}-result`];
    };
    const { s } = setup(fetch);
    s.search("ab");
    await vi.advanceTimersByTimeAsync(100);
    expect(s.results.value).toEqual(["ab-result"]);
    fail = true;
    s.search("abc");
    await vi.advanceTimersByTimeAsync(100);
    expect(s.results.value).toEqual([]); // not ab's results left showing for abc
    expect((s.error.value as Error).message).toBe("offline");
    expect(s.answered.value).toBe("abc");
    expect(errorLog).toHaveBeenCalled();
    errorLog.mockRestore();
  });
});
