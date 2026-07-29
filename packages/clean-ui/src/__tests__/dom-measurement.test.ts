import { describe, it, expect } from "vitest";
import { defineComponent, h, onMounted, ref } from "vue";
import { mount } from "@vue/test-utils";

// jsdom has no real layout engine, so Range.prototype.getBoundingClientRect /
// getClientRects are entirely unimplemented there by default — calling them
// throws "is not a function". A DOM-measuring editor (cursor/selection
// positioning) needs these to mount at all under jsdom; see the polyfill in
// src/test-setup.ts. Without it, a test like this one fails with a confusing
// "not a function" error that reads as "this cannot be tested" rather than a
// missing stub.
describe("Range measurement polyfill (jsdom)", () => {
  it("mounts a component that measures a DOM Range during setup", () => {
    const measured = ref<DOMRect | null>(null);

    const RangeMeasuringComponent = defineComponent({
      setup() {
        const rootRef = ref<HTMLElement | null>(null);
        onMounted(() => {
          const el = rootRef.value!;
          const range = document.createRange();
          range.selectNodeContents(el);
          measured.value = range.getBoundingClientRect();
          range.getClientRects();
        });
        return () => h("div", { ref: rootRef }, "measure me");
      },
    });

    expect(() => mount(RangeMeasuringComponent, { attachTo: document.body })).not.toThrow();
    expect(measured.value).not.toBeNull();
    expect(measured.value).toMatchObject({ x: 0, y: 0, width: 0, height: 0 });
  });
});
