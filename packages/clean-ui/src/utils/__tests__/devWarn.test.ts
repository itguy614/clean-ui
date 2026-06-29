import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { warnVariantColor } from "../devWarn";

const BADGE_VARIANTS = ["solid", "subtle", "outline"] as const;

describe("warnVariantColor", () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    warn.mockRestore();
  });

  it("is silent for valid variant + color", () => {
    warnVariantColor("CuiBadge", { value: "subtle", allowed: BADGE_VARIANTS }, "primary");
    expect(warn).not.toHaveBeenCalled();
  });

  it("flags a color name passed to variant and points at the color prop", () => {
    warnVariantColor("CuiBadge", { value: "info", allowed: BADGE_VARIANTS }, "primary");
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toContain('variant="info" is not valid');
    expect(warn.mock.calls[0][0]).toContain(`did you mean color="info"?`);
  });

  it("flags an unknown variant without a color hint", () => {
    warnVariantColor("CuiButton", { value: "zzbogus", allowed: BADGE_VARIANTS }, "primary");
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toContain('variant="zzbogus" is not valid');
    expect(warn.mock.calls[0][0]).not.toContain("did you mean");
  });

  it("flags an invalid color role and suggests error for danger", () => {
    warnVariantColor("CuiAlert", { value: "subtle", allowed: BADGE_VARIANTS }, "danger");
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toContain('color="danger" is not a valid role');
    expect(warn.mock.calls[0][0]).toContain(`Use color="error".`);
  });

  it("flags an arbitrary invalid color without the danger alias", () => {
    warnVariantColor("CuiAlert", { value: "subtle", allowed: BADGE_VARIANTS }, "turquoise");
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toContain('color="turquoise" is not a valid role');
    expect(warn.mock.calls[0][0]).not.toContain(`Use color="error".`);
  });

  it("warns only once for a repeated identical message", () => {
    warnVariantColor("CuiBadge", { value: "qqrepeat", allowed: BADGE_VARIANTS }, "primary");
    warnVariantColor("CuiBadge", { value: "qqrepeat", allowed: BADGE_VARIANTS }, "primary");
    expect(warn).toHaveBeenCalledOnce();
  });
});
