/**
 * Guarded Web Storage access.
 *
 * `localStorage` being *defined* doesn't mean it's usable: a sandboxed iframe
 * without `allow-same-origin` throws on property access, Safari private mode and
 * cookie-blocking settings can throw on read/write, and Node >= 22 exposes an
 * inert global (no `getItem`) that jsdom-based test runners inherit. A
 * `typeof window !== "undefined"` guard catches none of those.
 *
 * Route every read/write through here so a hostile storage environment
 * degrades to "no persistence" instead of throwing — which matters most at
 * module scope, where one throw takes the whole library barrel down.
 */

function getStorage(): Storage | null {
  try {
    // Property access itself can throw (sandboxed iframe)
    if (typeof localStorage === "undefined" || localStorage === null) return null;
    // Present but inert (Node's built-in Web Storage without --localstorage-file)
    if (typeof localStorage.getItem !== "function") return null;
    return localStorage;
  } catch {
    return null;
  }
}

/** Read a key, or `null` if storage is unavailable or the read throws. */
export function safeGetItem(key: string): string | null {
  try {
    return getStorage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

/** Write a key. Returns whether it stuck — callers may ignore it. */
export function safeSetItem(key: string, value: string): boolean {
  try {
    const storage = getStorage();
    if (!storage) return false;
    storage.setItem(key, value);
    return true;
  } catch {
    // Quota exceeded, private mode, blocked storage
    return false;
  }
}
