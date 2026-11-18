/**
 * Matching a keydown against declared option shortcuts (#445). Internal — not exported.
 * DOM-free apart from reading the event, so the rules are unit-tested without a component.
 */
export type ActionModifier = "alt" | "ctrl" | "meta" | "shift";

export const ACTION_MODIFIERS: readonly ActionModifier[] = ["ctrl", "alt", "shift", "meta"];

export interface KeyedAction {
  key: string;
  modifiers: readonly ActionModifier[];
}

function keyMatches(key: string, e: KeyboardEvent): boolean {
  if (e.key === key || e.code === key) return true;
  if (key.length !== 1) return false;
  const k = key.toLowerCase();
  if (e.key.toLowerCase() === k) return true;
  // By physical key too: Option+D types "∂" on macOS, and Shift+1 types "!".
  if (/[a-z]/.test(k)) return e.code === `Key${k.toUpperCase()}`;
  if (/[0-9]/.test(k)) return e.code === `Digit${k}`;
  return false;
}

function modifiersMatch(modifiers: readonly ActionModifier[], e: KeyboardEvent): boolean {
  const held = { ctrl: e.ctrlKey, alt: e.altKey, shift: e.shiftKey, meta: e.metaKey };
  // Exactly these held: Ctrl+Shift+D is not Ctrl+D.
  return ACTION_MODIFIERS.every((m) => held[m] === modifiers.includes(m));
}

/**
 * The first action `e` triggers, or undefined. An action without modifiers never matches,
 * whatever its types said: an unmodified key would type into the search (the dev warning
 * says so).
 */
export function findOptionAction<T extends KeyedAction>(actions: readonly T[] | undefined, e: KeyboardEvent): T | undefined {
  return actions?.find((a) => a.modifiers?.length > 0 && modifiersMatch(a.modifiers, e) && keyMatches(a.key, e));
}

/** The action as `aria-keyshortcuts` writes it: "Control+Shift+D". */
export function optionActionShortcut(action: KeyedAction): string {
  const names: Record<ActionModifier, string> = { ctrl: "Control", alt: "Alt", shift: "Shift", meta: "Meta" };
  const key = action.key.length === 1 ? action.key.toUpperCase() : action.key;
  return [...ACTION_MODIFIERS.filter((m) => action.modifiers.includes(m)).map((m) => names[m]), key].join("+");
}
