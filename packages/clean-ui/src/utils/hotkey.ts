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
  const code = e.code.toLowerCase();
  return code === `key${hotkey.key}` || code === `digit${hotkey.key}`;
}
