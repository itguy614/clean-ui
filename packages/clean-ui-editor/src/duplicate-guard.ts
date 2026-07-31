import { version } from "./version";

const warned = new Set<string>();
function warnOnce(message: string): void {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(message);
}

interface CleanUIEditorGlobal {
  __CUI_EDITOR_INSTANCE__?: string;
}

/**
 * Two copies of @codemirror/state in one page break `instanceof` checks
 * between extensions built by different copies, surfacing as CodeMirror's
 * own "Unrecognized extension value" error — which reads like a bug in the
 * consumer's own code, not a packaging problem (see translateCodeMirrorError
 * below). Stamp this package's version on a shared global the first time an
 * editor is actually constructed — not at module load, since the failure is
 * about *combining* extensions, which only happens once an EditorState is
 * built — and warn once if a second, different version shows up. A
 * different clean-ui-editor version is the practical proxy for "a different
 * @codemirror/state resolution," since this package controls which one it
 * imports.
 */
export function registerEditorInstance(
  current: string = version,
  g: CleanUIEditorGlobal = globalThis as CleanUIEditorGlobal,
): void {
  const existing = g.__CUI_EDITOR_INSTANCE__;
  if (existing === undefined) {
    g.__CUI_EDITOR_INSTANCE__ = current;
    return;
  }
  if (existing === current) return;

  warnOnce(
    `[clean-ui-editor] Detected two copies of @itguy614/clean-ui-editor: v${existing} and ` +
      `v${current}. Each likely resolves its own copy of @codemirror/state, which breaks ` +
      `CodeMirror's instanceof-based extension checks and surfaces as "Unrecognized extension ` +
      `value" — a CodeMirror error that reads like a bug in your own code, not a packaging one. ` +
      `Fix: dedupe @itguy614/clean-ui-editor to one copy (check your lockfile / bundler ` +
      `resolution), or widen the consuming package's peer dependency range so both resolve to ` +
      `the same install.`,
  );
}

const UNRECOGNIZED_EXTENSION_RE = /Unrecognized extension value/i;

/**
 * Re-explains CodeMirror's own "Unrecognized extension value" error — raised
 * when extensions from two different @codemirror/state copies get combined —
 * with the concrete, actionable cause instead of letting it propagate raw.
 * The original message names no packaging concept a consumer could act on.
 */
export function translateCodeMirrorError(error: unknown): Error {
  if (error instanceof Error && UNRECOGNIZED_EXTENSION_RE.test(error.message)) {
    return new Error(
      `[clean-ui-editor] CodeMirror rejected an extension because it doesn't recognize it as ` +
        `its own — the near-certain cause is two copies of @codemirror/state in this page (one ` +
        `from this package, one from somewhere else). Dedupe @itguy614/clean-ui-editor and/or ` +
        `CodeMirror packages to one copy, or import CodeMirror only through ` +
        `@itguy614/clean-ui-editor/codemirror so plugins share this package's instance.\n\n` +
        `Original error: ${error.message}`,
      { cause: error },
    );
  }
  return error instanceof Error ? error : new Error(String(error));
}
