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
    }`;
  document.head.append(style);
  return () => style.remove();
}
