import { describe, it, expect, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { h, defineComponent, nextTick, onMounted, ref } from "vue";
import CuiModal from "../../components/CuiModal.vue";
import { frames } from "../../../../../config/test/browser-helpers";

/**
 * Found reviewing #420 — the markdown editor's link dialog focuses its URL field one tick
 * after mounting, but the overlay focused its own panel on the next animation frame, which
 * comes later, and took focus back. Real browser: jsdom's frames don't order like a paint's.
 */
describe("overlay initial focus (real browser)", () => {
  let wrapper: VueWrapper | undefined;
  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
  });

  /** Wait for a condition, frame by frame — an animation's length is not ours to assume. */
  async function until(check: () => boolean, maxFrames = 120) {
    for (let i = 0; i < maxFrames && !check(); i++) await frames(1);
    return check();
  }

  function openModal(focusField: boolean) {
    const Host = defineComponent({
      setup() {
        const visible = ref(false);
        const input = ref<HTMLInputElement>();
        onMounted(async () => {
          visible.value = true;
          await nextTick();
          if (focusField) input.value?.focus();
        });
        return () =>
          h(CuiModal, { visible: visible.value, title: "Link", "onUpdate:visible": (v: boolean) => (visible.value = v) }, () =>
            h("input", { ref: input, "data-t": "url" }),
          );
      },
    });
    wrapper = mount(Host, { attachTo: document.body });
  }

  it("keeps focus on a field the content focused itself", async () => {
    openModal(true);
    expect(await until(() => !!document.querySelector(".cui-modal--visible"))).toBe(true);
    await frames(2);
    expect((document.activeElement as HTMLElement | null)?.dataset.t).toBe("url");
  });

  it("still focuses the panel when the content focuses nothing", async () => {
    openModal(false);
    expect(await until(() => document.activeElement?.classList.contains("cui-modal") ?? false)).toBe(true);
  });
});
