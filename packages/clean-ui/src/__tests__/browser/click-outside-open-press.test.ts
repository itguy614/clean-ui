import { describe, it, expect, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { userEvent } from "@vitest/browser/context";
import { defineComponent, h, ref } from "vue";
import { useClickOutside } from "../../composables/useClickOutside";
import { frames, mountHosts } from "./helpers";

/**
 * Review of #203. With click-outside attached only while open, a panel opened from a
 * mousedown handler attached its listener in a microtask *during* that press's dispatch:
 * a native event runs microtasks between listeners, so the listener then received the
 * same press as it bubbled to the document, and closed the panel the instant it opened.
 *
 * Real browser, real input: jsdom (and a scripted dispatchEvent anywhere) runs the whole
 * dispatch synchronously, with no microtask checkpoint between listeners.
 */
describe("useClickOutside armed after the opening press (real browser)", () => {
  const { host, track, cleanup } = mountHosts();
  afterEach(cleanup);

  it("a panel opened on mousedown stays open", async () => {
    const open = ref(false);
    const panel = ref<HTMLElement | null>(null);
    const el = host({});
    track(
      mount(
        defineComponent(() => {
          useClickOutside([panel], () => (open.value = false), { enabled: open });
          return () =>
            h("div", [
              h("button", { id: "opener", onMousedown: () => (open.value = true) }, "Open"),
              open.value ? h("div", { ref: panel, id: "panel" }, "Panel") : null,
            ]);
        }),
        { attachTo: el },
      ),
    );

    await userEvent.click(document.getElementById("opener")!);
    await frames(4);
    expect(open.value).toBe(true);

    await userEvent.click(document.body, { position: { x: 1, y: 1 } });
    await frames(2);
    expect(open.value).toBe(false);
  });
});
