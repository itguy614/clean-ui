/**
 * A `javascript:` (or similarly script-executing) URL is valid CommonMark
 * link syntax and the likeliest real vulnerability in this feature — a
 * relative URL (no scheme at all) is safe by construction and always
 * allowed; only an *explicit*, disallowed scheme is rejected. Shared between
 * the link/image dialogs (FR14) and the supplied render adapter (FR39/FR42)
 * so both enforce the exact same policy.
 */
const ALLOWED_SCHEMES = new Set(["http:", "https:", "mailto:", "tel:"]);

/**
 * The URL a browser parses from `url`: the WHATWG URL parser removes every tab
 * and line break and trims C0 controls and spaces from both ends, so
 * `java\tscript:` is the `javascript:` scheme (#408). The scheme is read from
 * this, never from the raw string.
 */
export function browserUrl(url: string): string {
  return url.replace(/[\t\r\n]/g, "").replace(/^[\x00-\x20]+|[\x00-\x20]+$/g, "");
}

export function isAllowedUrl(url: string): boolean {
  const match = /^([a-z][a-z0-9+.-]*:)/i.exec(browserUrl(url));
  if (!match) return true;
  return ALLOWED_SCHEMES.has(match[1]!.toLowerCase());
}
