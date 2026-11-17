/**
 * Keyboard shortcut strings for CuiCommandPalette's `hotkey` prop (#197). Internal.
 *
 * `"mod+k"`: `+`-separated, case-insensitive, one key and any of `mod`, `ctrl`, `meta`
 * (`cmd`), `alt` (`option`), `shift`. `mod` is Command on Apple platforms and Control
 * elsewhere, the convention for a shortcut that should feel native on both. A match is
 * exact: `mod+k` does not fire on `mod+shift+k`.
 */

export interface Hotkey {
  key: string;
  ctrl: boolean;
  meta: boolean;
  alt: boolean;
  shift: boolean;
}

/** Command-key platforms: macOS and iOS. */
export function isApplePlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  return /mac|iphone|ipad|ipod/i.test(nav.userAgentData?.platform ?? nav.platform ?? "");
}

/** Parses `"mod+k"`. `null` for a string with no key in it. */
export function parseHotkey(spec: string, apple = isApplePlatform()): Hotkey | null {
  const hotkey: Hotkey = { key: "", ctrl: false, meta: false, alt: false, shift: false };
  // "mod++" is Mod and the plus key: peel the key off before splitting on `+`.
  if (spec === "+" || spec.endsWith("++")) {
    hotkey.key = "+";
    spec = spec.slice(0, -1);
  }
  for (const raw of spec.split("+")) {
    const part = raw.trim().toLowerCase();
    if (part === "mod") hotkey[apple ? "meta" : "ctrl"] = true;
    else if (part === "ctrl" || part === "control") hotkey.ctrl = true;
    else if (part === "meta" || part === "cmd" || part === "command") hotkey.meta = true;
    else if (part === "alt" || part === "option") hotkey.alt = true;
    else if (part === "shift") hotkey.shift = true;
    else if (part) hotkey.key = part;
  }
  return hotkey.key ? hotkey : null;
}

/**
 * Whether `e` is that shortcut. The key is read from `e.key`, then from `e.code` for a
 * letter or digit: with Option held on a Mac `e.key` is another character ("˚" for K).
 */
export function matchesHotkey(e: KeyboardEvent, hotkey: Hotkey): boolean {
  if (e.ctrlKey !== hotkey.ctrl || e.metaKey !== hotkey.meta || e.altKey !== hotkey.alt || e.shiftKey !== hotkey.shift) return false;
  const key = e.key.toLowerCase();
  if (key === hotkey.key || (key === " " && hotkey.key === "space")) return true;
  // Only where Option has swapped the character: on a non-QWERTY layout the physical K is
  // another letter, and Ctrl+T must not open a Ctrl+K palette.
  if (/^[a-z0-9]$/.test(key)) return false;
  const code = e.code.toLowerCase();
  return code === `key${hotkey.key}` || code === `digit${hotkey.key}`;
}

interface Claim {
  hotkey: Hotkey | null;
}
const claims: Claim[] = [];

/**
 * Several palettes may listen for one shortcut; of those mounted, the one that claimed its
 * place last and has a shortcut set handles it (#530), so a palette that mounts over another
 * (in a drawer) takes the key while it is there and hands it back when it goes. A claim keeps
 * its place when its shortcut changes. Returns `set(hotkey | null)`, `owns(e)` and `release()`.
 */
export function claimHotkey() {
  const claim: Claim = { hotkey: null };
  claims.push(claim);
  return {
    set(hotkey: Hotkey | null) {
      claim.hotkey = hotkey;
    },
    owns(e: KeyboardEvent) {
      for (let i = claims.length - 1; i >= 0; i--) {
        const h = claims[i].hotkey;
        if (h && matchesHotkey(e, h)) return claims[i] === claim;
      }
      return false;
    },
    release() {
      const i = claims.indexOf(claim);
      if (i >= 0) claims.splice(i, 1);
    },
  };
}
