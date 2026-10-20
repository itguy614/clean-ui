import { describe, it, expect, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { userEvent } from "@vitest/browser/context";
import { h } from "vue";
import CuiContextMenu from "../../components/CuiContextMenu.vue";
import CuiDropdownItem from "../../components/CuiDropdownItem.vue";
import { frames, mountHosts } from "./helpers";

// #291: the first right-click opened the panel invisible. Real input, real scheduler.
describe("CuiContextMenu first open (real browser)", () => {
  const { host, track, cleanup } = mountHosts();
  afterEach(cleanup);

  it("is visible on the very first right-click", async () => {
    const el = host({});
    track(
      mount(CuiContextMenu, {
        attachTo: el,
        slots: {
          default: () => h("div", { id: "area", style: "width: 200px; height: 100px" }, "Area"),
          menu: () => h(CuiDropdownItem, () => "Rename"),
        },
      }),
    );
    await userEvent.click(document.getElementById("area")!, { button: "right" });
    await frames(4);
    const panel = document.querySelector<HTMLElement>(".cui-context-menu__panel");
    expect(panel).not.toBeNull();
    expect(getComputedStyle(panel!).visibility).toBe("visible");
  });
});
