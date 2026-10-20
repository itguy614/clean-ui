import { useId } from "vue";

/**
 * A per-instance DOM id, `cui-<prefix>-<n>`, for ids a component generates itself (titles,
 * labels, ARIA references, scoping attributes).
 *
 * Built on Vue's `useId()`, so it is stable across re-renders *and* identical between a
 * server render and its hydration — unlike the `Math.random()` suffixes it replaces (#182),
 * which produced a different id on the client than the server sent, a hydration mismatch
 * and a dangling `aria-labelledby` until the client re-rendered.
 *
 * Call it in `setup` (it is a composable: `useId()` only works there). `useId()` is unique
 * per Vue app; a page running several apps should give each its own `app.config.idPrefix`.
 */
export function useCuiId(prefix: string): string {
  return `cui-${prefix}-${useId()}`;
}
