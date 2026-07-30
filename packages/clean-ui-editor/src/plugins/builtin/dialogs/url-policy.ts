/**
 * A `javascript:` (or similarly script-executing) URL is valid CommonMark
 * link syntax and the likeliest real vulnerability in this feature — a
 * relative URL (no scheme at all) is safe by construction and always
 * allowed; only an *explicit*, disallowed scheme is rejected.
 */
const ALLOWED_SCHEMES = new Set(["http:", "https:", "mailto:"]);

export function isAllowedUrl(url: string): boolean {
  const match = /^([a-z][a-z0-9+.-]*:)/i.exec(url.trim());
  if (!match) return true;
  return ALLOWED_SCHEMES.has(match[1]!.toLowerCase());
}
