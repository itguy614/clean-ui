/**
 * A `javascript:` (or similarly script-executing) URL is valid CommonMark
 * link syntax and the likeliest real vulnerability in this feature — a
 * relative URL (no scheme at all) is safe by construction and always
 * allowed; only an *explicit*, disallowed scheme is rejected. Shared between
 * the link/image dialogs (FR14) and the supplied render adapter (FR39/FR42)
 * so both enforce the exact same policy.
 */
const ALLOWED_SCHEMES = new Set(["http:", "https:", "mailto:", "tel:"]);

export function isAllowedUrl(url: string): boolean {
  const match = /^([a-z][a-z0-9+.-]*:)/i.exec(url.trim());
  if (!match) return true;
  return ALLOWED_SCHEMES.has(match[1]!.toLowerCase());
}
