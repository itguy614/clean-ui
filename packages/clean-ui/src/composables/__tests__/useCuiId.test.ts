import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { useCuiId } from "../useCuiId";

describe("useCuiId", () => {
  it("gives each instance in an app its own cui-prefixed id", () => {
    const Probe = defineComponent(() => {
      const id = useCuiId("probe");
      return () => h("i", { id });
    });
    const wrapper = mount(defineComponent(() => () => [h(Probe), h(Probe), h(Probe)]));
    const ids = wrapper.findAll("i").map((i) => i.attributes("id"));
    expect(ids.every((id) => /^cui-probe-\S+$/.test(id!))).toBe(true);
    expect(new Set(ids).size).toBe(3);
  });
});
