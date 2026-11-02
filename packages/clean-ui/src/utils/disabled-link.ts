/**
 * The element for a disabled link (#422): an `<a>` with its `href`/`to` dropped, so it can't
 * be focused or followed whatever the CSS does, and `role` to keep it announced as what it
 * was. `undefined` unless this is a link and disabled. The caller still holds back `click`,
 * which an `<a>` without `href` fires. CuiButton and CuiListItem share it.
 */
export function disabledLink(
  target: { href?: string; to?: unknown },
  disabled: boolean,
  role: "link" | "button" = "link",
): { is: "a"; attrs: { role: "link" | "button"; "aria-disabled": "true" } } | undefined {
  if (!disabled || !(target.href || target.to)) return undefined;
  return { is: "a", attrs: { role, "aria-disabled": "true" } };
}
