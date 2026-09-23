import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import CuiBanner from "../CuiBanner.vue";
import CuiAlert from "../CuiAlert.vue";
import CuiToast from "../CuiToast.vue";
import CuiIcon from "../CuiIcon.vue";
import { COLOR_ICON_MAP } from "../../utils/colorIconMap";

/**
 * #119 — the role icon was welded to the colour, and `noIcon` could suppress it but not
 * replace it. All three feedback components now take the same `icon` prop and an `#icon`
 * slot.
 */
describe("feedback components: the role icon can be replaced", () => {
  // Scoped to the role-icon container: Banner and Toast also render a dismiss ✕, so
  // asking the whole component for "a CuiIcon" finds that one instead.
  describe.each([
    ["CuiBanner", CuiBanner, ".cui-banner__icon"],
    ["CuiAlert", CuiAlert, ".cui-alert__icon"],
    ["CuiToast", CuiToast, ".cui-toast__icon"],
  ])("%s", (_name, component, iconSelector) => {
    const slot = (w: ReturnType<typeof mount>) => w.find(iconSelector);
    const glyph = (w: ReturnType<typeof mount>) => slot(w).findComponent(CuiIcon).props("name");
    it("defaults to the role's icon", () => {
      const w = mount(component as never, { props: { color: "success" } });
      expect(glyph(w)).toBe(COLOR_ICON_MAP.success);
    });

    it("renders a registered name from the icon prop", () => {
      const w = mount(component as never, { props: { color: "error", icon: "check-circle" } });
      expect(glyph(w)).toBe("check-circle");
    });

    it("renders anything else as text, so an emoji still works", () => {
      // CuiToast has always taken an emoji here and a programmatic toast has no slot to
      // fall back on, so this had to keep working while the prop gained name support.
      const w = mount(component as never, { props: { color: "success", icon: "🚀" } });
      expect(slot(w).text()).toContain("🚀");
      expect(slot(w).findComponent(CuiIcon).exists()).toBe(false);
    });

    it("lets the #icon slot replace it entirely", () => {
      const w = mount(component as never, {
        props: { color: "error" },
        slots: { icon: () => h("span", { class: "mine" }, "custom") },
      });
      expect(w.find(".mine").exists()).toBe(true);
    });

    it("still suppresses it with noIcon", () => {
      const w = mount(component as never, { props: { color: "error", noIcon: true, icon: "check-circle" } });
      expect(slot(w).exists()).toBe(false);
    });
  });
});

describe("COLOR_ICON_MAP", () => {
  it("gives error its own glyph, not a cross and not the warning one", () => {
    // A cross reads as "close", and beside a dismissible component's own ✕ it renders as
    // a second close button. Reusing `warning-circle` would instead leave colour as the
    // only thing separating error from warning (WCAG 1.4.1).
    expect(COLOR_ICON_MAP.error).toBe("warning-octagon");
  });


});
