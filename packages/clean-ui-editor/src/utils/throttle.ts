export interface Throttled<Args extends unknown[]> {
  call: (...args: Args) => void;
  /** Drops a pending trailing call without running it. */
  cancel: () => void;
  /** Runs a pending trailing call now, instead of waiting for its timer. */
  flush: () => void;
}

/**
 * Trailing-edge throttle: the first call in a quiet period fires immediately;
 * calls within `wait` ms of the last fire are coalesced into one trailing
 * call carrying the latest arguments, so nothing in between is ever lost —
 * only delayed. Used for `update:modelValue` emission (NFR10); the document
 * itself is never throttled, only how often the host is told about it.
 */
export function throttle<Args extends unknown[]>(fn: (...args: Args) => void, wait: number): Throttled<Args> {
  if (wait <= 0) return { call: fn, cancel: () => {}, flush: () => {} };

  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastCall = 0;
  let pendingArgs: Args | null = null;

  const cancel = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    pendingArgs = null;
  };

  const fire = () => {
    const callArgs = pendingArgs;
    cancel();
    lastCall = Date.now();
    fn(...callArgs!); // only reached with a call queued
  };

  return {
    call: (...args: Args) => {
      pendingArgs = args;
      const remaining = wait - (Date.now() - lastCall);
      if (remaining <= 0) fire();
      else if (timer === null) timer = setTimeout(fire, remaining);
    },
    cancel,
    flush: () => {
      if (pendingArgs !== null) fire();
    },
  };
}
