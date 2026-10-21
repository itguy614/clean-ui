import { restoreKeyOf, returnFocus } from "./focusRestore";
import { useListNavigation } from "../composables/useListNavigation";

/**
 * Focus helpers shared by CuiDropdown and CuiContextMenu (#160). Internal.
 */

/**
 * Every enabled item a menu's keyboard reaches — actions, check items and radio items.
 * Initial focus used to match `menuitem` alone, so a menu opening on a check or radio item
 * got no focus at all while the arrow keys reached it fine.
 */
const MENU_ITEM_SELECTOR =
  '[role="menuitem"]:not([aria-disabled="true"]), [role="menuitemcheckbox"]:not([aria-disabled="true"]), [role="menuitemradio"]:not([aria-disabled="true"])';

export type MenuEdge = "first" | "last";

function menuItems(menu: HTMLElement) {
  return Array.from(menu.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR));
}

/** Focus the menu's first or last enabled item. */
export function focusMenuEdge(menu: HTMLElement | null | undefined, edge: MenuEdge = "first") {
  if (!menu) return;
  const items = menuItems(menu);
  items[edge === "first" ? 0 : items.length - 1]?.focus();
}

// Stateless with typeahead off, so one instance serves every menu.
const nav = useListNavigation({ wrap: () => true });
const NAV_KEYS = new Set(["ArrowDown", "ArrowUp", "Home", "End"]);

/**
 * The keys every menu panel shares: Arrow Up/Down (wrapping), Home and End between its
 * items, and Tab, which closes the whole menu. `close` hands focus back to the trigger, and
 * the Tab — not prevented — then moves on from there, as from any button. The panels are
 * teleported to the end of <body>, so a Tab left to itself would leave the page.
 */
export function onMenuKeydown(e: KeyboardEvent, menu: HTMLElement, close: () => void) {
  if (e.key === "Tab" && !e.altKey && !e.ctrlKey && !e.metaKey) {
    close();
    return;
  }
  if (!NAV_KEYS.has(e.key)) return;
  const items = menuItems(menu);
  const to = nav.indexForKey(e, items.indexOf(document.activeElement as HTMLElement), { count: items.length });
  if (to === null) return; // a modified key: someone else's
  e.preventDefault();
  items[to]?.focus();
}

/**
 * Every panel a menu owns — its own and any open sub-menu's. All teleported, so found by
 * the owner attribute each stamps, not by tree: `data-cui-menu-owner` set to the menu
 * context's `ownerId`.
 */
export const menuPanels = (ownerId: string | undefined): Iterable<HTMLElement> =>
  ownerId ? document.querySelectorAll<HTMLElement>(`[data-cui-menu-owner="${ownerId}"]`) : [];

/** Whether `node` is inside one of the menu's panels. */
export function inMenuPanels(ownerId: string | undefined, node: Node | null | undefined) {
  if (!node) return false;
  for (const panel of menuPanels(ownerId)) if (panel.contains(node)) return true;
  return false;
}

/**
 * On close, put focus back on `target` — but only if it is inside the menu now. Escape and
 * choosing an item leave it there, and without this a keyboard user lands on <body>; a
 * click outside has already moved it where the user wanted, and that stays.
 */
export function restoreMenuFocus(target: Element | null | undefined, ownerId: string | undefined) {
  if (!(target instanceof HTMLElement) || !inMenuPanels(ownerId, document.activeElement)) return;
  if (target.isConnected) target.focus({ preventScroll: true });
  // Gone — a virtualised grid row's trigger, scrolled out while the menu was open: ask its
  // owner for it back by key, as an overlay does (utils/focusRestore). A detached subtree
  // still knows its ancestors, so the key is still there to read.
  else returnFocus(null, restoreKeyOf(target));
}

