// Replaced with a literal by the `define` in vite.config.ts / vitest.config.ts.
declare const __CUI_VERSION__: string;

/**
 * The published version of this package, matching `package.json` exactly.
 * Inlined at build time — never read from the filesystem at runtime — so a
 * satellite package can detect a mismatch against its peer range.
 */
export const version: string = __CUI_VERSION__;
