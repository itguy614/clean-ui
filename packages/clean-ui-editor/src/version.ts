// Replaced with a literal by the `define` in vite.config.ts / vitest.config.ts.
declare const __CUI_EDITOR_VERSION__: string;

/**
 * The published version of this package, matching `package.json` exactly.
 * Inlined at build time — never read from the filesystem at runtime — so a
 * consumer can detect a mismatch, and so the duplicate-instance guard below
 * has something to stamp.
 */
export const version: string = __CUI_EDITOR_VERSION__;
