/** Wait `n` animation frames — for work that lands after paint, not after a tick. */
export async function frames(n: number): Promise<void> {
  for (let i = 0; i < n; i++) {
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
  }
}

/**
 * Inject the library's tokens into the document, for suites that measure laid-out
 * geometry or resolved colours.
 *
 * The `--color-*` scale normally comes from the Tailwind `@theme` in theme.css, which
 * only exists once the engine has processed it. These suites inject raw CSS, so the
 * at-rule is inert — and an unresolved `var()` invalidates the whole `border` shorthand,
 * which silently moves every measurement by 2px. Stubbing the scale is what makes the
 * numbers real.
 *
 * Lives here rather than in each suite's `beforeAll` because that is how it went wrong
 * last time: `setup.ts` exists because this "lived as a copy-pasted `beforeAll` in six
 * suites before", and the copies had drifted over which steps they defined.
 *
 * Returns a teardown for `afterAll`.
 */
export function installTokens(css: string): () => void {
  const style = document.createElement("style");
  style.textContent = `${css}
    :root {
      --color-surface-50:#fafafa; --color-surface-100:#f4f4f5; --color-surface-200:#e4e4e7;
      --color-surface-300:#d4d4d8; --color-surface-400:#a1a1aa; --color-surface-500:#71717a;
      --color-surface-600:#52525b; --color-surface-700:#3f3f46; --color-surface-800:#27272a;
      --color-surface-900:#18181b; --color-surface-950:#09090b;
      --color-primary-100:#e0e7ff; --color-primary-300:#a5b4fc; --color-primary-500:#4f46e5;
      --color-primary-600:#4338ca; --color-primary-700:#3730a3; --color-primary-900:#1e1b4b;
      --color-success-100:#dcfce7; --color-success-300:#86efac; --color-success-500:#22c55e;
      --color-success-700:#15803d; --color-success-900:#14532d;
      --color-error-100:#fee2e2; --color-error-300:#fca5a5; --color-error-500:#ef4444;
      --color-error-700:#b91c1c; --color-error-900:#7f1d1d;
      --color-warning-100:#fef3c7; --color-warning-300:#fcd34d; --color-warning-500:#f59e0b;
      --color-warning-700:#b45309; --color-warning-900:#78350f;
      --color-info-100:#dbeafe; --color-info-300:#93c5fd; --color-info-500:#3b82f6;
      --color-info-700:#1d4ed8; --color-info-900:#1e3a8a;
      --color-secondary-100:#f1f5f9; --color-secondary-300:#cbd5e1; --color-secondary-500:#64748b;
      --color-secondary-700:#334155; --color-secondary-900:#0f172a;
    }`;
  document.head.append(style);
  return () => style.remove();
}

/**
 * A per-suite registry of mounts and their host elements, with one teardown.
 *
 * Browser suites measure laid-out geometry, so components have to be attached to a real
 * host in the document rather than mounted detached. Tracking the hosts is enough —
 * removing one detaches the tree — but the mount has to be unmounted too, or a component
 * with a global listener or an open teleport outlives its test. This pairs them so a
 * suite writes one `afterEach`, rather than the copy-pasted pair that had already drifted
 * between suites once.
 */
export function mountHosts() {
  const mounted: Array<{ unmount: () => void }> = [];
  const hosts: HTMLElement[] = [];

  return {
    /** Create an attached host, apply `style`, and register it for teardown. */
    host(style: Partial<CSSStyleDeclaration> = {}): HTMLElement {
      const host = document.createElement("div");
      Object.assign(host.style, style);
      document.body.append(host);
      hosts.push(host);
      return host;
    },
    /** Register a mount so it is unmounted with the hosts. */
    track<T extends { unmount: () => void }>(w: T): T {
      mounted.push(w);
      return w;
    },
    /** Pass to `afterEach`. */
    cleanup(): void {
      mounted.splice(0).forEach((w) => w.unmount());
      hosts.splice(0).forEach((h) => h.remove());
    },
  };
}
