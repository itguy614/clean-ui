import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { resolveLiveRegion } from "../../utils/liveRegion";
import CuiAlert from "../CuiAlert.vue";
import CuiBanner from "../CuiBanner.vue";
import CuiToast from "../CuiToast.vue";

describe("resolveLiveRegion", () => {
  it("maps error to an assertive alert", () => {
    expect(resolveLiveRegion("error")).toEqual({
      role: "alert",
      "aria-live": "assertive",
      "aria-atomic": "true",
    });
  });

  it("maps non-error severities to a polite status", () => {
    for (const color of ["success", "info", "warning", "primary", "surface"] as const) {
      expect(resolveLiveRegion(color)).toEqual({
        role: "status",
        "aria-live": "polite",
        "aria-atomic": "true",
      });
    }
  });

  it("honors an explicit override over the color default", () => {
    expect(resolveLiveRegion("success", "assertive").role).toBe("alert");
    expect(resolveLiveRegion("error", "polite").role).toBe("status");
  });

  it('emits no role and aria-live="off" when disabled', () => {
    expect(resolveLiveRegion("error", "off")).toEqual({ "aria-live": "off" });
  });
});

describe("feedback components expose live-region semantics", () => {
  it("CuiAlert: error → alert/assertive, success → status/polite", () => {
    const err = mount(CuiAlert, { props: { color: "error" } });
    expect(err.attributes("role")).toBe("alert");
    expect(err.attributes("aria-live")).toBe("assertive");

    const ok = mount(CuiAlert, { props: { color: "success" } });
    expect(ok.attributes("role")).toBe("status");
    expect(ok.attributes("aria-live")).toBe("polite");
  });

  it("CuiAlert: live=off removes the live region", () => {
    const wrapper = mount(CuiAlert, { props: { color: "error", live: "off" } });
    expect(wrapper.attributes("role")).toBeUndefined();
    expect(wrapper.attributes("aria-live")).toBe("off");
  });

  it("CuiBanner: default (primary) is polite, error is assertive", () => {
    const banner = mount(CuiBanner);
    expect(banner.attributes("role")).toBe("status");
    const err = mount(CuiBanner, { props: { color: "error" } });
    expect(err.attributes("role")).toBe("alert");
  });

  it("CuiToast: success → status, error → alert", () => {
    const ok = mount(CuiToast, { props: { color: "success", autoDismiss: 0 } });
    expect(ok.attributes("role")).toBe("status");
    expect(ok.attributes("aria-live")).toBe("polite");

    const err = mount(CuiToast, { props: { color: "error", autoDismiss: 0 } });
    expect(err.attributes("role")).toBe("alert");
    expect(err.attributes("aria-live")).toBe("assertive");
  });
});
