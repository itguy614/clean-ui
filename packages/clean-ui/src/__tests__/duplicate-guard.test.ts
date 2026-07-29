import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { registerInstance } from "../duplicate-guard";

describe("registerInstance", () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    warn.mockRestore();
  });

  it("registers silently on first use", () => {
    const g: { __CUI_INSTANCE__?: string } = {};
    registerInstance("1.2.0", g);
    expect(g.__CUI_INSTANCE__).toBe("1.2.0");
    expect(warn).not.toHaveBeenCalled();
  });

  it("stays silent when the same version registers again", () => {
    const g: { __CUI_INSTANCE__?: string } = {};
    registerInstance("1.2.0", g);
    registerInstance("1.2.0", g);
    expect(warn).not.toHaveBeenCalled();
  });

  it("warns once, naming both versions, on a version mismatch", () => {
    const g: { __CUI_INSTANCE__?: string } = {};
    registerInstance("1.2.0", g);
    registerInstance("1.3.0", g);

    expect(warn).toHaveBeenCalledOnce();
    const message = warn.mock.calls[0][0] as string;
    expect(message).toContain("1.2.0");
    expect(message).toContain("1.3.0");
    expect(message).toMatch(/dedupe/i);
    expect(message).toMatch(/peer dependency/i);
  });

  it("does not re-warn for a repeated identical mismatch", () => {
    const g: { __CUI_INSTANCE__?: string } = {};
    registerInstance("9.9.1", g);
    registerInstance("9.9.2", g);
    registerInstance("9.9.2", g);

    expect(warn).toHaveBeenCalledOnce();
  });
});
