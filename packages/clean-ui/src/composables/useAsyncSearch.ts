import { computed, onScopeDispose, ref, shallowRef, watch, type Ref } from "vue";

/**
 * Debounced async search for CuiCombobox's `fetchOptions` and CuiTagInput's
 * `fetchSuggestions` (#245). Internal — not exported. The two carried the same timer,
 * loading flag and results ref, with the same bugs:
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
 * State for the component to render from:
 * - `pending` from the moment a search is scheduled until it settles — the debounce counts,
 *   so the panel says "searching" instead of showing an empty box;
 * - `answered`: whether the results are an answer for the query as typed now, so "nothing
 *   found" is claimed only once a search for it came back (always true without a fetch);
 * - `error`: the failed search's error. Its results are cleared, not left from an older
 *   query, and it is logged rather than rejected unhandled from the timer.
 */
/** An object rather than a bare signal, so `limit` or `page` can join it without breaking. */
export type SearchFn<T> = (query: string, context: { signal: AbortSignal }) => Promise<T[]>;

export interface UseAsyncSearchOptions<T> {
  fetch: () => SearchFn<T> | undefined;
  /** The query as typed now. */
  query: () => string;
  debounce: () => number;
  minChars: () => number;
}

export function useAsyncSearch<T>(options: UseAsyncSearchOptions<T>) {
  const results = shallowRef<T[]>([]) as Ref<T[]>;
  const pending = ref(false);
  const answeredQuery = ref<string | null>(null);
  const error = shallowRef<unknown>(null);

  let timer: ReturnType<typeof setTimeout> | undefined;
  let controller: AbortController | undefined;
  let token = 0;

  const answered = computed(() => !options.fetch() || answeredQuery.value === options.query());

  /** Stop the pending debounce and the search in flight; nothing they started will write. */
  function cancel() {
    clearTimeout(timer);
    timer = undefined;
    controller?.abort();
    controller = undefined;
    token++;
    pending.value = false;
  }

  /** Cancel, and forget the results: the query was cleared (a selection, a close). */
  function reset() {
    cancel();
    results.value = [];
    answeredQuery.value = null;
    error.value = null;
  }

  async function run(query: string, mine: number) {
    const fetch = options.fetch();
    if (!fetch) return;
    const own = new AbortController();
    controller = own;
    try {
      const found = await fetch(query, { signal: own.signal });
      if (mine !== token) return; // a newer search, or a cancel, came first
      results.value = found;
      answeredQuery.value = query;
    } catch (err) {
      if (mine !== token || own.signal.aborted) return; // superseded: not this search's error
      results.value = [];
      answeredQuery.value = query;
      error.value = err;
      console.error("[clean-ui] search failed:", err);
    } finally {
      if (mine === token) {
        pending.value = false;
        controller = undefined; // settled: a later cancel mustn't abort a finished request
      }
    }
  }

  /** Search for `query` after the debounce, superseding any search before it. */
  function search(query: string) {
    cancel();
    error.value = null;
    if (query.length < options.minChars()) {
      results.value = [];
      answeredQuery.value = null;
      return;
    }
    const mine = token;
    pending.value = true;
    timer = setTimeout(() => {
      timer = undefined;
      void run(query, mine);
    }, options.debounce());
  }

  // A different fetch function or threshold makes the current results no answer at all.
  watch([options.fetch, options.minChars], reset);
  onScopeDispose(cancel);

  return { results, pending, answered, error, search, reset };
}
