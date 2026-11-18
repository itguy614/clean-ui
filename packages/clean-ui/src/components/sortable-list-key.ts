import { __DEV__, warnOnce } from "../utils/devWarn";
// Module-scoped: the bundler replaces `process.env.NODE_ENV`, and Node's types stay out of the build.
declare const process: { env: { NODE_ENV?: string } };

/** An object item with no `itemLabel` and no label-like property is named by its position: say so. */
export function warnNoLabel(): void {
  if (__DEV__ && process.env.NODE_ENV !== "production") {
    warnOnce("[clean-ui] CuiSortableList: an item has no name for assistive tech, so its position is used and it changes as the item moves. Set item-label, or give items a label, name, title or text.");
  }
}

/**
 * What identifies a CuiSortableList item across reorders (#198): `itemKey` as a function's
 * result or a property name (default `id`), a primitive item as itself. An object with no
 * usable key falls back to its position, which loses its DOM and focus when it moves.
 * Lives outside the SFC, which a generic `<script setup>` cannot give a module-scoped `process`.
 */
export function sortableKey<T>(item: T, index: number, itemKey?: string | ((item: T) => string | number)): string | number {
  if (typeof itemKey === "function") return itemKey(item);
  if (item !== null && typeof item === "object") {
    const name = itemKey ?? "id";
    const key = (item as Record<string, unknown>)[name];
    if (typeof key === "string" || typeof key === "number") return key;
    if (__DEV__ && process.env.NODE_ENV !== "production") {
      warnOnce(`[clean-ui] CuiSortableList: an item has no "${name}" key, so its position is used and it loses its DOM and focus when it moves. Set item-key to a unique, stable property.`);
    }
    return index;
  }
  return item as string | number;
}
