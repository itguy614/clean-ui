/**
 * A random v4 UUID for data the library stores, such as a saved grid view's id. Internal.
 *
 * `crypto.randomUUID()` exists only in a secure context (HTTPS or localhost), so a page
 * served over plain HTTP — a device's own web UI, an intranet tool — threw on it (#370).
 * `crypto.getRandomValues()` is there in every context, so the fallback builds the same
 * shape from it. Not for element ids, which must match between server render and
 * hydration: those come from `useCuiId`.
 */
export function randomId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; // version 4
  b[8] = (b[8] & 0x3f) | 0x80; // RFC 4122 variant
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
