import { vi } from "vitest";

/**
 * Spy on a localStorage method, wherever this environment keeps it. A real jsdom `Storage`
 * has the methods on `Storage.prototype`, but Node's own `localStorage` global (which the
 * jsdom environment can inherit) carries them on the instance, so a spy on the prototype
 * never fires and an "is never called" assertion passes without checking anything.
 */
export function spyStorage(method: "getItem" | "setItem" | "removeItem") {
  const target = Object.prototype.hasOwnProperty.call(localStorage, method) ? localStorage : Storage.prototype;
  return vi.spyOn(target, method);
}
