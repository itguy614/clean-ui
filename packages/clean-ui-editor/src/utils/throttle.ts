/**
 * Trailing-edge throttle: the first call in a quiet period fires immediately;
 * calls within `wait` ms of the last fire are coalesced into one trailing
 * call carrying the latest arguments, so nothing in between is ever lost —
 * only delayed. Used for `update:modelValue` emission (NFR10); the document
 * itself is never throttled, only how often the host is told about it.
 */
export function throttle<Args extends unknown[]>(fn: (...args: Args) => void, wait: number): (...args: Args) => void {
  if (wait <= 0) return fn;

  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastCall = 0;
  let pendingArgs: Args | null = null;

  return (...args: Args) => {
    const now = Date.now();
    const remaining = wait - (now - lastCall);
    pendingArgs = args;

    if (remaining <= 0) {
      lastCall = now;
      const callArgs = pendingArgs;
      pendingArgs = null;
      fn(...callArgs);
    } else if (timer === null) {
      timer = setTimeout(() => {
        timer = null;
        lastCall = Date.now();
        const callArgs = pendingArgs;
        pendingArgs = null;
        if (callArgs) fn(...callArgs);
      }, remaining);
    }
  };
}
