import { describe, it, expect, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h, useId } from "vue";
import { mountStandaloneDialog } from "../mount-standalone";

// #182 made clean-ui's generated ids come from useId(), which is unique per Vue *app*.
// The editor opens its link/image dialogs in a second app on the same document, so
// without its own idPrefix that app's ids repeated the host app's and cross-wired ARIA.
const Probe = defineComponent(() => {
  const id = useId(); // what clean-ui's useCuiId() builds on
  return () => h("i", { id, class: "probe" });
});

describe("mountStandaloneDialog", () => {
  const cleanups: Array<() => void> = [];
  afterEach(() => {
    cleanups.splice(0).forEach((c) => c());
    document.body.innerHTML = "";
  });

  it("gives the standalone app ids that cannot collide with the host app's", () => {
    const host = mount(Probe, { attachTo: document.body });
    cleanups.push(mountStandaloneDialog(Probe, {}), mountStandaloneDialog(Probe, {}));
    const ids = [...document.querySelectorAll(".probe")].map((el) => el.id);
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
    host.unmount();
  });
});
