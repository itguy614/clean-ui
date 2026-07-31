import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { registerEditorInstance, translateCodeMirrorError } from "../duplicate-guard";

describe("registerEditorInstance", () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    warn.mockRestore();
  });

  it("registers silently on first use", () => {
    const g: { __CUI_EDITOR_INSTANCE__?: string } = {};
    registerEditorInstance("1.2.0", g);
    expect(g.__CUI_EDITOR_INSTANCE__).toBe("1.2.0");
    expect(warn).not.toHaveBeenCalled();
  });

  it("stays silent when the same version registers again", () => {
    const g: { __CUI_EDITOR_INSTANCE__?: string } = {};
    registerEditorInstance("1.2.0", g);
    registerEditorInstance("1.2.0", g);
    expect(warn).not.toHaveBeenCalled();
  });

  it("warns once, naming both versions, on a version mismatch", () => {
    const g: { __CUI_EDITOR_INSTANCE__?: string } = {};
    registerEditorInstance("1.2.0", g);
    registerEditorInstance("1.3.0", g);

    expect(warn).toHaveBeenCalledOnce();
    const message = warn.mock.calls[0][0] as string;
    expect(message).toContain("1.2.0");
    expect(message).toContain("1.3.0");
    expect(message).toMatch(/dedupe/i);
    expect(message).toMatch(/peer dependency/i);
  });

  it("does not re-warn for a repeated identical mismatch", () => {
    const g: { __CUI_EDITOR_INSTANCE__?: string } = {};
    registerEditorInstance("2.0.1", g);
    registerEditorInstance("2.0.2", g);
    registerEditorInstance("2.0.2", g);

    expect(warn).toHaveBeenCalledOnce();
  });
});

describe("translateCodeMirrorError", () => {
  it("re-explains CodeMirror's 'Unrecognized extension value' error with the concrete fix", () => {
    const original = new Error("Unrecognized extension value in extension set ([object Object])");
    const translated = translateCodeMirrorError(original);

    expect(translated.message).toMatch(/two copies of @codemirror\/state/i);
    expect(translated.message).toMatch(/codemirror/i);
    expect(translated.message).toContain(original.message);
    expect(translated.cause).toBe(original);
  });

  it("passes through an unrelated error unchanged", () => {
    const original = new Error("some other CodeMirror error");
    const translated = translateCodeMirrorError(original);
    expect(translated).toBe(original);
  });

  it("wraps a non-Error throw value", () => {
    const translated = translateCodeMirrorError("a string throw");
    expect(translated).toBeInstanceOf(Error);
    expect(translated.message).toBe("a string throw");
  });
});
