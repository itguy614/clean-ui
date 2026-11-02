import { describe, it, expect, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h, ref, watch } from "vue";
import { useScrollSpy } from "../../composables/useScrollSpy";
import { frames, mountHosts, settleScroll } from "../../../../../config/test/browser-helpers";

/**
 * #192 — which section is current comes from a real IntersectionObserver over a real
 * scroller, with a sticky header covering its top. jsdom has neither layout nor observer.
 *
 * Geometry: a 400px scroller, a 60px sticky header, then one 90px block per section with a
 * 24px heading at its top. Heading i sits at 60 + 90i - scrollTop from the scroller's top.
 * The band is the top half (`-50%` bottom), less the header when `offset` is 60: 60–200px.
 */
const IDS = ["a", "b", "c", "d", "e", "f"];

describe("useScrollSpy (real browser)", () => {
  const { host, track, cleanup } = mountHosts();
  afterEach(cleanup);

  function mountSpy(offset: number) {
    let api!: ReturnType<typeof useScrollSpy>;
    const rootEl = ref<HTMLElement | null>(null);
    const wrapper = track(
      mount(
        defineComponent(() => {
          api = useScrollSpy(IDS, { root: rootEl, offset });
          return () =>
            h("div", { ref: rootEl, style: "height: 400px; overflow: auto; position: relative" }, [
              h("header", { style: "position: sticky; top: 0; height: 60px; background: #fff; z-index: 1" }),
              ...IDS.map((id) =>
                h("section", { style: "height: 90px; margin: 0" }, [h("h2", { id, style: "height: 24px; margin: 0" }, id)]),
              ),
              h("div", { style: "height: 800px" }),
            ]);
        }),
        { attachTo: host() },
      ),
    );
    const root = wrapper.element as HTMLElement;
    return { api, root };
  }

  it("picks the topmost heading in the band as the page scrolls", async () => {
    const { api, root } = mountSpy(60);
    // a at 60 and b at 150 are both in the band: the topmost wins.
    await expect.poll(() => api.activeId.value).toBe("a");
    // a at 10 (under the header), b at 100, c at 190: b.
    root.scrollTop = 50;
    await expect.poll(() => api.activeId.value).toBe("b");
  });

  it("does not count a heading hidden under the sticky header", async () => {
    // c at 10, behind the header; d at 100. With the header offset, d is current…
    const withOffset = mountSpy(60);
    withOffset.root.scrollTop = 230;
    await expect.poll(() => withOffset.api.activeId.value).toBe("d");
    cleanup();
    // …without it, c still counts as in the band and wins as the topmost.
    const without = mountSpy(0);
    without.root.scrollTop = 230;
    await expect.poll(() => without.api.activeId.value).toBe("c");
  });

  it("keeps a clicked section current while the smooth scroll passes others", async () => {
    const { api, root } = mountSpy(60);
    await expect.poll(() => api.activeId.value).toBe("a");

    api.setActive("e");
    root.scrollTo({ top: 320, behavior: "smooth" });
    const seen = new Set<string | null>();
    for (let i = 0; i < 60 && root.scrollTop < 320; i++) {
      await frames(1);
      seen.add(api.activeId.value);
    }
    await settleScroll(root);
    await frames(3);
    expect([...seen]).toEqual(["e"]);
    expect(api.activeId.value).toBe("e");

    // Settled: a scroll of the reader's own is tracked again.
    root.scrollTop = 50;
    await expect.poll(() => api.activeId.value).toBe("b");
  });

  it("scrollTo goes straight to the target, which lands just below the header (#423)", async () => {
    const { api, root } = mountSpy(60);
    await expect.poll(() => api.activeId.value).toBe("a");

    // Watch every change, not a per-frame sample: a flicker through b–d would show here.
    const seen: (string | null)[] = [];
    const stop = watch(api.activeId, (id) => seen.push(id), { flush: "sync" });
    api.scrollTo("e");
    for (let i = 0; i < 60 && root.scrollTop < 360; i++) await frames(1);
    await settleScroll(root);
    await frames(3);
    stop();

    expect(seen).toEqual(["e"]);
    // e's heading sits at 60 + 90·4 = 420: scrolled to 420 − the 60px header.
    expect(root.scrollTop).toBe(360);
    const heading = document.getElementById("e")!;
    expect(heading.getBoundingClientRect().top - root.getBoundingClientRect().top).toBe(60);
  });
});
