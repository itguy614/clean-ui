import { onScopeDispose, ref, shallowRef, type Ref } from "vue";

/**
 * Debounced async search for CuiCombobox's `fetchOptions` and CuiTagInput's
 * `fetchSuggestions` (#245). Internal — not exported. The two carried the same timer,
 * loading flag and results ref, with the same three bugs:
 *
 * - **Out-of-order responses.** Whatever resolved last won, so a slow response for `ab`
 *   could land after the fast one for `abc` and replace it. Each search now has a token, and
 *   only the latest one writes; the one before is also aborted, through the `signal` the
 *   fetch receives in its second argument (a fetch that ignores it still works).
 * - **A pending debounce outlived `minChars`.** Backspacing below it cleared the results
 *   but left the timer running, which then fetched the short query. Dropping below it now
 *   cancels the timer and any search in flight.
 * - **A search in flight outlived unmount,** writing to a dead instance and keeping its
 *   scope alive until it settled. Unmount now cancels it.
 *
 * `answered` is the query the current results belong to, so a component claims "nothing
 * found" only once a search for what's typed has actually come back — not during the
 * debounce, and not below `minChars`. A failed search clears the results (rather than
 * leave an older query's on screen), sets `error`, and is logged rather than rejected
 * unhandled from the timer.
 */
/** An object rather than a bare signal, so `limit` or `page` can join it without breaking. */
export type SearchFn<T> = (query: string, context: { signal: AbortSignal }) => Promise<T[]>;

export interface UseAsyncSearchOptions<T> {
  fetch: () => SearchFn<T> | undefined;
  debounce: () => number;
  minChars: () => number;
}

export function useAsyncSearch<T>(options: UseAsyncSearchOptions<T>) {
  const results = shallowRef<T[]>([]) as Ref<T[]>;
  const loading = ref(false);
  const answered = ref<string | null>(null);
  const error = shallowRef<unknown>(null);

  let timer: ReturnType<typeof setTimeout> | undefined;
  let controller: AbortController | undefined;
  let token = 0;

  /** Stop the pending debounce and the search in flight; nothing they started will write. */
  function cancel() {
    clearTimeout(timer);
    timer = undefined;
    controller?.abort();
    controller = undefined;
    token++;
    loading.value = false;
  }

  async function run(query: string, mine: number) {
    const fetch = options.fetch();
    if (!fetch) return;
    controller = new AbortController();
    const { signal } = controller;
    loading.value = true;
    try {
      const found = await fetch(query, { signal });
      if (mine !== token) return; // a newer search, or a cancel, came first
      results.value = found;
      answered.value = query;
    } catch (err) {
      if (mine !== token || signal.aborted) return; // superseded: not this search's error
      results.value = [];
      answered.value = query;
      error.value = err;
      console.error("[clean-ui] search failed:", err);
    } finally {
      if (mine === token) loading.value = false;
    }
  }

  /** Search for `query` after the debounce, superseding any search before it. */
  function search(query: string) {
    cancel();
    error.value = null;
    if (query.length < options.minChars()) {
      results.value = [];
      answered.value = null;
      return;
    }
    const mine = token;
    timer = setTimeout(() => {
      timer = undefined;
      void run(query, mine);
    }, options.debounce());
  }

  onScopeDispose(cancel);

  return { results, loading, answered, error, search, cancel };
}
