/**
 * The element for a disabled link, shared by every component that can render as one
 * (CuiButton, CuiListItem — #422).
 *
 * The target is dropped: an `<a>` without `href` is neither focusable nor followable, so
 * nothing reaches it by Tab, a click, a middle-click or "open in new tab", whatever the CSS
 * does. Keeping the `href` under `aria-disabled` instead leaves a live link that only the
 * stylesheet stands in front of. `role` keeps the element announced as what it was: without
 * `href` an `<a>` has no role of its own.
 *
 * Returns `undefined` unless this is a link (`href` or `to`) and disabled, so a caller can
 * write `disabledLink(…) ?? <its usual element>`.
 */
export function disabledLink(
  target: { href?: string; to?: unknown },
  disabled: boolean,
  role: "link" | "button" = "link",
): { is: "a"; attrs: { role: "link" | "button"; "aria-disabled": "true" } } | undefined {
  if (!disabled || !(target.href || target.to)) return undefined;
  return { is: "a", attrs: { role, "aria-disabled": "true" } };
}
