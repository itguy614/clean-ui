import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import main from "../../styles/main.css?inline";
import { installTokens } from "../../../../../config/test/browser-helpers";
import CuiAvatarGroup from "../../components/CuiAvatarGroup.vue";
import CuiAvatar from "../../components/CuiAvatar.vue";

/**
 * #164 — the "+N" avatar closes the stack at its visual right end. The group is `row-reverse`,
 * so that is the first child in the DOM; it overlaps its neighbour like the others do.
 */
describe("CuiAvatarGroup overflow avatar (real browser)", () => {
  let removeTokens: () => void;
  beforeAll(() => (removeTokens = installTokens(main)));
  afterAll(() => removeTokens());

  let w: VueWrapper | undefined;
  afterEach(() => {
    w?.unmount();
    w = undefined;
  });

  function mountGroup() {
    w = mount(
      defineComponent({
        render: () =>
          h(CuiAvatarGroup, { max: 3 }, () => [1, 2, 3, 4, 5, 6].map((n) => h(CuiAvatar, { key: n, name: `N${n}` }))),
      }),
      { attachTo: document.body },
    );
    const rect = (el: Element) => el.getBoundingClientRect();
    const group = document.querySelector(".cui-avatar-group")!;
    const all = [...group.querySelectorAll(".cui-avatar")];
    const overflow = group.querySelector(".cui-avatar-group__overflow")!;
    return { all, overflow, rect };
  }

  it("sits at the right end of the stack", () => {
    const { all, overflow, rect } = mountGroup();
    expect(all).toHaveLength(4);
    for (const el of all.filter((e) => e !== overflow)) {
      expect(rect(overflow).right).toBeGreaterThan(rect(el).right);
      expect(rect(overflow).left).toBeGreaterThan(rect(el).left);
    }
  });

  it("overlaps its neighbour as the other avatars do, and paints beneath it", () => {
    const { all, rect } = mountGroup();
    const overlaps = all.slice(0, -1).map((el, i) => rect(el).left - rect(all[i + 1]).right);
    // Every adjacent pair overlaps by the same amount (the overflow pair included).
    expect(overlaps.every((o) => o < 0 && Math.abs(o - overlaps[0]) < 0.5)).toBe(true);
    // No avatar carries a stacking value of its own at rest.
    expect(all.every((el) => getComputedStyle(el).zIndex === "auto")).toBe(true);
  });
});
